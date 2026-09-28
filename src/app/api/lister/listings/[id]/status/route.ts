import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'LISTER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Lister access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const requestedStatus = body.status as string | undefined;

    // Find lister profile
    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!listerProfile) {
      return NextResponse.json(
        { success: false, error: 'Lister profile not found.' },
        { status: 404 }
      );
    }

    // Verify ownership of the listing
    const listing = await prisma.listing.findFirst({
      where: {
        id,
        listerProfileId: listerProfile.id,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found or does not belong to you.' },
        { status: 404 }
      );
    }

    // Determine target status
    let newStatus: 'AVAILABLE' | 'UNLISTED';
    if (requestedStatus === 'AVAILABLE' || requestedStatus === 'UNLISTED') {
      newStatus = requestedStatus;
    } else {
      // Toggle logic
      newStatus = listing.status === 'UNLISTED' ? 'AVAILABLE' : 'UNLISTED';
    }

    // Cannot toggle if currently rented out or in hub processing
    if (listing.status === 'RENTED' || listing.status === 'AT_HUB') {
      return NextResponse.json(
        { success: false, error: `Cannot change status of an outfit that is currently ${listing.status === 'RENTED' ? 'rented' : 'at the hub'}.` },
        { status: 400 }
      );
    }

    if (newStatus === 'UNLISTED') {
      // Check for active bookings
      const activeBooking = await prisma.booking.findFirst({
        where: {
          listingId: id,
          status: {
            in: ['PENDING', 'CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE', 'RETURNED_TO_HUB'],
          },
        },
      });

      if (activeBooking) {
        return NextResponse.json(
          { success: false, error: 'Cannot unlist an outfit that has an active or pending order.' },
          { status: 400 }
        );
      }
    }

    // If listing is becoming AVAILABLE, verify lister is approved and paid fee
    if (newStatus === 'AVAILABLE') {
      if (!listerProfile.registrationFeePaid || listerProfile.status !== 'APPROVED') {
        return NextResponse.json(
          {
            success: false,
            error: 'KYC approval and ₹500 boutique fee payment are required before listing outfits.',
          },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: newStatus === 'AVAILABLE' ? 'Outfit is now live and available for rent!' : 'Outfit has been unlisted from public catalog.',
      status: updated.status,
      listing: updated,
    });
  } catch (error: any) {
    console.error('Error toggling listing status:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
