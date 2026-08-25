import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { listingId, startDate, endDate, distanceKm = 5 } = await request.json();

    if (!listingId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Listing ID and dates are required.' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const rentAmount = Number(listing.rentalPrice) * days;
    const deliveryFee = 120.00;
    const securityDeposit = Number(listing.securityDeposit);
    const totalAmount = rentAmount + deliveryFee + securityDeposit;

    const booking = await prisma.booking.create({
      data: {
        renterId: authUser.userId,
        listingId: listing.id,
        startDate: start,
        endDate: end,
        rentAmount,
        securityDeposit,
        totalAmount,
        status: 'CONFIRMED',
      },
    });

    return NextResponse.json({
      success: true,
      order: { id: booking.id, totalAmount: booking.totalAmount },
      booking,
    });
  } catch (error: any) {
    console.error('API Orders POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { renterId: authUser.userId },
      include: {
        listing: true,
        shipments: true,
        damageReports: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      orders: bookings,
      bookings,
    });
  } catch (error: any) {
    console.error('API Orders GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
