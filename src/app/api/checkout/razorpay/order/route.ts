import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Razorpay from 'razorpay';
import { getClientIp } from '@/lib/rate-limit';

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('FATAL: Razorpay API credentials are not configured.');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    // Database-backed Distributed Rate Limiter
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentRequests = await prisma.duplicatePhotoHash.count({
      where: {
        contextId: 'RATE_LIMIT_ORDER',
        hashValue: { startsWith: authUser.userId },
        createdAt: { gte: oneMinuteAgo }
      }
    });

    if (recentRequests >= 5) {
      return NextResponse.json({ success: false, error: 'Too many checkout requests. Please wait a minute.' }, { status: 429 });
    }

    // Log this attempt
    await prisma.duplicatePhotoHash.create({
      data: {
        contextId: 'RATE_LIMIT_ORDER',
        hashValue: `${authUser.userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }
    });

    const { productId, couponCode, eventDate, extensionDays = 0 } = await request.json();

    if (!productId || !eventDate) {
      return NextResponse.json({ success: false, error: 'Listing/Product ID and event date are required.' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: productId },
    });

    // In Hub Storage Model, Listing status could be AT_HUB, which is also bookable!
    if (!listing || (listing.status !== 'AVAILABLE' && listing.status !== 'AT_HUB')) {
      return NextResponse.json({ success: false, error: 'Listing not found or not available.' }, { status: 404 });
    }

    const evDate = new Date(eventDate);
    
    if (isNaN(evDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid event date.' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 3);

    if (evDate < minDate) {
      return NextResponse.json({ success: false, error: 'Event date must be at least 3 days from today.' }, { status: 400 });
    }

    const deliveryDate = new Date(evDate);
    deliveryDate.setDate(deliveryDate.getDate() - 2);

    const returnPickupDate = new Date(evDate);
    returnPickupDate.setDate(returnPickupDate.getDate() + 2 + extensionDays);

    const conflictingBooking = await prisma.booking.findFirst({
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
      return NextResponse.json({ success: false, error: 'Item is already booked for these dates.' }, { status: 409 });
    }
    
    const baseRent = Number(listing.rentalPrice);
    const extensionRent = (baseRent / 4) * extensionDays;
    const rentalCharge = baseRent + extensionRent;
    const depositAmount = Number(listing.securityDeposit);

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.isActive) {
        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
        const meetMinOrder = !coupon.minOrderValue || rentalCharge >= Number(coupon.minOrderValue);

        if (!isExpired && meetMinOrder) {
          if (coupon.discountType === 'PERCENTAGE') {
            discount = (rentalCharge * Number(coupon.discountValue)) / 100;
          } else if (coupon.discountType === 'FLAT') {
            discount = Number(coupon.discountValue);
          }
        }
      }
    }

    // Cap discount strictly at the rental charge so it never cuts into the refundable security deposit
    const finalDiscount = Math.min(discount, rentalCharge);
    const discountedRent = Math.max(0, rentalCharge - finalDiscount);
    const finalAmount = Math.max(1, Math.round(discountedRent + depositAmount));

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        listingId: listing.id,
        userId: authUser.userId,
      },
    });

    // Persist a PENDING booking in database upfront to prevent payment substitution and allow webhook synchronization
    await prisma.booking.create({
      data: {
        renterId: authUser.userId,
        listingId: listing.id,
        startDate: deliveryDate,
        endDate: returnPickupDate,
        rentAmount: discountedRent,
        securityDeposit: depositAmount,
        totalAmount: finalAmount,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
      }
    });

    const publicRazorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: publicRazorpayKey,
    });
  } catch (error: any) {
    console.error('API Razorpay Order Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate Razorpay transaction order.' },
      { status: 500 }
    );
  }
}
