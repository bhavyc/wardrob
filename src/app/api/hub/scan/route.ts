import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'HUB_PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Hub access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku');

    if (!sku) {
      return NextResponse.json({ success: false, error: 'SKU is required.' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { sku: sku.trim() },
      include: {
        bookings: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] }
          },
          include: {
            renter: { select: { name: true, phone: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'No item found with this SKU.' }, { status: 404 });
    }

    const currentBooking = listing.bookings[0] || null;

    // Determine the next action
    let nextAction = 'Storage';
    let actionColor = '#10B981'; // Green
    
    if (currentBooking) {
      if (currentBooking.status === 'CONFIRMED' || currentBooking.status === 'AT_HUB_PRE') {
        nextAction = 'Needs Pre-Dispatch Inspection';
        actionColor = '#F59E0B'; // Amber
      } else if (currentBooking.status === 'RETURNED_TO_HUB') {
        nextAction = 'Needs Post-Return Inspection';
        actionColor = '#EF4444'; // Red
      }
    } else if (listing.status === 'AT_HUB') {
      nextAction = 'Ready for Storage';
      actionColor = '#3B82F6'; // Blue
    }

    return NextResponse.json({ 
      success: true, 
      listing,
      currentBooking,
      nextAction,
      actionColor
    });
  } catch (error: any) {
    console.error('Hub Scan API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
