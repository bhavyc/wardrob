import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { bookingId } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { include: { lister: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    }

    const isRenter = booking.renterId === authUser.userId;
    const isLister = booking.listing?.lister?.userId === authUser.userId;
    const isAuthorized = isRenter || isLister || authUser.role === 'ADMIN' || authUser.role === 'HUB_PARTNER';

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized to view this booking.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      booking,
      order: booking,
    });
  } catch (error: any) {
    console.error('API Orders Verify Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
