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
      eventDate,
      extensionDays = 0,
      couponCode,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !productId || !eventDate) {
      return NextResponse.json({ success: false, error: 'Missing required payment or booking details.' }, { status: 400 });
    }

    // 1. Verify Razorpay Payment Signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      console.error('FATAL: RAZORPAY_KEY_SECRET environment variable is missing.');
      return NextResponse.json({ success: false, error: 'Payment gateway configuration error.' }, { status: 500 });
    }
    const activeSecret = secret || 'mock_secret';
    const generated_signature = crypto
      .createHmac('sha256', activeSecret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Payment signature verification failed. Possible fraud.' }, { status: 400 });
    }

    // 2. Fetch Listing and calculate prices
    const listing = await prisma.listing.findUnique({ where: { id: productId } });
    if (!listing || (listing.status !== 'AVAILABLE' && listing.status !== 'AT_HUB')) {
      return NextResponse.json({ success: false, error: 'Listing not found or not available.' }, { status: 404 });
    }

    const evDate = new Date(eventDate);
    if (isNaN(evDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid event date.' }, { status: 400 });
    }

    const start = new Date(evDate);
    start.setDate(start.getDate() - 2);

    const end = new Date(evDate);
    end.setDate(end.getDate() + 2 + extensionDays);
    
    const deliveryDate = new Date(evDate);
    deliveryDate.setDate(deliveryDate.getDate() - 2);

    let baseRent = Number(listing.rentalPrice);
    let extensionRent = (baseRent / 4) * extensionDays;
    let finalAmount = baseRent + extensionRent + Number(listing.securityDeposit);

    let appliedDiscount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date())) {
        if (coupon.minOrderValue && baseRent < Number(coupon.minOrderValue)) {
          // min order not met, ignore
        } else {
          const discountVal = Number(coupon.discountValue);
          if (coupon.discountType === 'PERCENTAGE') {
            appliedDiscount = (baseRent * discountVal) / 100;
          } else if (coupon.discountType === 'FLAT') {
            appliedDiscount = discountVal;
          }
          finalAmount = finalAmount - appliedDiscount;
        }
      }
    }
    
    const returnPickupDate = new Date(evDate);
    returnPickupDate.setDate(returnPickupDate.getDate() + 2 + extensionDays);

    // 3. Atomically check conflicts and create Booking (with retry for serialization failures)
    let booking = null;
    let retries = 3;

    while (retries > 0) {
      try {
        booking = await prisma.$transaction(async (tx) => {
          // Double-check conflict INSIDE transaction
          const conflictingBooking = await tx.booking.findFirst({
            where: {
              listingId: listing.id,
              status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE'] },
              OR: [
                { startDate: { lte: returnPickupDate }, endDate: { gte: deliveryDate } },
                {
                  startDate: { lte: returnPickupDate },
                  pendingExtensionDate: { gte: deliveryDate },
                  pendingExtensionExpiry: { gt: new Date() }
                }
              ]
            }
          });

          if (conflictingBooking) {
            throw new Error('CONFLICT');
          }

          const newBooking = await tx.booking.create({
            data: {
              renterId: authUser.userId,
              listingId: productId,
              startDate: deliveryDate,
              endDate: returnPickupDate,
              rentAmount: baseRent + extensionRent,
              securityDeposit: Number(listing.securityDeposit),
              totalAmount: finalAmount,
              status: 'CONFIRMED',
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
            }
          });

          // ONLY create LISTER_TO_HUB shipment if item is NOT already AT_HUB
          if (listing.status !== 'AT_HUB') {
            await tx.shipment.create({
              data: {
                bookingId: newBooking.id,
                leg: 'LISTER_TO_HUB',
                status: 'PENDING',
              }
            });
          }

          // 4. Temporarily mark listing as RENTED (or leave it as AT_HUB?)
          if (listing.status !== 'AT_HUB') {
            await tx.listing.update({
              where: { id: productId },
              data: { status: 'RENTED' }
            });
          }

          return newBooking;
        }, {
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 10000,
        });

        // Exit loop on success
        break;
      } catch (err: any) {
        if (err.code === 'P2034' && retries > 1) {
          retries--;
          // Wait 200ms before retrying
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
    // If the booking transaction failed, but the user paid on Razorpay, we must refund them.
    if (razorpay_payment_id) {
      try {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
          key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret',
        });

        // Fetch payment to ensure it hasn't already been refunded (e.g. from a duplicate client request)
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
