import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    // 1. Seed / Ensure Verified Lister Profile
    let listerUser = await prisma.user.findUnique({
      where: { email: 'atelier@wardrob.com' },
      include: { listerProfile: true },
    });

    if (!listerUser) {
      listerUser = await prisma.user.create({
        data: {
          name: 'Royal Heritage Atelier',
          email: 'atelier@wardrob.com',
          phone: '+919999900001',
          passwordHash: defaultPasswordHash,
          role: 'LISTER',
          idVerified: true,
          idVerificationStatus: 'APPROVED',
          listerProfile: {
            create: {
              shopName: 'Royal Heritage Atelier',
              bio: 'Premier luxury designer archives curated from top ateliers across India.',
              status: 'APPROVED',
              registrationFeePaid: true,
            },
          },
        },
        include: { listerProfile: true },
      });
    } else if (!listerUser.listerProfile) {
      await prisma.listerProfile.create({
        data: {
          userId: listerUser.id,
          shopName: 'Royal Heritage Atelier',
          bio: 'Premier luxury designer archives curated from top ateliers across India.',
          status: 'APPROVED',
          registrationFeePaid: true,
        },
      });
      listerUser = await prisma.user.findUnique({
        where: { id: listerUser.id },
        include: { listerProfile: true },
      });
    }

    const listerProfileId = listerUser!.listerProfile!.id;

    // 2. Seed / Ensure Dedicated Play Store Reviewer Account (Renter)
    let reviewerUser = await prisma.user.findUnique({
      where: { email: 'reviewer@wardrob.com' },
    });

    if (!reviewerUser) {
      reviewerUser = await prisma.user.create({
        data: {
          name: 'Google Reviewer',
          email: 'reviewer@wardrob.com',
          phone: '+919999900002',
          passwordHash: defaultPasswordHash,
          role: 'RENTER',
          idVerified: true,
          idVerificationStatus: 'APPROVED',
          aadhaarNumber: '999988887777',
          panNumber: 'ABCDE1234F',
        },
      });
    }

    // 3. Seed / Ensure Verified Hub Partner (for Inspection Flows)
    let hubUser = await prisma.user.findUnique({
      where: { email: 'hub@wardrob.com' },
    });

    if (!hubUser) {
      hubUser = await prisma.user.create({
        data: {
          name: 'Mumbai Hub Operations',
          email: 'hub@wardrob.com',
          phone: '+919999900003',
          passwordHash: defaultPasswordHash,
          role: 'HUB_PARTNER',
          idVerified: true,
          idVerificationStatus: 'APPROVED',
        },
      });
    }

    // 4. Seed Diverse Luxury Listings (Men, Women, Sarees, Lehengas, Sherwanis, Gowns)
    const dummyListings = [
      {
        title: 'Sabyasachi Heritage Crimson Bridal Lehenga',
        description: 'Authentic hand-embroidered crimson silk bridal lehenga with heirloom zardosi craftsmanship, paired with an embroidered tulle dupatta and signature Bengal tiger emblem belt.',
        category: 'Bridal Lehengas',
        size: 'M',
        condition: 'Mint Condition',
        rentalPrice: 35000,
        securityDeposit: 15000,
        sku: 'SABYA-CRIM-M-001',
        shelfLocation: 'HUB-BAY-A1',
        isFeatured: true,
        baselineImages: [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
        ],
      },
      {
        title: 'Manish Malhotra Champagne Sequined Saree',
        description: 'Iconic ombre high-glam metallic sequin saree with liquid drape, accompanied by a custom tailored silk halter-neck blouse. Perfect for red-carpet cocktail events.',
        category: 'Party Wear Sarees',
        size: 'Free Size',
        condition: 'Like New',
        rentalPrice: 14000,
        securityDeposit: 6000,
        sku: 'MM-SEQ-FS-002',
        shelfLocation: 'HUB-BAY-A2',
        isFeatured: true,
        baselineImages: [
          'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?auto=format&fit=crop&q=80&w=800',
        ],
      },
      {
        title: 'Anita Dongre Emerald Gota Patti Anarkali',
        description: 'Breathable raw silk mint & emerald green floor-length Anarkali adorned with traditional Rajasthani gota patti motifs and a lightweight organza dupatta.',
        category: 'Festive Anarkalis',
        size: 'S',
        condition: 'Excellent',
        rentalPrice: 9500,
        securityDeposit: 4000,
        sku: 'AD-ANARK-S-003',
        shelfLocation: 'HUB-BAY-B1',
        isFeatured: false,
        baselineImages: [
          'https://images.unsplash.com/photo-1583391733958-6c782781b955?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=800',
        ],
      },
      {
        title: 'Rohit Bal Royal Velvet Groom Sherwani',
        description: 'Imperial midnight blue velvet bespoke sherwani with antique gold dori embroidery, handcrafted metallic buttons, and matching ivory churidar.',
        category: 'Royal Sherwanis',
        size: 'L',
        condition: 'Mint Condition',
        rentalPrice: 22000,
        securityDeposit: 10000,
        sku: 'RB-SHER-L-004',
        shelfLocation: 'HUB-BAY-B2',
        isFeatured: true,
        baselineImages: [
          'https://images.unsplash.com/photo-1594938298596-eb5fd5e53377?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800',
        ],
      },
      {
        title: 'Tarun Tahiliani Pearl Concept Draped Gown',
        description: 'Sculpted pearl-ivory Italian tulle concept draped saree gown with hand-sewn crystal fringing and structured shoulder flare.',
        category: 'Cocktail Gowns',
        size: 'M',
        condition: 'Like New',
        rentalPrice: 18000,
        securityDeposit: 8000,
        sku: 'TT-GOWN-M-005',
        shelfLocation: 'HUB-BAY-C1',
        isFeatured: true,
        baselineImages: [
          'https://images.unsplash.com/photo-1593030761757-71fae46af508?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=800',
        ],
      },
      {
        title: 'Raghavendra Rathore Bespoke Bandhgala',
        description: 'Classic bespoke black tailored Jodhpuri Bandhgala jacket with monogrammed gold crest buttons and Italian wool suiting.',
        category: 'Royal Sherwanis',
        size: 'M',
        condition: 'Pristine',
        rentalPrice: 16000,
        securityDeposit: 7000,
        sku: 'RR-BANDH-M-006',
        shelfLocation: 'HUB-BAY-C2',
        isFeatured: false,
        baselineImages: [
          'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&q=80&w=800',
        ],
      },
      {
        title: 'Falguni Shane Peacock Feather Crystal Lehenga',
        description: 'Avant-garde silver-blush lehenga laden with Swarovski crystals, sequins, and signature feathered accents for modern luxury receptions.',
        category: 'Bridal Lehengas',
        size: 'S',
        condition: 'Like New',
        rentalPrice: 38000,
        securityDeposit: 16000,
        sku: 'FSP-LEH-S-007',
        shelfLocation: 'HUB-BAY-D1',
        isFeatured: true,
        baselineImages: [
          'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800',
        ],
      },
      {
        title: 'Seema Gujral Mirror Work Organza Saree',
        description: 'Ethereal lavender organza saree encrusted with geometric mirror reflection work and scalloped thread borders.',
        category: 'Party Wear Sarees',
        size: 'Free Size',
        condition: 'Excellent',
        rentalPrice: 11000,
        securityDeposit: 5000,
        sku: 'SG-MIRR-FS-008',
        shelfLocation: 'HUB-BAY-D2',
        isFeatured: false,
        baselineImages: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&q=80&w=800',
        ],
      },
    ];

    let createdListingsCount = 0;
    const createdListings: any[] = [];

    for (const item of dummyListings) {
      let listing = await prisma.listing.findFirst({
        where: { sku: item.sku },
      });

      if (!listing) {
        listing = await prisma.listing.create({
          data: {
            title: item.title,
            description: item.description,
            category: item.category,
            size: item.size,
            condition: item.condition,
            rentalPrice: item.rentalPrice,
            securityDeposit: item.securityDeposit,
            sku: item.sku,
            shelfLocation: item.shelfLocation,
            isFeatured: item.isFeatured,
            status: 'AVAILABLE',
            baselineImages: item.baselineImages,
            listerProfileId: listerProfileId,
          },
        });
        createdListingsCount++;
      }
      createdListings.push(listing);
    }

    // 5. Seed Test Active & Completed Bookings for Google Reviewer
    let seededBookingsCount = 0;
    const firstListing = createdListings[0];
    const secondListing = createdListings[1] || createdListings[0];

    if (firstListing && reviewerUser) {
      // Check if active booking exists
      const existingActiveBooking = await prisma.booking.findFirst({
        where: { renterId: reviewerUser.id, status: 'OUT_FOR_DELIVERY' },
      });

      if (!existingActiveBooking) {
        const today = new Date();
        const start = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const end = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); // 4 days rental

        const activeBooking = await prisma.booking.create({
          data: {
            renterId: reviewerUser.id,
            listingId: firstListing.id,
            startDate: start,
            endDate: end,
            rentAmount: firstListing.rentalPrice,
            securityDeposit: firstListing.securityDeposit,
            totalAmount: Number(firstListing.rentalPrice) + Number(firstListing.securityDeposit),
            status: 'OUT_FOR_DELIVERY',
            contactName: 'Google App Reviewer',
            contactPhone: '+919999900002',
            shippingAddress: 'Level 4, Signature Tower, Bandra Kurla Complex',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400051',
          },
        });

        // Add tracking shipment
        await prisma.shipment.create({
          data: {
            bookingId: activeBooking.id,
            leg: 'HUB_TO_RENTER',
            status: 'IN_TRANSIT',
            courierName: 'BlueDart Luxury Express',
            trackingNumber: 'BLUEDART-WD982341',
            dispatchedAt: new Date(),
          },
        });

        seededBookingsCount++;
      }

      // Check if completed booking exists
      const existingCompletedBooking = await prisma.booking.findFirst({
        where: { renterId: reviewerUser.id, status: 'COMPLETED' },
      });

      if (!existingCompletedBooking && secondListing) {
        const pastStart = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const pastEnd = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000);

        await prisma.booking.create({
          data: {
            renterId: reviewerUser.id,
            listingId: secondListing.id,
            startDate: pastStart,
            endDate: pastEnd,
            actualReturnDate: pastEnd,
            rentAmount: secondListing.rentalPrice,
            securityDeposit: secondListing.securityDeposit,
            totalAmount: Number(secondListing.rentalPrice) + Number(secondListing.securityDeposit),
            status: 'COMPLETED',
            contactName: 'Google App Reviewer',
            contactPhone: '+919999900002',
            shippingAddress: 'Level 4, Signature Tower, Bandra Kurla Complex',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400051',
          },
        });
        seededBookingsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Complete test data ready: ${createdListingsCount} luxury silhouettes, 3 verified personas (Reviewer, Lister, Hub), and ${seededBookingsCount} test orders.`,
      testAccounts: {
        reviewerCredentials: {
          role: 'RENTER (Play Store Reviewer)',
          email: 'reviewer@wardrob.com',
          password: 'Password@123',
          idVerified: true,
        },
        listerCredentials: {
          role: 'LISTER (Royal Heritage Atelier)',
          email: 'atelier@wardrob.com',
          password: 'Password@123',
          kycApproved: true,
        },
        hubCredentials: {
          role: 'HUB_PARTNER (Mumbai Central Hub)',
          email: 'hub@wardrob.com',
          password: 'Password@123',
        },
      },
    });
  } catch (error: any) {
    console.error('Error seeding test dummy data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
