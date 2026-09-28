import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!listerProfile) {
      return NextResponse.json(
        { success: false, error: 'Lister profile not found.' },
        { status: 404 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        listing: { listerProfileId: listerProfile.id },
      },
      include: {
        listing: true,
        renter: { select: { id: true, name: true, phone: true } },
        shipments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Disintermediation & Privacy Protection:
    // Strip Renter's private home delivery address & phone from the Lister's view.
    // Lister only coordinates Leg 1 (ship to Central Hub), while Hub handles Renter delivery.
    const sanitizedBookings = bookings.map(b => ({
      ...b,
      shippingAddress: null,
      city: null,
      state: null,
      pincode: null,
      contactPhone: null,
      contactName: null,
      renter: b.renter ? { id: b.renter.id, name: b.renter.name } : null,
    }));

    return NextResponse.json({
      success: true,
      bookings: sanitizedBookings,
    });
  } catch (error: any) {
    console.error('API Lister Bookings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
