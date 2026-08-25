import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const listings = await prisma.listing.findMany({
      include: {
        lister: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, listings });
  } catch (error: any) {
    console.error('Admin Listings GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { listingId, isFeatured, status } = await request.json();

    if (!listingId) {
      return NextResponse.json({ success: false, error: 'listingId is required' }, { status: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({ success: true, listing: updated });
  } catch (error: any) {
    console.error('Admin Listings PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
