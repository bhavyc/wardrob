import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'HUB_PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Hub access required.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const listingId = resolvedParams.id;
    if (!listingId) {
      return NextResponse.json({ success: false, error: 'Listing ID is required.' }, { status: 400 });
    }

    const { shelfLocation } = await request.json();
    if (shelfLocation === undefined) {
      return NextResponse.json({ success: false, error: 'shelfLocation is required.' }, { status: 400 });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { shelfLocation: shelfLocation.trim() || null },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Shelf location updated.',
      shelfLocation: updatedListing.shelfLocation
    });
  } catch (error: any) {
    console.error('Hub Listing Location API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
