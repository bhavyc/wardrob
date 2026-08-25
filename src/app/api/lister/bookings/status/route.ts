import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { bookingId, status, trackingNumber, courierName } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID is required.' }, { status: 400 });
    }

    // We no longer let the Lister arbitrarily change the Booking status.
    // The Hub will change the status when they receive it.
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });
    
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    if (trackingNumber || courierName) {
      await prisma.shipment.create({
        data: {
          bookingId,
          leg: 'LISTER_TO_HUB',
          trackingNumber,
          courierName,
          status: 'IN_TRANSIT',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Item dispatched to Hub successfully.',
      booking: booking,
    });
  } catch (error: any) {
    console.error('API Lister Booking Status Update Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
