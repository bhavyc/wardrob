import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import 'dotenv/config';
import { encryptString } from '../src/lib/encryption';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting P2P Fashion Rental database seeding');

  // 0. Clear old data
  console.log('Clearing old data');
  await prisma.cleaningLog.deleteMany();
  await prisma.damageReport.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.duplicatePhotoHash.deleteMany();
  
  // Users and ListerProfiles
  await prisma.listerProfile.deleteMany();
  await prisma.user.deleteMany();

  // 1. Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Main',
      email: 'admin@wardrob.com',
      phone: '0000000000',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // 2. Hub Partner User
  const hub = await prisma.user.create({
    data: {
      name: 'Central Logistics Hub',
      email: 'hub@wardrob.com',
      phone: '1111111111',
      passwordHash: await bcrypt.hash('hub123', 10),
      role: 'HUB_PARTNER',
    },
  });
  console.log('Hub user created:', hub.email);

  // 3. Lister User (Priya)
  const listerUser = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@wardrob.com',
      phone: '9876543210',
      passwordHash: await bcrypt.hash('lister123', 10),
      role: 'LISTER',
      idVerified: true,
      rating: 4.9,
      listerProfile: {
        create: {
          shopName: "Priya's Luxury Ethnic Closet",
          bio: 'Curated bridal and festival lehengas worn once, maintained in pristine condition.',
          aadhaarNumber: encryptString('554433221100'),
          panNumber: encryptString('PRYSH1234F'),
          bankAccountNo: encryptString('9876543210123'),
          bankIfsc: 'HDFC0001234',
          status: 'APPROVED',
          commissionOverride: 25.00,
        },
      },
    },
  });
  console.log('Lister User & Profile created:', listerUser.email);

  const listerProfile = await prisma.listerProfile.findUnique({
    where: { userId: listerUser.id },
  });

  if (!listerProfile) {
    throw new Error('Lister profile creation failed');
  }

  // 4. Renter User (Anjali)
  const renterUser = await prisma.user.upsert({
    where: { email: 'anjali@wardrob.com' },
    update: {},
    create: {
      name: 'Sneha Verma',
      email: 'sneha@wardrob.com',
      phone: '8765432109',
      passwordHash: await bcrypt.hash('renter123', 10),
      role: 'RENTER',
      idVerified: true,
    },
  });
  console.log('Renter User created:', renterUser.email);

  // 5. Listings — using reliable Pexels image URLs
  console.log('Creating P2P Rental Listings...');
  const listing1 = await prisma.listing.create({
    data: {
      listerProfileId: listerProfile.id,
      title: 'Sabyasachi Heritage Floral Velvet Lehenga',
      description: 'Stunning royal velvet lehenga with zardozi embroidery and double dupatta. Ideal for weddings.',
      category: 'Lehenga',
      size: 'M',
      condition: 'Pristine (Worn Once)',
      rentalPrice: 1500.00,
      securityDeposit: 3000.00,
      baselineImages: [
        'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      status: 'AVAILABLE',
      isFeatured: true,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      listerProfileId: listerProfile.id,
      title: 'Kanchipuram Pure Gold Zari Silk Saree',
      description: 'Traditional heavy gold zari woven pure silk saree in ruby crimson. Perfect for wedding receptions.',
      category: 'Saree',
      size: 'Free Size',
      condition: 'Excellent',
      rentalPrice: 1200.00,
      securityDeposit: 2500.00,
      baselineImages: [
        'https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      status: 'AVAILABLE',
      isFeatured: true,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      listerProfileId: listerProfile.id,
      title: "Designer Men's Raw Silk Pastel Sherwani",
      description: 'Pastel peach raw silk tailored sherwani with subtle thread work and gold buttons.',
      category: 'Sherwani',
      size: 'L (40)',
      condition: 'Like New',
      rentalPrice: 1800.00,
      securityDeposit: 3500.00,
      baselineImages: [
        'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      status: 'AVAILABLE',
      isFeatured: false,
    },
  });

  console.log('Listings created:', listing1.title, ',', listing2.title, ',', listing3.title);

  console.log('Seeding 20 more products...');
  const additionalProducts = [
    { title: 'Anita Dongre Pink Silk Lehenga', category: 'Lehenga', size: 'S', condition: 'Like New', rentalPrice: 2000, securityDeposit: 5000, baselineImages: ['https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Gorgeous pink silk lehenga with gota patti work.' },
    { title: 'Manish Malhotra Sequin Saree', category: 'Saree', size: 'Free Size', condition: 'Excellent', rentalPrice: 2500, securityDeposit: 6000, baselineImages: ['https://images.pexels.com/photos/3731257/pexels-photo-3731257.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Glamorous sequin saree perfect for cocktail parties.' },
    { title: 'Tarun Tahiliani Bridal Gown', category: 'Gown', size: 'M', condition: 'Pristine (Worn Once)', rentalPrice: 3500, securityDeposit: 8000, baselineImages: ['https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Exquisite ivory bridal gown with crystal detailing.' },
    { title: "Sabyasachi Men's Floral Kurta", category: 'Kurta', size: 'L', condition: 'Like New', rentalPrice: 1200, securityDeposit: 3000, baselineImages: ['https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Classic floral printed silk kurta for men.' },
    { title: 'Abu Jani Sandeep Khosla Anarkali', category: 'Anarkali', size: 'M', condition: 'Excellent', rentalPrice: 2200, securityDeposit: 5000, baselineImages: ['https://images.pexels.com/photos/2955376/pexels-photo-2955376.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Heavy mirror work anarkali suit in deep emerald.' },
    { title: 'Kanchipuram Green Zari Saree', category: 'Saree', size: 'Free Size', condition: 'Like New', rentalPrice: 1500, securityDeposit: 4000, baselineImages: ['https://images.pexels.com/photos/2955375/pexels-photo-2955375.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Authentic green Kanchipuram silk with gold zari border.' },
    { title: 'Banarasi Silk Brocade Lehenga', category: 'Lehenga', size: 'L', condition: 'Good', rentalPrice: 1800, securityDeposit: 4000, baselineImages: ['https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Traditional red Banarasi brocade lehenga.' },
    { title: 'Classic White Chikankari Sherwani', category: 'Sherwani', size: 'XL', condition: 'Excellent', rentalPrice: 2000, securityDeposit: 4500, baselineImages: ['https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Elegant white sherwani with fine chikankari embroidery.' },
    { title: 'Ritu Kumar Embroidered Tunic', category: 'Kurta', size: 'S', condition: 'Like New', rentalPrice: 800, securityDeposit: 2000, baselineImages: ['https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Boho-chic embroidered tunic with delicate threadwork.' },
    { title: 'Shantanu & Nikhil Drape Kurta', category: 'Kurta', size: 'M', condition: 'Pristine (Worn Once)', rentalPrice: 1500, securityDeposit: 3500, baselineImages: ['https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Modern asymmetric drape kurta in charcoal.' },
    { title: 'Gaurav Gupta Sculpted Gown', category: 'Gown', size: 'M', condition: 'Excellent', rentalPrice: 3000, securityDeposit: 7000, baselineImages: ['https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Futuristic sculpted metallic gown for receptions.' },
    { title: 'Velvet Maroon Bridal Lehenga', category: 'Lehenga', size: 'L', condition: 'Like New', rentalPrice: 4000, securityDeposit: 9000, baselineImages: ['https://images.pexels.com/photos/2955376/pexels-photo-2955376.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Heavy maroon velvet lehenga for the main wedding day.' },
    { title: 'Pastel Organza Saree with Pearls', category: 'Saree', size: 'Free Size', condition: 'Good', rentalPrice: 1200, securityDeposit: 3000, baselineImages: ['https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Lightweight pastel organza saree bordered with pearls.' },
    { title: 'Indo-Western Tuxedo Suit', category: 'Suit', size: 'M', condition: 'Excellent', rentalPrice: 1800, securityDeposit: 4000, baselineImages: ['https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Midnight blue indo-western tuxedo for cocktail events.' },
    { title: 'Mirror Work Navratri Lehenga', category: 'Lehenga', size: 'M', condition: 'Like New', rentalPrice: 1000, securityDeposit: 2500, baselineImages: ['https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Vibrant multi-color mirror work lehenga for garba nights.' },
    { title: 'Handloom Cotton Ikat Kurta', category: 'Kurta', size: 'XL', condition: 'Good', rentalPrice: 500, securityDeposit: 1500, baselineImages: ['https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Comfortable cotton ikat kurta for daytime events.' },
    { title: 'Zardozi Embroidered Silk Saree', category: 'Saree', size: 'Free Size', condition: 'Excellent', rentalPrice: 2000, securityDeposit: 5000, baselineImages: ['https://images.pexels.com/photos/2955375/pexels-photo-2955375.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Rich silk saree with intricate gold zardozi work.' },
    { title: 'Royal Blue Jodhpuri Suit', category: 'Sherwani', size: 'L', condition: 'Like New', rentalPrice: 1600, securityDeposit: 4000, baselineImages: ['https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Classic Jodhpuri suit in royal blue with pocket square.' },
    { title: 'Georgette Flowy Gown with Cape', category: 'Gown', size: 'S', condition: 'Pristine (Worn Once)', rentalPrice: 1400, securityDeposit: 3500, baselineImages: ['https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Flowy georgette gown paired with an embellished cape.' },
    { title: 'Phulkari Embroidered Patiala Suit', category: 'Kurta', size: 'M', condition: 'Excellent', rentalPrice: 900, securityDeposit: 2000, baselineImages: ['https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800'], listerProfileId: listerProfile.id, description: 'Bright Punjabi patiala suit with authentic Phulkari.' },
  ];

  await prisma.listing.createMany({
    data: additionalProducts.map(p => ({
      ...p,
      status: 'AVAILABLE' as const
    }))
  });
  console.log('20 additional products seeded successfully.');

  // 6. Seed an Active Booking with Shipment Leg 1
  const booking1 = await prisma.booking.create({
    data: {
      renterId: renterUser.id,
      listingId: listing1.id,
      startDate: new Date(Date.now() + 86400000 * 2), // 2 days from now
      endDate: new Date(Date.now() + 86400000 * 6),   // 4 days duration
      rentAmount: 6000.00, // 1500 * 4 days
      securityDeposit: 3000.00,
      totalAmount: 9000.00,
      status: 'CONFIRMED',
      shipments: {
        create: {
          leg: 'LISTER_TO_HUB',
          status: 'IN_TRANSIT',
          courierName: 'Porter Hyperlocal',
          trackingNumber: 'PRT-89210-BLR',
          distanceZone: 'MID_5_15KM',
        },
      },
    },
  });
  console.log('Active Booking created with Leg 1 Shipment:', booking1.id);

  // 7. Seed a Completed Booking with Pending Payout for Lister
  const booking2 = await prisma.booking.create({
    data: {
      renterId: renterUser.id,
      listingId: listing2.id,
      startDate: new Date(Date.now() - 86400000 * 7),
      endDate: new Date(Date.now() - 86400000 * 3),
      actualReturnDate: new Date(Date.now() - 86400000 * 3),
      rentAmount: 4800.00, // 1200 * 4 days
      securityDeposit: 2500.00,
      totalAmount: 7300.00,
      status: 'COMPLETED',
      payout: {
        create: {
          listerProfileId: listerProfile.id,
          amount: 3600.00, // 4800 - 25% commission (1200) = 3600
          commissionPaid: 1200.00,
          status: 'PENDING', // Awaiting manual bank transfer by Admin
        },
      },
    },
  });
  console.log('Completed Booking created with PENDING Lister Payout:', booking2.id);

  // 8. Seed a Damage Report with OPEN Dispute
  const report1 = await prisma.damageReport.create({
    data: {
      bookingId: booking2.id,
      inspectionType: 'POST_RETURN',
      grade: 'C_MAJOR',
      deductionAmount: 800.00,
      evidencePhotos: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop',
      ],
      isDisputed: true,
      dispute: {
        create: {
          status: 'OPEN',
          adminNotes: 'Renter claimed stain was present upon delivery. Hub pre-dispatch photo being cross-referenced.',
        },
      },
    },
  });
  console.log('Damage Report & Open Dispute created:', report1.id);

  console.log(' P2P Seeding process complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
