import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        damageReport: {
          include: {
            booking: {
              include: {
                renter: { select: { name: true, email: true, phone: true } },
                listing: { select: { title: true, lister: { include: { user: { select: { name: true, email: true } } } } } },
                damageReports: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, disputes });
  } catch (error: any) {
    console.error('Admin Disputes GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { disputeId, status, adminNotes, revisedDeduction } = await request.json();

    if (!disputeId || !status) {
      return NextResponse.json({ success: false, error: 'disputeId and status are required' }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { 
        damageReport: {
          include: { booking: true }
        }
      },
    });

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    // Update dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: status as any,
        adminNotes: adminNotes || undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
    });

    // If deduction revised, update damage report, payout, and renter wallet
    if (revisedDeduction !== undefined && status === 'RESOLVED') {
      const oldDeduction = Number(dispute.damageReport.deductionAmount);
      const newDeduction = Number(revisedDeduction);
      const diff = newDeduction - oldDeduction;

      if (diff !== 0) {
        // Find related payout
        const payout = await prisma.payout.findUnique({
          where: { bookingId: dispute.damageReport.bookingId },
        });

        if (payout) {
          if (payout.status === 'COMPLETED') {
            return NextResponse.json({ success: false, error: 'Payout already paid to lister, manual reconciliation required' }, { status: 400 });
          } else if (payout.status === 'PENDING') {
            // Update payout amount
            await prisma.payout.update({
              where: { id: payout.id },
              data: { amount: Number(payout.amount) + diff },
            });
          }
        }

        // Adjust renter wallet
        if (diff > 0) {
          // New deduction is higher, subtract from wallet
          await prisma.user.update({
            where: { id: dispute.damageReport.booking.renterId },
            data: { walletBalance: { decrement: diff } },
          });
        } else if (diff < 0) {
          // New deduction is lower, we overcharged. 
          const refundAmount = Math.abs(diff);
          
          // Trigger Razorpay Refund API if possible
          if (dispute.damageReport.booking.razorpayPaymentId) {
            try {
              const Razorpay = require('razorpay');
              const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
                key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
              });
              
              await razorpay.payments.refund(dispute.damageReport.booking.razorpayPaymentId, {
                amount: refundAmount * 100, // in paise
              });
              console.log(`Razorpay refund initiated for ${refundAmount}`);
            } catch (rzpErr) {
              console.error('Razorpay refund failed:', rzpErr);
              // Fallback to wallet balance if refund fails
              await prisma.user.update({
                where: { id: dispute.damageReport.booking.renterId },
                data: { walletBalance: { increment: refundAmount } },
              });
            }
          } else {
            // No payment ID, fallback to wallet
            await prisma.user.update({
              where: { id: dispute.damageReport.booking.renterId },
              data: { walletBalance: { increment: refundAmount } },
            });
          }

          // Create Refund record for tracking
          await prisma.refund.create({
            data: {
              userId: dispute.damageReport.booking.renterId,
              bookingId: dispute.damageReport.bookingId,
              amount: refundAmount,
              status: 'PENDING',
            },
          });
        }

        // Update Damage Report
        await prisma.damageReport.update({
          where: { id: dispute.damageReportId },
          data: { deductionAmount: newDeduction },
        });
      }
    }

    return NextResponse.json({ success: true, dispute: updatedDispute });
  } catch (error: any) {
    console.error('Admin Disputes PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
