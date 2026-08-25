import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Razorpay from 'razorpay';
import { calculateDeliveryFee } from '@/lib/pricing/delivery';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId, startDate, endDate, distanceKm } = await request.json();

    if (!listingId || !startDate || !endDate || distanceKm === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== 'AVAILABLE') {
      return NextResponse.json({ success: false, error: 'Listing not available' }, { status: 404 });
    }

    // Calculate Dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate Fees
    const rentAmount = Number(listing.rentalPrice);
    const securityDeposit = Number(listing.securityDeposit);

    const totalAmount = rentAmount + securityDeposit;

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        renterId: user.userId,
        listingId: listing.id,
        startDate: start,
        endDate: end,
        rentAmount,
        securityDeposit,
        totalAmount,
        status: 'PENDING',
      }
    });

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: 'INR',
      receipt: `booking_${booking.id}`,
    });

    // Update Booking with Razorpay Order ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { razorpayOrderId: razorpayOrder.id }
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      breakdown: {
        rentAmount,
        securityDeposit,
        totalAmount
      }
    });

  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
