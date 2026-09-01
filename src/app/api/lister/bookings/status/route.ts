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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            lister: true,
          },
        },
      },
    });
    
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    // IDOR protection: Verify that this booking belongs to the authenticated Lister
    if (booking.listing.lister.userId !== authUser.userId && authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not own this listing booking.' },
        { status: 403 }
      );
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
