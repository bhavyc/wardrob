import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('FATAL: RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ success: false, error: 'Webhook gateway configuration error.' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ success: false, error: 'Missing webhook signature header.' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 400 });
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
