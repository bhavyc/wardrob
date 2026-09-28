import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { calculateRentalWindow, getNextAvailableDate, POST_RETURN_TURNAROUND_DAYS } from '@/lib/availability';

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

    if (!Array.isArray(baselineImages) || baselineImages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one garment photo is required to create a listing.' },
        { status: 400 }
      );
    }
    
    const numRentalPrice = Number(rentalPrice);
    const numSecurityDeposit = Number(securityDeposit);

    if (isNaN(numRentalPrice) || !isFinite(numRentalPrice) || numRentalPrice < 5000) {
      return NextResponse.json(
        { success: false, error: 'Minimum event package rent allowed is ₹5000 and must be a valid number.' },
        { status: 400 }
      );
    }

    if (isNaN(numSecurityDeposit) || !isFinite(numSecurityDeposit) || numSecurityDeposit < 0) {
      return NextResponse.json(
        { success: false, error: 'Security deposit must be a valid non-negative amount.' },
        { status: 400 }
      );
    }

    // Retrieve lister profile
    let listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!listerProfile) {
      return NextResponse.json(
        { success: false, error: 'Lister profile not found. Please complete registration.' },
        { status: 403 }
      );
    }

    if (!listerProfile.registrationFeePaid || listerProfile.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'KYC must be APPROVED and registration fee must be PAID to list items.' },
        { status: 403 }
      );
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        category,
        size,
        condition: condition || 'Excellent',
        rentalPrice: numRentalPrice,
        securityDeposit: numSecurityDeposit,
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
    const eventDateParam = searchParams.get('eventDate');

    const whereClause: any = {
      status: { in: ['AVAILABLE', 'AT_HUB', 'RENTED'] },
    };

    if (eventDateParam) {
      const parsedDate = new Date(eventDateParam);
      if (!isNaN(parsedDate.getTime())) {
        const window = calculateRentalWindow(parsedDate);
        if (window.valid) {
          const returnPickupWithTurnaround = new Date(window.returnPickupDate);
          returnPickupWithTurnaround.setDate(returnPickupWithTurnaround.getDate() + POST_RETURN_TURNAROUND_DAYS);

          const deliveryMinusTurnaround = new Date(window.deliveryDate);
          deliveryMinusTurnaround.setDate(deliveryMinusTurnaround.getDate() - POST_RETURN_TURNAROUND_DAYS);

          whereClause.NOT = {
            bookings: {
              some: {
                status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE'] },
                startDate: { lte: returnPickupWithTurnaround },
                endDate: { gte: deliveryMinusTurnaround },
              },
            },
          };
        }
      }
    }
    
    // Fetch all available listings (including items stored at Central Hub)
    const rawListings = await prisma.listing.findMany({
      where: whereClause,
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
            endDate: { gte: new Date(Date.now() - POST_RETURN_TURNAROUND_DAYS * 24 * 60 * 60 * 1000) },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let filtered = rawListings.map((l) => {
      const nextAvail = getNextAvailableDate(l.bookings || []);
      return {
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
        status: l.status,
        bookings: l.bookings || [],
        nextAvailableDate: nextAvail.nextDate.toISOString(),
        isAvailableNow: nextAvail.isAvailableNow,
        availabilityBadge: nextAvail.badgeText,
        Lister: {
          shopName: l.lister.shopName || l.lister.user.name,
        },
      };
    });

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

    const enrichedListings = rawListings.map((l) => {
      const nextAvail = getNextAvailableDate(l.bookings || []);
      return {
        ...l,
        nextAvailableDate: nextAvail.nextDate.toISOString(),
        isAvailableNow: nextAvail.isAvailableNow,
        availabilityBadge: nextAvail.badgeText,
      };
    });

    return NextResponse.json({
      success: true,
      products: filtered,
      listings: enrichedListings,
    });
  } catch (error: any) {
    console.error('API Listings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
