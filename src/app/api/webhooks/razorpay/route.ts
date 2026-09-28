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
      // 1. Try finding standard rental booking
      const booking = await prisma.booking.findFirst({
        where: { razorpayOrderId },
        include: { listing: true },
      });

      if (booking && booking.status === 'PENDING') {
        const gatewayPaid = Math.round(Number(paymentEntity.amount) / 100);
        const bookingTotal = Math.round(Number(booking.totalAmount));
        const walletToDeduct = Math.max(0, bookingTotal - gatewayPaid);

        await prisma.$transaction(async (tx) => {
          // If partial wallet was applied, deduct it atomically
          if (walletToDeduct > 0) {
            const renterUser = await tx.user.findUnique({
              where: { id: booking.renterId },
              select: { walletBalance: true },
            });
            const actualDeduct = Math.min(Number(renterUser?.walletBalance || 0), walletToDeduct);
            if (actualDeduct > 0) {
              await tx.user.update({
                where: { id: booking.renterId },
                data: { walletBalance: { decrement: actualDeduct } },
              });
            }
          }

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              razorpayPaymentId: paymentEntity.id,
            },
          });

          const existingShipment = await tx.shipment.findFirst({
            where: { bookingId: booking.id, leg: 'LISTER_TO_HUB' }
          });

          if (!existingShipment && booking.listing.status !== 'AT_HUB') {
            await tx.shipment.create({
              data: {
                bookingId: booking.id,
                leg: 'LISTER_TO_HUB',
                status: 'PENDING',
              },
            });
          }

          if (booking.listing.status !== 'AT_HUB') {
            await tx.listing.update({
              where: { id: booking.listingId },
              data: { status: 'RENTED' },
            });
          }
        });
      } else {
        // 2. Try finding Lister Registration Fee Payment
        const regPayment = await prisma.registrationPayment.findUnique({
          where: { razorpayOrderId },
        });

        if (regPayment && regPayment.status !== 'COMPLETED') {
          await prisma.$transaction(async (tx) => {
            await tx.registrationPayment.update({
              where: { id: regPayment.id },
              data: {
                status: 'COMPLETED',
                razorpayPaymentId: paymentEntity.id,
              },
            });

            await tx.listerProfile.update({
              where: { id: regPayment.listerProfileId },
              data: { registrationFeePaid: true },
            });
          });
        } else {
          // 3. Try finding Booking Extension Payment
          const extensionBooking = await prisma.booking.findFirst({
            where: { pendingExtensionOrderId: razorpayOrderId },
            include: { listing: true },
          });

          if (extensionBooking && extensionBooking.pendingExtensionDate) {
            const originalEndDate = new Date(extensionBooking.endDate);
            const newEndDate = new Date(extensionBooking.pendingExtensionDate);
            const diffTime = Math.abs(newEndDate.getTime() - originalEndDate.getTime());
            const extensionDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const extensionFeePerDay = Number(extensionBooking.listing.rentalPrice) / 4;
            const totalExtensionFee = extensionFeePerDay * extensionDays;

            await prisma.$transaction(async (tx) => {
              await tx.booking.update({
                where: { id: extensionBooking.id },
                data: {
                  endDate: newEndDate,
                  extensionFee: Number(extensionBooking.extensionFee) + totalExtensionFee,
                  totalAmount: Number(extensionBooking.totalAmount) + totalExtensionFee,
                  pendingExtensionDate: null,
                  pendingExtensionOrderId: null,
                  pendingExtensionExpiry: null,
                },
              });
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
