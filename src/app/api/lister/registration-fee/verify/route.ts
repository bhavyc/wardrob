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
    if (!keySecret) {
      console.error('FATAL: RAZORPAY_KEY_SECRET is missing.');
      return NextResponse.json({ success: false, error: 'Payment gateway configuration error.' }, { status: 500 });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const signatureBuffer = Buffer.from(razorpay_signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
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

    // SECURITY CHECK: Verify that the payment order belongs to the authenticated lister
    if (paymentRecord.listerProfileId !== listerProfile.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Payment order does not belong to your account.' }, { status: 403 });
    }

    // IDEMPOTENCY GUARD 2: If payment status already COMPLETED
    if (paymentRecord.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Registration fee already processed.',
        registrationFeePaid: true
      });
    }

    // PAYMENT REPLAY GUARD: Ensure this payment ID has not been used anywhere else
    const paymentAlreadyUsed = await prisma.registrationPayment.findFirst({
      where: {
        razorpayPaymentId: razorpay_payment_id,
        id: { not: paymentRecord.id }
      }
    }) || await prisma.booking.findFirst({
      where: { razorpayPaymentId: razorpay_payment_id }
    });

    if (paymentAlreadyUsed) {
      return NextResponse.json({ success: false, error: 'This payment transaction has already been claimed or credited.' }, { status: 400 });
    }

    // Atomic transaction for payment completion
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
