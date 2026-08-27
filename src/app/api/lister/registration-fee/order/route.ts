import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SHuZT9fDb8rLhx',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'VtB5uZJ9bLh8oqEZhNlFE5GF',
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!listerProfile) {
      return NextResponse.json({ success: false, error: 'Lister profile not found.' }, { status: 404 });
    }

    if (listerProfile.registrationFeePaid) {
      return NextResponse.json({ success: false, error: 'Registration fee has already been paid.' }, { status: 400 });
    }

    const registrationFeeAmount = 500; // ₹500 non-refundable

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(registrationFeeAmount * 100), // in paise
      currency: 'INR',
      receipt: `reg_${listerProfile.id.substring(0, 8)}`,
    });

    await prisma.registrationPayment.create({
      data: {
        listerProfileId: listerProfile.id,
        amount: registrationFeeAmount,
        razorpayOrderId: razorpayOrder.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      amount: registrationFeeAmount,
      razorpayOrder: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SHuZT9fDb8rLhx',
      },
    });
  } catch (error: any) {
    console.error('Registration Fee Order Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create payment order.' }, { status: 500 });
  }
}
