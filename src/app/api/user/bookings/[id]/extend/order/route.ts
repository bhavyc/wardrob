import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_uG62rYyFzD36XW',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummysecret12345',
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { extensionDays } = await request.json();
    if (!extensionDays || extensionDays < 1) {
      return NextResponse.json({ success: false, error: 'Invalid extension days.' }, { status: 400 });
    }

    const { id } = await context.params;

    // Use Serializable transaction to prevent overlapping bookings
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { listing: true }
      });

      if (!booking) throw new Error('NOT_FOUND');
      if (booking.renterId !== user.userId) throw new Error('UNAUTHORIZED');
      if (booking.status !== 'IN_USE') throw new Error('INVALID_STATUS');

      const newEndDate = new Date(booking.endDate);
      newEndDate.setDate(newEndDate.getDate() + extensionDays);

      // Check for conflicting bookings during the extension period
      // Note: We also consider other users' pending extensions if they haven't expired
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          listingId: booking.listingId,
          id: { not: booking.id },
          status: { in: ['CONFIRMED', 'OUT_FOR_DELIVERY', 'IN_USE', 'AT_HUB_PRE'] },
          OR: [
            {
              // Overlaps with an actual booking's locked dates
              startDate: { lte: newEndDate },
              endDate: { gte: booking.endDate }
            },
            {
              // Overlaps with someone else's active pending extension
              startDate: { lte: newEndDate },
              pendingExtensionDate: { gte: booking.endDate },
              pendingExtensionExpiry: { gt: new Date() }
            }
          ]
        }
      });

      if (conflictingBooking) {
        throw new Error('CONFLICT');
      }

      // Extension fee is 25% of the base rental package price per extra day
      const baseRent = Number(booking.listing.rentalPrice);
      const extensionFeePerDay = baseRent / 4;
      const totalExtensionFee = extensionFeePerDay * extensionDays;

      // 1. Generate Razorpay Order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalExtensionFee * 100), // in paise
        currency: 'INR',
        receipt: `ext_${booking.id.substring(0, 8)}`,
      });

      // 2. Lock the extension dates temporarily (15 minutes)
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          pendingExtensionDate: newEndDate,
          pendingExtensionOrderId: razorpayOrder.id,
          pendingExtensionExpiry: expiry
        }
      });

      return { totalExtensionFee, razorpayOrder };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });

    return NextResponse.json({ 
      success: true, 
      extensionFee: result.totalExtensionFee,
      razorpayOrder: {
        orderId: result.razorpayOrder.id,
        amount: result.razorpayOrder.amount,
        currency: result.razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_uG62rYyFzD36XW',
      }
    });

  } catch (error: any) {
    console.error('Extension Order Error:', error);
    if (error.message === 'CONFLICT') {
      return NextResponse.json({ 
        success: false, 
        error: 'Item is not available for extension due to an upcoming booking.' 
      }, { status: 409 });
    }
    if (error.message === 'NOT_FOUND') return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    if (error.message === 'INVALID_STATUS') return NextResponse.json({ success: false, error: 'Only active IN_USE bookings can be extended.' }, { status: 400 });
    
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
