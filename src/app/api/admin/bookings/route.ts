import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const bookings = await prisma.booking.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        renter: { select: { id: true, name: true, email: true, phone: true, aadhaarNumber: true, panNumber: true } },
        listing: {
          include: {
            lister: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
        shipments: { orderBy: { createdAt: 'asc' } },
        cleaningLogs: { orderBy: { createdAt: 'desc' } },
        damageReports: {
          include: { dispute: true },
          orderBy: { createdAt: 'desc' },
        },
        payout: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt Renter KYC for Admin view
    const { decryptString } = await import('@/lib/encryption');
    const safeBookings = bookings.map(b => ({
      ...b,
      renter: {
        ...b.renter,
        aadhaarNumber: b.renter.aadhaarNumber ? decryptString(b.renter.aadhaarNumber) : null,
        panNumber: b.renter.panNumber ? decryptString(b.renter.panNumber) : null,
      }
    }));

    return NextResponse.json({ success: true, bookings: safeBookings });
  } catch (error: any) {
    console.error('Admin Bookings GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json({ success: false, error: 'bookingId and status are required' }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: status as any },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    console.error('Admin Bookings PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
