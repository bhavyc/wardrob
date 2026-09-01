import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Missing Razorpay signature details.' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret && process.env.NODE_ENV === 'production') {
      console.error('FATAL: RAZORPAY_KEY_SECRET is missing in production.');
      return NextResponse.json({ success: false, error: 'Payment gateway configuration error.' }, { status: 500 });
    }
    const activeKeySecret = keySecret || 'mock_secret';
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', activeKeySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Payment verification failed. Invalid signature.' }, { status: 400 });
    }

    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: user.userId },
      include: { registrationPayments: true }
    });

    if (!listerProfile) {
      return NextResponse.json({ success: false, error: 'Lister profile not found.' }, { status: 404 });
    }

    // IDEMPOTENCY GUARD 1: If already paid, return success immediately
    if (listerProfile.registrationFeePaid) {
      return NextResponse.json({
        success: true,
        message: 'Registration fee already verified and paid.',
        registrationFeePaid: true
      });
    }

    const paymentRecord = await prisma.registrationPayment.findUnique({
      where: { razorpayOrderId: razorpay_order_id }
    });

    if (!paymentRecord) {
      return NextResponse.json({ success: false, error: 'Registration payment record not found.' }, { status: 404 });
    }

    // IDEMPOTENCY GUARD 2: If payment status already COMPLETED
    if (paymentRecord.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Registration fee already processed.',
        registrationFeePaid: true
      });
    }

    // Atomic transaction for payment completion + referral reward trigger
    await prisma.$transaction(async (tx) => {
      // 1. Mark payment record COMPLETED
      await tx.registrationPayment.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'COMPLETED',
          razorpayPaymentId: razorpay_payment_id
        }
      });

      // 2. Mark Lister registrationFeePaid = true
      await tx.listerProfile.update({
        where: { id: listerProfile.id },
        data: { registrationFeePaid: true }
      });

      // 3. Process Referral Reward if referred by another Lister
      if (listerProfile.referredByCode) {
        const referrerProfile = await tx.listerProfile.findUnique({
          where: { referralCode: listerProfile.referredByCode }
        });

        // Ensure valid referrer and prevent self-referral
        if (referrerProfile && referrerProfile.id !== listerProfile.id) {
          // Check if referral record already exists for this referred lister
          const existingReferral = await tx.referral.findUnique({
            where: { referredListerId: listerProfile.id }
          });

          if (!existingReferral) {
            // Create referral record
            await tx.referral.create({
              data: {
                referrerId: referrerProfile.id,
                referredListerId: listerProfile.id,
                rewardAmount: 200.00,
                status: 'CREDITED'
              }
            });

            // Credit referrer's wallet by ₹200
            await tx.user.update({
              where: { id: referrerProfile.userId },
              data: {
                walletBalance: { increment: 200.00 }
              }
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration fee verified successfully. You can now submit KYC details.',
      registrationFeePaid: true
    });
  } catch (error: any) {
    console.error('Registration Fee Verify Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
