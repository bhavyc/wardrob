import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getNextAvailableDate } from '@/lib/availability';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        lister: {
          select: {
            shopName: true,
            user: { select: { name: true, rating: true } },
          },
        },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE'] },
            endDate: { gte: new Date() },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!listing || (listing.status !== 'AVAILABLE' && listing.status !== 'AT_HUB' && listing.status !== 'RENTED')) {
      return NextResponse.json(
        { success: false, error: 'Listing not found or not available.' },
        { status: 404 }
      );
    }

    const nextAvail = getNextAvailableDate(listing.bookings || []);

    // Map to normalized structure for frontend
    const product = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.rentalPrice,
      rentalPrice: listing.rentalPrice,
      securityDeposit: listing.securityDeposit,
      category: listing.category,
      size: listing.size,
      sizes: [listing.size],
      colors: ['Curated Color'],
      condition: listing.condition,
      images: listing.baselineImages,
      isApproved: true,
      isBestSeller: listing.isFeatured,
      status: listing.status,
      bookings: listing.bookings || [],
      nextAvailableDate: {
        isAvailableNow: nextAvail.isAvailableNow,
        nextDate: nextAvail.nextDate.toISOString(),
        badgeText: nextAvail.badgeText,
      },
      isAvailableNow: nextAvail.isAvailableNow,
      availabilityBadge: nextAvail.badgeText,
      lister: {
        shopName: listing.lister.shopName || listing.lister.user.name,
        user: {
          name: listing.lister.user.name,
          rating: listing.lister.user.rating ? Number(listing.lister.user.rating) : null,
        },
      },
    };

    return NextResponse.json({
      success: true,
      product,
      listing: {
        ...listing,
        nextAvailableDate: nextAvail.nextDate.toISOString(),
        isAvailableNow: nextAvail.isAvailableNow,
        availabilityBadge: nextAvail.badgeText,
      },
      bookings: listing.bookings || [],
      nextAvailableDate: nextAvail.nextDate.toISOString(),
      isAvailableNow: nextAvail.isAvailableNow,
      availabilityBadge: nextAvail.badgeText,
    });
  } catch (error: any) {
    console.error('API Single Listing GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
