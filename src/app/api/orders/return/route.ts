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

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID is required.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || booking.status !== 'IN_USE') {
      return NextResponse.json({ success: false, error: 'Booking is not in use or return is already initiated.' }, { status: 400 });
    }

    // Trigger Leg 3 (Renter to Hub Return)
    await prisma.shipment.create({
      data: {
        bookingId,
        leg: 'RENTER_TO_HUB',
        status: 'PENDING',
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'RETURNED_TO_HUB' },
    });

    return NextResponse.json({
      success: true,
      message: 'Return pickup initiated to cleaning hub.',
    });
  } catch (error: any) {
    console.error('API Return Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
