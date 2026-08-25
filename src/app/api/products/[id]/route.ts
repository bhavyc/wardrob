import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
      },
    });

    if (!listing || listing.status !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, error: 'Listing not found or not available.' },
        { status: 404 }
      );
    }

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
      lister: {
        shopName: listing.lister.shopName || listing.lister.user.name,
      },
    };

    return NextResponse.json({
      success: true,
      product,
      listing,
    });
  } catch (error: any) {
    console.error('API Single Listing GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
