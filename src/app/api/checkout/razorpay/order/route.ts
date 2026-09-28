import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import { calculateRentalWindow, POST_RETURN_TURNAROUND_DAYS } from '@/lib/availability';
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

    // Strict 1-role enforcement: only RENTER accounts can book rentals.
    if (authUser.role !== 'RENTER') {
      return NextResponse.json(
        {
          success: false,
          error: `This action is only available to Renter accounts. Your account is registered as a ${authUser.role.replace('_', ' ')}. To rent items, please create a separate Renter account.`,
        },
        { status: 403 }
      );
    }

    // 1. Guard against banned / high penalty renters
    const userRecord = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { penaltyScore: true, lockedUntil: true },
    });

    if (userRecord && userRecord.penaltyScore >= 50) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Your account has been suspended from renting due to severe penalty score (chronic non-returns or damage). Please contact support.',
        },
        { status: 403 }
      );
    }

    // 2. Guard against users with past unreturned / lost bookings
    const hasLostBooking = await prisma.booking.findFirst({
      where: {
        renterId: authUser.userId,
        status: 'LOST_NOT_RETURNED',
      },
    });

    if (hasLostBooking) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You cannot place new rental orders while having a past unreturned / lost item on your account.',
        },
        { status: 403 }
      );
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

    const { 
      productId, 
      eventDate, 
      extensionDays = 0, 
      useWallet = false,
      shippingAddress,
      city,
      state,
      pincode,
      contactPhone,
      contactName,
    } = await request.json();

    if (!productId || !eventDate) {
      return NextResponse.json({ success: false, error: 'Listing/Product ID and event date are required.' }, { status: 400 });
    }

    // Strict Mandatory Validation for All Checkout Fields
    const trimmedAddress = (shippingAddress || '').trim();
    const trimmedCity = (city || '').trim();
    const trimmedState = (state || '').trim();
    const trimmedPincode = (pincode || '').trim();
    const trimmedName = (contactName || '').trim();
    const trimmedPhone = (contactPhone || '').trim();

    if (!trimmedAddress || !trimmedCity || !trimmedState || !trimmedPincode || !trimmedName || !trimmedPhone) {
      return NextResponse.json({
        success: false,
        error: 'All checkout delivery fields are mandatory: Recipient Name, 10-digit Phone, Street Address, City, State, and Pincode.'
      }, { status: 400 });
    }

    const cleanPhone = trimmedPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a valid 10-digit mobile number for delivery coordination.'
      }, { status: 400 });
    }

    const cleanPin = trimmedPincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a valid 6-digit Indian PIN code.'
      }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: productId },
    });

    // In Hub Storage Model, Listing status could be AT_HUB, and active rentals also have status RENTED!
    if (!listing || (listing.status !== 'AVAILABLE' && listing.status !== 'AT_HUB' && listing.status !== 'RENTED')) {
      return NextResponse.json({ success: false, error: 'Listing not found or not available.' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let eventDateMidnight: Date;
    if (typeof eventDate === 'string' && eventDate.includes('-')) {
      const parts = eventDate.split('T')[0].split('-').map(Number);
      eventDateMidnight = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      eventDateMidnight = new Date(eventDate);
    }
    eventDateMidnight.setHours(0, 0, 0, 0);
    
    if (isNaN(eventDateMidnight.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid event date.' }, { status: 400 });
    }

    const window = calculateRentalWindow(eventDateMidnight, extensionDays, today);
    if (!window.valid) {
      return NextResponse.json({
        success: false,
        error: window.reason || "This item can't be delivered in time for your event date. Please choose a date at least 4 days from today."
      }, { status: 400 });
    }

    const deliveryDate = window.deliveryDate;
    const returnPickupDate = window.returnPickupDate;

    const returnPickupWithTurnaround = new Date(returnPickupDate);
    returnPickupWithTurnaround.setDate(returnPickupWithTurnaround.getDate() + POST_RETURN_TURNAROUND_DAYS);

    const deliveryMinusTurnaround = new Date(deliveryDate);
    deliveryMinusTurnaround.setDate(deliveryMinusTurnaround.getDate() - POST_RETURN_TURNAROUND_DAYS);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        listingId: listing.id,
        status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE'] },
        OR: [
          { startDate: { lte: returnPickupWithTurnaround }, endDate: { gte: deliveryMinusTurnaround } },
          {
            startDate: { lte: returnPickupWithTurnaround },
            pendingExtensionDate: { gte: deliveryMinusTurnaround },
            pendingExtensionExpiry: { gt: new Date() }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return NextResponse.json({ success: false, error: 'Listing not available for this date (Already reserved).' }, { status: 409 });
    }
    
    const baseRent = Number(listing.rentalPrice);
    const extensionRent = (baseRent / 4) * extensionDays;
    const rentalCharge = baseRent + extensionRent;
    const depositAmount = Number(listing.securityDeposit);
    const grossTotal = Math.max(1, Math.round(rentalCharge + depositAmount));

    // Fetch renter's current wallet balance
    const renterUser = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { walletBalance: true },
    });
    const currentWalletBalance = Math.max(0, Number(renterUser?.walletBalance || 0));

    let walletDeduction = 0;
    if (useWallet && currentWalletBalance > 0) {
      walletDeduction = Math.min(currentWalletBalance, grossTotal);
    }
    const finalAmount = Math.max(0, grossTotal - walletDeduction);

    // CASE 1: 100% Covered by Wallet — Instant Confirmation without Gateway
    if (finalAmount === 0 && walletDeduction > 0) {
      try {
        const confirmedBooking = await prisma.$transaction(async (tx) => {
          // 1. Re-verify user wallet balance inside transaction to prevent double spending / overdraw
          const userInTx = await tx.user.findUnique({
            where: { id: authUser.userId },
            select: { walletBalance: true },
          });

          if (!userInTx || Number(userInTx.walletBalance) < walletDeduction) {
            throw new Error('INSUFFICIENT_WALLET_BALANCE');
          }

          // 2. Re-verify listing availability inside transaction to prevent double booking race conditions
          const conflictInTx = await tx.booking.findFirst({
            where: {
              listingId: listing.id,
              status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE'] },
              OR: [
                { startDate: { lte: returnPickupWithTurnaround }, endDate: { gte: deliveryMinusTurnaround } },
                {
                  startDate: { lte: returnPickupWithTurnaround },
                  pendingExtensionDate: { gte: deliveryMinusTurnaround },
                  pendingExtensionExpiry: { gt: new Date() }
                }
              ]
            }
          });

          if (conflictInTx) {
            throw new Error('LISTING_ALREADY_BOOKED');
          }

          await tx.user.update({
            where: { id: authUser.userId },
            data: { walletBalance: { decrement: walletDeduction } },
          });

          const b = await tx.booking.create({
            data: {
              renterId: authUser.userId,
              listingId: listing.id,
              startDate: deliveryDate,
              endDate: returnPickupDate,
              rentAmount: rentalCharge,
              securityDeposit: depositAmount,
              totalAmount: grossTotal,
              status: 'CONFIRMED',
              razorpayPaymentId: 'WALLET_FULL',
              shippingAddress: shippingAddress ? String(shippingAddress).trim() : null,
              city: city ? String(city).trim() : null,
              state: state ? String(state).trim() : null,
              pincode: pincode ? String(pincode).trim() : null,
              contactPhone: contactPhone ? String(contactPhone).trim() : null,
              contactName: contactName ? String(contactName).trim() : null,
            },
          });

          if (listing.status !== 'AT_HUB') {
            await tx.shipment.create({
              data: {
                bookingId: b.id,
                leg: 'LISTER_TO_HUB',
                status: 'PENDING',
              },
            });
            await tx.listing.update({
              where: { id: listing.id },
              data: { status: 'RENTED' },
            });
          }

          return b;
        }, {
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 10000,
        });

        // Dispatch In-App Notifications
        await sendNotification({
          userId: confirmedBooking.renterId,
          title: 'Booking Confirmed',
          message: `Your booking for "${listing.title}" is confirmed! Prepared for central hub dispatch.`,
          type: 'ORDER_CONFIRMED',
          linkUrl: `/profile`,
        });

        const lister = await prisma.listerProfile.findUnique({
          where: { id: listing.listerProfileId },
          select: { userId: true },
        });
        if (lister) {
          await sendNotification({
            userId: lister.userId,
            title: 'New Booking Received',
            message: `New rental booking received for "${listing.title}". Please prepare garment for transit.`,
            type: 'NEW_BOOKING',
            linkUrl: `/lister/bookings`,
          });
        }

        return NextResponse.json({
          success: true,
          isWalletFullPayment: true,
          orderId: confirmedBooking.id,
          bookingId: confirmedBooking.id,
          grossTotal,
          walletDeducted: walletDeduction,
          amount: 0,
        });
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_WALLET_BALANCE') {
          return NextResponse.json(
            { success: false, error: 'Insufficient wallet balance to cover this booking.' },
            { status: 400 }
          );
        }
        if (err.message === 'LISTING_ALREADY_BOOKED') {
          return NextResponse.json(
            { success: false, error: 'Item was just booked by another user for these dates.' },
            { status: 409 }
          );
        }
        throw err;
      }
    }

    // CASE 2: Gateway Payment (Full or Partial after wallet deduction)
    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        listingId: listing.id,
        userId: authUser.userId,
        walletDeduction: walletDeduction.toString(),
      },
    });

    // Persist a PENDING booking in database upfront to prevent payment substitution and allow webhook synchronization
    await prisma.booking.create({
      data: {
        renterId: authUser.userId,
        listingId: listing.id,
        startDate: deliveryDate,
        endDate: returnPickupDate,
        rentAmount: rentalCharge,
        securityDeposit: depositAmount,
        totalAmount: grossTotal,
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
        shippingAddress: shippingAddress ? String(shippingAddress).trim() : null,
        city: city ? String(city).trim() : null,
        state: state ? String(state).trim() : null,
        pincode: pincode ? String(pincode).trim() : null,
        contactPhone: contactPhone ? String(contactPhone).trim() : null,
        contactName: contactName ? String(contactName).trim() : null,
      }
    });

    const publicRazorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: publicRazorpayKey,
      grossTotal,
      walletDeducted: walletDeduction,
      finalPayable: finalAmount,
    });
  } catch (error: any) {
    if (error.message === 'LISTING_ALREADY_BOOKED') {
      return NextResponse.json(
        { success: false, error: 'Listing not available for this date (Already reserved).' },
        { status: 409 }
      );
    }
    console.error('API Razorpay Order Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate Razorpay transaction order.' },
      { status: 500 }
    );
  }
}
