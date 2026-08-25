import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    // Ensure booking is confirmed (payment done)
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json({ success: false, error: 'Booking must be CONFIRMED to trigger pickup' }, { status: 400 });
    }

    // Create Leg 1 Shipment
    const shipment = await prisma.shipment.create({
      data: {
        bookingId,
        leg: 'LISTER_TO_HUB',
        status: 'PENDING',
      }
    });

    // Update Booking status to reflect it's heading to the hub
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'AT_HUB_PRE' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Pickup requested from Lister to Hub',
      shipmentId: shipment.id 
    });

  } catch (error: any) {
    console.error('Shipment Pickup API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
