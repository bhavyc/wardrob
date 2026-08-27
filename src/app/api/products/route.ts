import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser || (authUser.role !== 'LISTER' && authUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Lister access required.' },
        { status: 401 }
      );
    }

    const {
      title,
      description,
      category,
      size,
      condition,
      rentalPrice,
      securityDeposit,
      baselineImages = [],
    } = await request.json();

    if (!title || !description || !rentalPrice || !securityDeposit || !category || !size) {
      return NextResponse.json(
        { success: false, error: 'Title, description, category, size, rental price, and security deposit are required.' },
        { status: 400 }
      );
    }
    
    if (Number(rentalPrice) < 5000) {
      return NextResponse.json(
        { success: false, error: 'Minimum event package rent allowed is ₹5000.' },
        { status: 400 }
      );
    }

    // Retrieve or create lister profile
    let listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!listerProfile) {
      listerProfile = await prisma.listerProfile.create({
        data: {
          userId: authUser.userId,
          status: 'APPROVED',
        },
      });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        category,
        size,
        condition: condition || 'Excellent',
        rentalPrice: Number(rentalPrice),
        securityDeposit: Number(securityDeposit),
        baselineImages: baselineImages || [],
        status: 'AVAILABLE',
        listerProfileId: listerProfile.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rental item listed successfully.',
      listing,
      product: listing,
    });
  } catch (error: any) {
    console.error('API Listings POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category');
    
    // Fetch all available listings
    const rawListings = await prisma.listing.findMany({
      where: { status: 'AVAILABLE' },
      include: {
        lister: {
          select: {
            shopName: true,
            user: { select: { name: true, rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let filtered = rawListings.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      price: l.rentalPrice,
      rentalPrice: l.rentalPrice,
      securityDeposit: l.securityDeposit,
      category: l.category,
      size: l.size,
      sizes: [l.size],
      colors: ['Curated Color'],
      condition: l.condition,
      images: l.baselineImages,
      isApproved: true,
      isBestLister: l.isFeatured,
      Lister: {
        shopName: l.lister.shopName || l.lister.user.name,
      },
    }));

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }

    if (category && category !== 'ALL') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      products: filtered,
      listings: rawListings,
    });
  } catch (error: any) {
    console.error('API Listings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
