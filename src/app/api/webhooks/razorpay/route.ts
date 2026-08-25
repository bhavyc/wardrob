import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret_12345';

    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 400 });
      }
    }

    const eventData = JSON.parse(rawBody);
    const event = eventData.event;
    const paymentEntity = eventData.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;

    if (event === 'payment.captured' && razorpayOrderId) {
      const booking = await prisma.booking.findFirst({
        where: { razorpayOrderId },
      });

      if (booking && booking.status === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              razorpayPaymentId: paymentEntity.id,
            },
          });

          await tx.shipment.create({
            data: {
              bookingId: booking.id,
              leg: 'LISTER_TO_HUB',
              status: 'PENDING',
            },
          });
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
