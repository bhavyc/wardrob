import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'HUB_PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Hub access required.' }, { status: 403 });
    }

    const { bookingId, inspectionType, grade, deductionAmount = 0, evidencePhotos = [], isItemComplete = true, missingPartsDescription = '', shelfLocation = '' } = await request.json();

    if (!bookingId || !inspectionType) {
      return NextResponse.json({ success: false, error: 'Missing bookingId or inspectionType' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { lister: true } } }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (inspectionType === 'LISTER_TO_HUB_INTAKE') {
      // 1. Log intake photos
      await prisma.damageReport.create({
        data: {
          bookingId,
          inspectionType: 'LISTER_TO_HUB_INTAKE',
          grade: 'A_NO_ISSUE', // Intake baseline
          evidencePhotos, 
        }
      });

      // Generate a unique SKU for the item if it doesn't have one
      const generatedSku = booking.listing.sku || `WR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 2. Mark the listing as AT_HUB and assign SKU
      const updatedListing = await prisma.listing.update({
        where: { id: booking.listingId },
        data: { 
          status: 'AT_HUB',
          sku: generatedSku,
          ...(shelfLocation && { shelfLocation: shelfLocation.trim() })
        }
      });

      // 3. Mark the Lister->Hub shipment as DELIVERED
      const listerShipment = await prisma.shipment.findFirst({
        where: { bookingId, leg: 'LISTER_TO_HUB' }
      });
      if (listerShipment) {
        await prisma.shipment.update({
          where: { id: listerShipment.id },
          data: { status: 'DELIVERED' }
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Intake inspection logged. Item is now AT_HUB.',
        sku: generatedSku
      });
    }

    if (inspectionType === 'PRE_DISPATCH') {
      // Create baseline inspection
      await prisma.damageReport.create({
        data: {
          bookingId,
          inspectionType: 'PRE_DISPATCH',
          grade: 'A_NO_ISSUE', // Usually A before dispatch
          evidencePhotos, // True baseline photos
        }
      });

      // Update Booking status to OUT_FOR_DELIVERY, clear shelfLocation as it leaves the Hub
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'OUT_FOR_DELIVERY' }
      });
      await prisma.listing.update({
        where: { id: booking.listingId },
        data: { shelfLocation: null }
      });

      // Create Leg 2 Shipment (HUB_TO_RENTER) so Hub Admin can track and deliver it
      await prisma.shipment.create({
        data: {
          bookingId,
          leg: 'HUB_TO_RENTER',
          status: 'PENDING',
        }
      });

      // Also log cleaning
      await prisma.cleaningLog.create({
        data: {
          bookingId,
          partnerId: user.userId,
          status: 'SANITIZED',
          dispatchedAt: new Date()
        }
      });

      return NextResponse.json({ success: true, message: 'Pre-dispatch inspection logged. Item ready for renter.' });
    } 
    
    else if (inspectionType === 'POST_RETURN') {
      if (booking.status === 'COMPLETED' || booking.refundInitiatedAt) {
        return NextResponse.json({ success: false, error: 'Refund/Inspection already processed or in-progress for this booking.' }, { status: 400 });
      }

      if (!grade) {
        return NextResponse.json({ success: false, error: 'Grade (A/B/C) is required for post-return inspection' }, { status: 400 });
      }

      // 1. Guard against duplicate post-return inspection
      const existingPostReturn = await prisma.damageReport.findFirst({
        where: { bookingId, inspectionType: 'POST_RETURN' }
      });
      if (existingPostReturn) {
        return NextResponse.json({ success: false, error: 'Return inspection has already been recorded for this booking.' }, { status: 400 });
      }

      // Calculate Late Days and Late Fee
      const actualReturnDate = new Date();
      const expectedEndDate = new Date(booking.endDate);
      let lateDays = 0;
      let lateFee = 0;
      
      if (actualReturnDate > expectedEndDate) {
        // Find difference in days
        const diffTime = actualReturnDate.getTime() - expectedEndDate.getTime();
        lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Steep Late Fee = 250/day (for unauthorized late returns)
        lateFee = lateDays * 250;
      }

      // If Grade C, evidence is mandatory
      if (grade === 'C_MAJOR' && evidencePhotos.length === 0) {
        return NextResponse.json({ success: false, error: 'Evidence photos are mandatory for Grade C deductions' }, { status: 400 });
      }
      
      if (!isItemComplete && !missingPartsDescription) {
        return NextResponse.json({ success: false, error: 'Description is required when item is marked incomplete.' }, { status: 400 });
      }

      // Total Deductions
      const totalRequestedDeduction = deductionAmount + lateFee;
      const maxDeduction = Number(booking.securityDeposit);
      
      const finalDeduction = Math.min(totalRequestedDeduction, maxDeduction);
      const excessDeduction = Math.max(0, totalRequestedDeduction - maxDeduction);

      const report = await prisma.damageReport.create({
        data: {
          bookingId,
          inspectionType: 'POST_RETURN',
          grade,
          deductionAmount: finalDeduction,
          evidencePhotos,
          isItemComplete,
          missingPartsDescription
        }
      });

      const refundAmount = maxDeduction - finalDeduction;

      // 1. Pre-flight write
      if (refundAmount > 0) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { refundInitiatedAt: new Date() }
        });
      }

      // 2. Execute external Razorpay refund
      let refundSuccess = false;
      let gatewayRefundId = null;

      if (refundAmount > 0 && booking.razorpayPaymentId) {
        try {
          if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('RAZORPAY_KEY_SECRET is not configured');
          }
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
          
          const rzpResult = await razorpay.payments.refund(booking.razorpayPaymentId, {
            amount: refundAmount * 100, // in paise
            receipt: booking.id, // for tracking/reconciliation only
            notes: { bookingId: booking.id }
          });
          
          refundSuccess = true;
          gatewayRefundId = rzpResult?.id || null;
          console.log(`Razorpay refund successful for ${refundAmount}`);
        } catch (rzpErr: any) {
          console.error('Razorpay refund failed during Hub Inspection:', rzpErr);
        }
      }

      // 3. Main DB updates in transaction AFTER Razorpay call
      try {
        await prisma.$transaction(async (tx) => {
          // If excess deduction, apply penalty to user
          if (excessDeduction > 0) {
            await tx.user.update({
              where: { id: booking.renterId },
              data: {
                walletBalance: { decrement: excessDeduction },
                penaltyScore: { increment: 10 }
              }
            });
          }

          // Restore listing to AT_HUB and update shelfLocation
          let newListingStatus: any = 'AT_HUB';
          if (grade === 'C_MAJOR') {
            newListingStatus = 'UNLISTED';
          }
          await tx.listing.update({
            where: { id: booking.listingId },
            data: { 
              status: newListingStatus,
              ...(shelfLocation && { shelfLocation: shelfLocation.trim() })
            }
          });

          // Dispute triggers:
          // 1. Existing rule: High deposit shortfall (excess beyond deposit > ₹1,000)
          const isShortfallFlag = excessDeduction > 1000;
          // 2. New rule: Large deduction relative to deposit (deductionAmount + lateFee >= 50% of securityDeposit)
          const isHighDeductionRatio = maxDeduction > 0 && totalRequestedDeduction >= (maxDeduction * 0.5);

          if (isShortfallFlag || isHighDeductionRatio) {
            const percentClaimed = maxDeduction > 0 ? Math.round((totalRequestedDeduction / maxDeduction) * 100) : 0;
            const adminNotes = isShortfallFlag
              ? `Auto-flagged for manual review due to high deposit shortfall (₹${excessDeduction}). Check collusion risk.`
              : `Auto-flagged for review — large deduction relative to deposit (${percentClaimed}% of deposit claimed)`;

            await tx.dispute.create({
              data: {
                damageReportId: report.id,
                status: 'OPEN',
                adminNotes
              }
            });

            await tx.damageReport.update({
              where: { id: report.id },
              data: { isDisputed: true }
            });
          }

          // Create Payout for Lister (Rent minus Commission + Damages + Extension Fee Split)
          const rentAmount = Number(booking.rentAmount);
          const extensionFee = Number(booking.extensionFee) || 0;
          const MIN_COMMISSION_FLOOR = 2000;
          const COMMISSION_RATE = 0.35;
          
          // 1. Base rent commission: minimum ₹2000 floor or 35%, whichever is higher
          const adminRentCommission = Math.max(MIN_COMMISSION_FLOOR, Math.round(rentAmount * COMMISSION_RATE));
          const listerRentShare = Math.max(0, rentAmount - adminRentCommission);
          
          // 2. Extension fee split remains 50/50 without floor
          const listerExtensionShare = Math.round(extensionFee * 0.50);
          const adminExtensionCommission = Math.round(extensionFee * 0.50);
          
          // 3. Final Admin Commission & Lister Payout (Damages/Deductions go 100% to Lister)
          const commission = adminRentCommission + adminExtensionCommission;
          const finalListerPayout = listerRentShare + listerExtensionShare + totalRequestedDeduction;

          await tx.payout.create({
            data: {
              bookingId,
              listerProfileId: booking.listing.listerProfileId,
              amount: finalListerPayout,
              commissionPaid: commission,
              status: 'PENDING'
            }
          });

          // Update Booking
          await tx.booking.update({
            where: { id: bookingId },
            data: { 
              status: 'COMPLETED',
              actualReturnDate,
              lateReturnPenalty: lateFee,
              refundInitiatedAt: refundAmount > 0 ? new Date() : null // Update to final if needed
            }
          });

          // Reconcile refund state in DB post-gateway call ATOMICALLY
          if (refundAmount > 0) {
            if (!refundSuccess && booking.razorpayPaymentId) {
              // Auto-generate dispute for admin to manually process failed refund (or append note if already disputed)
              const existingDispute = await tx.dispute.findUnique({
                where: { damageReportId: report.id }
              });

              if (existingDispute) {
                await tx.dispute.update({
                  where: { id: existingDispute.id },
                  data: {
                    adminNotes: existingDispute.adminNotes
                      ? `${existingDispute.adminNotes} | CRITICAL: Razorpay refund failed for ₹${refundAmount}. Manual refund required.`
                      : `CRITICAL: Razorpay refund failed for ₹${refundAmount}. Manual refund required.`
                  }
                });
              } else {
                await tx.dispute.create({
                  data: {
                    damageReportId: report.id,
                    status: 'OPEN',
                    adminNotes: `CRITICAL: Razorpay refund failed for ₹${refundAmount}. Manual refund required.`
                  }
                });
              }

              // Fallback to wallet balance if Razorpay refund fails
              await tx.user.update({
                where: { id: booking.renterId },
                data: { walletBalance: { increment: refundAmount } }
              });
            } else if (!booking.razorpayPaymentId) {
              // Non-gateway fallback: deposit credited to wallet
              await tx.user.update({
                where: { id: booking.renterId },
                data: { walletBalance: { increment: refundAmount } }
              });
            }

            await tx.refund.create({
              data: {
                bookingId: booking.id,
                userId: booking.renterId,
                amount: refundAmount,
                status: refundSuccess ? 'COMPLETED' : 'PENDING',
                gateway: refundSuccess ? 'RAZORPAY' : 'WALLET',
                gatewayRefundId: gatewayRefundId
              }
            });
          }
        });
      } catch (txError) {
        console.error('Hub Inspection DB Transaction Error:', txError);
        if (refundSuccess) {
          console.error(`CRITICAL FAILURE: Razorpay refund ${gatewayRefundId} succeeded but DB transaction failed! Manual reconciliation needed for Booking ${bookingId}`);
        }
        throw txError;
      }

      return NextResponse.json({ 
        success: true, 
        message: `Post-return inspection completed. Late Days: ${lateDays}, Late Fee: ₹${lateFee}. Settlement pending.`,
        deduction: finalDeduction
      });

    } else {
      return NextResponse.json({ success: false, error: 'Invalid inspection type' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Hub Inspection API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
