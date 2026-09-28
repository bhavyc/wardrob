import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { encryptString } from '../src/lib/encryption';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Wiping all old test data & bookings ---');

  // 1. Wipe all operational transaction data
  await prisma.cleaningLog.deleteMany();
  await prisma.damageReport.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.duplicatePhotoHash.deleteMany();
  await prisma.listing.deleteMany();

  console.log('Cleared all bookings, shipments, disputes, payouts, and listings.');

  // 2. Remove all synthetic/test-generated users, but preserve Bhavya and official accounts
  const preservedEmails = [
    'bhavyachh888@gmail.com',
    'bhavyach888@gmail.com',
    'admin@wardrob.com',
    'hub@wardrob.com',
    'priya@wardrob.com',
    'sneha@wardrob.com',
  ];

  await prisma.listerProfile.deleteMany({
    where: {
      user: {
        email: { notIn: preservedEmails },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { notIn: preservedEmails },
    },
  });

  console.log('Cleaned up synthetic test users.');

  // 3. Ensure official accounts exist & passwords are valid
  const defaultPwHash = await bcrypt.hash('wardrob123', 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wardrob.com' },
    update: { role: 'ADMIN', name: 'Admin Main' },
    create: {
      name: 'Admin Main',
      email: 'admin@wardrob.com',
      phone: '0000000000',
      passwordHash: defaultPwHash,
      role: 'ADMIN',
    },
  });

  // Hub Partner
  const hub = await prisma.user.upsert({
    where: { email: 'hub@wardrob.com' },
    update: { role: 'HUB_PARTNER', name: 'Central Logistics Hub' },
    create: {
      name: 'Central Logistics Hub',
      email: 'hub@wardrob.com',
      phone: '1111111111',
      passwordHash: defaultPwHash,
      role: 'HUB_PARTNER',
    },
  });

  // Lister (Priya Sharma)
  const priyaUser = await prisma.user.upsert({
    where: { email: 'priya@wardrob.com' },
    update: { role: 'LISTER', name: 'Priya Sharma', idVerified: true, rating: 4.95 },
    create: {
      name: 'Priya Sharma',
      email: 'priya@wardrob.com',
      phone: '9876543210',
      passwordHash: defaultPwHash,
      role: 'LISTER',
      idVerified: true,
      rating: 4.95,
    },
  });

  const priyaProfile = await prisma.listerProfile.upsert({
    where: { userId: priyaUser.id },
    update: { status: 'APPROVED', shopName: "Priya's Luxury Ethnic Vault" },
    create: {
      userId: priyaUser.id,
      shopName: "Priya's Luxury Ethnic Vault",
      bio: 'Exquisite bridal and occasion couture curated directly from top designer atelier runways.',
      aadhaarNumber: encryptString('554433221100'),
      panNumber: encryptString('PRYSH1234F'),
      bankAccountNo: encryptString('9876543210123'),
      bankIfsc: 'HDFC0001234',
      status: 'APPROVED',
      commissionOverride: 25.0,
    },
  });

  // Lister (Sabyasachi Heritage Atelier)
  const atelierUser = await prisma.user.upsert({
    where: { email: 'atelier@wardrob.com' },
    update: { role: 'LISTER', name: 'Heritage Atelier', idVerified: true, rating: 5.0 },
    create: {
      name: 'Heritage Atelier',
      email: 'atelier@wardrob.com',
      phone: '9888888888',
      passwordHash: defaultPwHash,
      role: 'LISTER',
      idVerified: true,
      rating: 5.0,
    },
  });

  const atelierProfile = await prisma.listerProfile.upsert({
    where: { userId: atelierUser.id },
    update: { status: 'APPROVED', shopName: 'The Heritage Couture Vault' },
    create: {
      userId: atelierUser.id,
      shopName: 'The Heritage Couture Vault',
      bio: 'Authentic royal silken zardozi weaves and designer couture gowns preserved in pristine state.',
      aadhaarNumber: encryptString('665544332211'),
      panNumber: encryptString('ATELR9876K'),
      bankAccountNo: encryptString('9876543210987'),
      bankIfsc: 'ICIC0001234',
      status: 'APPROVED',
      commissionOverride: 20.0,
    },
  });

  // Ensure Bhavya's lister profile exists if account exists
  const bhavyaLister = await prisma.user.findFirst({
    where: { email: { in: ['bhavyach888@gmail.com', 'bhavyachh888@gmail.com'] } },
  });
  if (bhavyaLister) {
    await prisma.listerProfile.upsert({
      where: { userId: bhavyaLister.id },
      update: { status: 'APPROVED', shopName: "Bhavya's Designer Closet" },
      create: {
        userId: bhavyaLister.id,
        shopName: "Bhavya's Designer Closet",
        bio: 'Premium festive ethnic and bespoke formal wear curated for luxury celebrations.',
        aadhaarNumber: encryptString('112233445566'),
        panNumber: encryptString('BHAVY1234P'),
        bankAccountNo: encryptString('1234567890123'),
        bankIfsc: 'SBIN0001234',
        status: 'APPROVED',
        commissionOverride: 20.0,
      },
    });
  }

  // Renter (Sneha Verma)
  await prisma.user.upsert({
    where: { email: 'sneha@wardrob.com' },
    update: { role: 'RENTER', name: 'Sneha Verma', idVerified: true },
    create: {
      name: 'Sneha Verma',
      email: 'sneha@wardrob.com',
      phone: '8765432109',
      passwordHash: defaultPwHash,
      role: 'RENTER',
      idVerified: true,
    },
  });

  console.log('Preserved & setup core users.');

  // 4. Create fresh, realistic, top-tier luxury listings
  console.log('Seeding fresh luxury listings with NO booking conflicts...');

  const freshListings = [
    {
      listerProfileId: atelierProfile.id,
      title: 'Crimson Royal Zardozi Velvet Bridal Lehenga',
      description: 'Handcrafted master bridal lehenga with pure gold zardozi threadwork, paired with dual embellished organza dupattas. Worn once for a high-profile reception, ozone sanitized.',
      category: 'Lehenga',
      size: 'M',
      condition: 'Pristine (Worn Once)',
      rentalPrice: 7500.0,
      securityDeposit: 15000.0,
      baselineImages: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1200',
      ],
      isFeatured: true,
    },
    {
      listerProfileId: priyaProfile.id,
      title: 'Kanchipuram Pure Gold Zari Silk Saree',
      description: 'Traditional heritage weave in deep ruby red featuring real metallic zari brocade borders and handcrafted floral pallu. Perfectly pressed and ready for cocktail or sangeet.',
      category: 'Saree',
      size: 'Free Size',
      condition: 'Pristine (Worn Once)',
      rentalPrice: 5200.0,
      securityDeposit: 10000.0,
      baselineImages: [
        'https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2955375/pexels-photo-2955375.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: true,
    },
    {
      listerProfileId: atelierProfile.id,
      title: 'Pastel Peach Raw Silk Designer Sherwani',
      description: 'Bespoke men’s couture sherwani crafted from textured raw silk with intricate tonal resham embroidery, pearl buttons, and matching modal stole.',
      category: 'Sherwani',
      size: 'L',
      condition: 'Pristine (Worn Once)',
      rentalPrice: 6500.0,
      securityDeposit: 12000.0,
      baselineImages: [
        'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: true,
    },
    {
      listerProfileId: priyaProfile.id,
      title: 'Rose Pink Silk Gota Patti Celebration Lehenga',
      description: 'Lightweight pure raw silk skirt with intricate Rajasthani gota patti work. Features heavily worked blouse with latkans and lightweight scalloped net dupatta.',
      category: 'Lehenga',
      size: 'S',
      condition: 'Like New',
      rentalPrice: 5500.0,
      securityDeposit: 11000.0,
      baselineImages: [
        'https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: false,
    },
    {
      listerProfileId: priyaProfile.id,
      title: 'Midnight Glamour Sequin Cocktail Saree',
      description: 'Modern black and silver ombre sequin drape saree with satin borders. Includes ready-to-wear pre-stitched pleats and custom designer padded blouse.',
      category: 'Saree',
      size: 'Free Size',
      condition: 'Excellent',
      rentalPrice: 5000.0,
      securityDeposit: 9000.0,
      baselineImages: [
        'https://images.pexels.com/photos/3731257/pexels-photo-3731257.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: false,
    },
    {
      listerProfileId: atelierProfile.id,
      title: 'Crystal Embellished Ivory Bridal Gown',
      description: 'Sweeping ballroom silhouette featuring thousands of hand-stitched crystals and delicate illusion neckline. Includes matching crystal-edged chapel train veil.',
      category: 'Gown',
      size: 'M',
      condition: 'Pristine (Worn Once)',
      rentalPrice: 8500.0,
      securityDeposit: 18000.0,
      baselineImages: [
        'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: true,
    },
    {
      listerProfileId: priyaProfile.id,
      title: 'Emerald Mirror Work Heritage Anarkali',
      description: 'Deep royal emerald floor-length flared anarkali suit with authentic Gujarati abla (mirror) work and heavy banarasi silk border dupatta.',
      category: 'Anarkali',
      size: 'M',
      condition: 'Excellent',
      rentalPrice: 5200.0,
      securityDeposit: 9500.0,
      baselineImages: [
        'https://images.pexels.com/photos/2955376/pexels-photo-2955376.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: false,
    },
    {
      listerProfileId: atelierProfile.id,
      title: 'Royal Blue Velvet Handcrafted Jodhpuri Bandhgala',
      description: 'Rich royal blue micro-velvet bandhgala suit with handcrafted antique brass buttons and bespoke tailored slim trousers. Ideal for cocktail or sangeet night.',
      category: 'Sherwani',
      size: 'L',
      condition: 'Pristine (Worn Once)',
      rentalPrice: 5800.0,
      securityDeposit: 11000.0,
      baselineImages: [
        'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: false,
    },
    {
      listerProfileId: priyaProfile.id,
      title: 'Maroon Velvet Regal Bridal Lehenga',
      description: 'Heavy architectural bridal lehenga in rich velvet with detailed floral zari patterns, matching embellished potli and double dupattas.',
      category: 'Lehenga',
      size: 'L',
      condition: 'Pristine (Worn Once)',
      rentalPrice: 8000.0,
      securityDeposit: 16000.0,
      baselineImages: [
        'https://images.pexels.com/photos/2955376/pexels-photo-2955376.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: true,
    },
    {
      listerProfileId: atelierProfile.id,
      title: 'Metallic Champagne Sculpted Couture Gown',
      description: 'Modern red-carpet architectural gown in shimmering champagne metallic fabric with structured bodice and side drape.',
      category: 'Gown',
      size: 'S',
      condition: 'Like New',
      rentalPrice: 6200.0,
      securityDeposit: 13000.0,
      baselineImages: [
        'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      isFeatured: false,
    },
  ];

  for (const item of freshListings) {
    await prisma.listing.create({
      data: {
        ...item,
        status: 'AVAILABLE',
      },
    });
  }

  console.log(`Successfully created ${freshListings.length} pristine luxury listings.`);
  console.log('All listings are 100% AVAILABLE with ZERO conflicting bookings!');
  console.log('Seeding clean completed successfully.');
}

main()
  .catch((e) => {
    console.error('Clean seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
