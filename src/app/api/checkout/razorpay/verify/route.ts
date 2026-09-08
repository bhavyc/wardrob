import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  let razorpay_payment_id: string | undefined;

  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    razorpay_payment_id = body.razorpay_payment_id;
    const {
      razorpay_order_id,
      razorpay_signature,
      productId,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !productId) {
      return NextResponse.json({ success: false, error: 'Missing required payment or booking details.' }, { status: 400 });
    }

    // 1. Verify Razorpay Payment Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('FATAL: RAZORPAY_KEY_SECRET environment variable is missing.');
      return NextResponse.json({ success: false, error: 'Payment gateway configuration error.' }, { status: 500 });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    const signatureBuffer = Buffer.from(razorpay_signature, 'utf8');
    const expectedBuffer = Buffer.from(generated_signature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return NextResponse.json({ success: false, error: 'Payment signature verification failed. Possible fraud.' }, { status: 400 });
    }

    // 2. Fetch the pending reservation created in /api/checkout/razorpay/order
    const existingBooking = await prisma.booking.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
      include: { listing: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ success: false, error: 'Booking reservation not found for this transaction.' }, { status: 404 });
    }

    // 3. Prevent Payment Substitution Fraud
    if (existingBooking.renterId !== authUser.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Payment does not belong to your account.' }, { status: 403 });
    }

    if (existingBooking.listingId !== productId) {
      return NextResponse.json({ success: false, error: 'Security Exception: Listing mismatch for order verification.' }, { status: 400 });
    }

    // 4. Idempotency Check: if booking is already confirmed, return success
    if (existingBooking.status === 'CONFIRMED' || existingBooking.status === 'AT_HUB_PRE' || existingBooking.status === 'OUT_FOR_DELIVERY' || existingBooking.status === 'IN_USE') {
      return NextResponse.json({
        success: true,
        message: 'Rental booking already confirmed.',
        order: existingBooking,
      });
    }

    if (existingBooking.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Booking is no longer pending confirmation.' }, { status: 400 });
    }

    // 5. Replay Attack / Double Spending Guard
    const paymentAlreadyUsed = await prisma.booking.findFirst({
      where: {
        razorpayPaymentId: razorpay_payment_id,
        id: { not: existingBooking.id }
      }
    });

    if (paymentAlreadyUsed) {
      return NextResponse.json({ success: false, error: 'This payment transaction has already been credited to another reservation.' }, { status: 400 });
    }

    // 6. Atomically confirm Booking inside serializable transaction
    let booking = null;
    let retries = 3;

    while (retries > 0) {
      try {
        booking = await prisma.$transaction(async (tx) => {
          // Double check conflicting bookings
          const conflictingBooking = await tx.booking.findFirst({
            where: {
              listingId: existingBooking.listingId,
              id: { not: existingBooking.id },
              status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE'] },
              OR: [
                { startDate: { lte: existingBooking.endDate }, endDate: { gte: existingBooking.startDate } },
                {
                  startDate: { lte: existingBooking.endDate },
                  pendingExtensionDate: { gte: existingBooking.startDate },
                  pendingExtensionExpiry: { gt: new Date() }
                }
              ]
            }
          });

          if (conflictingBooking) {
            throw new Error('CONFLICT');
          }

          // Confirm the booking
          const confirmedBooking = await tx.booking.update({
            where: { id: existingBooking.id },
            data: {
              status: 'CONFIRMED',
              razorpayPaymentId: razorpay_payment_id,
            }
          });

          // ONLY create LISTER_TO_HUB shipment if item is NOT already AT_HUB and no shipment exists
          const existingShipment = await tx.shipment.findFirst({
            where: { bookingId: confirmedBooking.id, leg: 'LISTER_TO_HUB' }
          });

          if (!existingShipment && existingBooking.listing.status !== 'AT_HUB') {
            await tx.shipment.create({
              data: {
                bookingId: confirmedBooking.id,
                leg: 'LISTER_TO_HUB',
                status: 'PENDING',
              }
            });
          }

          if (existingBooking.listing.status !== 'AT_HUB') {
            await tx.listing.update({
              where: { id: existingBooking.listingId },
              data: { status: 'RENTED' }
            });
          }

          return confirmedBooking;
        }, {
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 10000,
        });

        break;
      } catch (err: any) {
        if (err.code === 'P2034' && retries > 1) {
          retries--;
          await new Promise(res => setTimeout(res, 200));
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Rental booking confirmed successfully!',
      order: booking,
    });
  } catch (error: any) {
    console.error('API Razorpay Verify Error:', error);

    // --- AUTO-REFUND LOGIC ---
    // If the booking transaction failed, but the user paid on Razorpay, auto-refund
    if (razorpay_payment_id && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (payment && payment.status === 'captured' && payment.amount_refunded === 0) {
          console.log(`Auto-refunding orphaned payment ${razorpay_payment_id}`);
          await razorpay.payments.refund(razorpay_payment_id, {
            amount: payment.amount,
            notes: { reason: 'Booking creation failed after payment' }
          });
        }
      } catch (refundErr) {
        console.error('Auto-refund failed for orphaned payment:', razorpay_payment_id, refundErr);
      }
    }

    if (error.message === 'CONFLICT') {
      return NextResponse.json(
        { success: false, error: 'Item is already booked for these dates. Any payment has been auto-refunded.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed. Any payment has been auto-refunded.' },
      { status: 500 }
    );
  }
}
