import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id: refundId } = await context.params;

    if (!refundId) {
      return NextResponse.json(
        { success: false, error: 'Refund ID is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch Refund and related Booking
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        booking: {
          include: {
            damageReports: {
              include: { dispute: true },
            },
            renter: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        user: true,
      },
    });

    if (!refund) {
      return NextResponse.json(
        { success: false, error: 'Refund record not found.' },
        { status: 404 }
      );
    }

    // 2. IDEMPOTENCY CHECK 1: Status check
    if (refund.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Refund has already been completed.' },
        { status: 400 }
      );
    }

    // 3. IDEMPOTENCY CHECK 2: Pre-flight flag check (Prevents double-clicks / in-flight race conditions)
    if (refund.booking.refundInitiatedAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refund has already been initiated or is in-flight for this booking.',
        },
        { status: 400 }
      );
    }

    const refundAmount = Number(refund.amount);

    if (refundAmount <= 0) {
      // Zero refund amount (e.g. 100% deposit deducted for major damage/loss)
      const updated = await prisma.refund.update({
        where: { id: refundId },
        data: { status: 'COMPLETED', gateway: 'N/A' },
      });
      return NextResponse.json({
        success: true,
        message: 'Refund marked completed (₹0 amount due to full damage/late deductions).',
        refund: updated,
      });
    }

    // 4. FAST PRE-FLIGHT WRITE: Atomically set refundInitiatedAt right before calling Razorpay
    const updateResult = await prisma.booking.updateMany({
      where: {
        id: refund.bookingId,
        refundInitiatedAt: null,
      },
      data: { refundInitiatedAt: new Date() },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refund has already been initiated or is in-flight for this booking.',
        },
        { status: 400 }
      );
    }

    // 5. Trigger external Razorpay refund
    let refundSuccess = false;
    let gatewayRefundId: string | null = null;

    if (refund.booking.razorpayPaymentId) {
      try {
        if (!process.env.RAZORPAY_KEY_SECRET) {
          throw new Error('RAZORPAY_KEY_SECRET is not configured');
        }
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id:
            process.env.RAZORPAY_KEY_ID ||
            process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const rzpResult = await razorpay.payments.refund(
          refund.booking.razorpayPaymentId,
          {
            amount: Math.round(refundAmount * 100), // in paise
            receipt: refund.bookingId,
            notes: {
              bookingId: refund.bookingId,
              approvedBy: user.userId,
            },
          }
        );

        refundSuccess = true;
        gatewayRefundId = rzpResult?.id || null;
        console.log(
          `[Admin Refund Approval] Razorpay refund successful for booking ${refund.bookingId}: ₹${refundAmount} (Refund ID: ${gatewayRefundId})`
        );
      } catch (rzpErr: any) {
        console.error(
          `[Admin Refund Approval] Razorpay refund API failed for booking ${refund.bookingId}:`,
          rzpErr
        );
      }
    }

    // 6. Post-gateway atomic DB updates
    const finalRefund = await prisma.$transaction(async (tx) => {
      if (refundSuccess) {
        return await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: 'COMPLETED',
            gateway: 'RAZORPAY',
            gatewayRefundId: gatewayRefundId,
          },
        });
      } else if (!refund.booking.razorpayPaymentId) {
        // Non-gateway payment (COD / wallet) -> credit wallet directly
        await tx.user.update({
          where: { id: refund.userId },
          data: { walletBalance: { increment: refundAmount } },
        });

        return await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: 'COMPLETED',
            gateway: 'WALLET',
            gatewayRefundId: null,
          },
        });
      } else {
        // Razorpay refund failed -> automatic fallback to wallet balance
        await tx.user.update({
          where: { id: refund.userId },
          data: { walletBalance: { increment: refundAmount } },
        });

        const damageReport = refund.booking.damageReports?.[0];
        if (damageReport) {
          const existingDispute = await tx.dispute.findUnique({
            where: { damageReportId: damageReport.id },
          });

          if (existingDispute) {
            await tx.dispute.update({
              where: { id: existingDispute.id },
              data: {
                adminNotes: `${existingDispute.adminNotes || ''} | NOTE: Admin approval triggered fallback wallet refund of ₹${refundAmount} due to gateway failure.`.trim(),
              },
            });
          }
        }

        return await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: 'COMPLETED',
            gateway: 'WALLET',
            gatewayRefundId: null,
          },
        });
      }
    });

    // Dispatch Notification to Renter
    await sendNotification({
      userId: refund.userId,
      title: 'Security Deposit Refunded',
      message: `Security deposit of ₹${refundAmount.toLocaleString('en-IN')} has been refunded to your ${finalRefund.gateway === 'RAZORPAY' ? 'original payment method' : 'wallet'}.`,
      type: 'DEPOSIT_REFUNDED',
      linkUrl: `/profile`,
    });

    return NextResponse.json({
      success: true,
      message: refundSuccess
        ? `Refund of ₹${refundAmount} approved and dispatched to Renter bank via Razorpay.`
        : `Refund of ₹${refundAmount} approved and credited to Renter in-app wallet (Gateway fallback).`,
      refund: finalRefund,
      gateway: finalRefund.gateway,
      gatewayRefundId: finalRefund.gatewayRefundId,
    });
  } catch (error: any) {
    console.error('Admin Refund Approve Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
