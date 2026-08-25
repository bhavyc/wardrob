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
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
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

          // If shortfall > 1000, flag for manual review
          if (excessDeduction > 1000) {
            await tx.dispute.create({
              data: {
                damageReportId: report.id,
                status: 'OPEN',
                adminNotes: `Auto-flagged for manual review due to high deposit shortfall (₹${excessDeduction}). Check collusion risk.`
              }
            });
          }

          // Create Payout for Lister (Rent minus Commission + Damages)
          const rentAmount = Number(booking.rentAmount);
          const commissionRate = booking.listing.lister?.commissionOverride ? Number(booking.listing.lister.commissionOverride) : 0.25;
          const listerRentShare = rentAmount * (1 - commissionRate);
          const commission = rentAmount * commissionRate;
          const finalListerPayout = listerRentShare + totalRequestedDeduction;

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
            if (!refundSuccess) {
              // Auto-generate dispute for admin to manually process failed refund
              await tx.dispute.create({
                data: {
                  damageReportId: report.id,
                  status: 'OPEN',
                  adminNotes: `CRITICAL: Razorpay refund failed for ₹${refundAmount}. Manual refund required.`
                }
              });

              // Fallback to wallet balance if Razorpay refund fails
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
