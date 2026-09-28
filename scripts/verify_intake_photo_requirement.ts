import fs from 'fs';
import path from 'path';

// Pre-load .env variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { prisma } from '../src/lib/db';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'wardrob-dev-jwt-secret-12345';

function createToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

async function verifyMandatoryPhotos() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       MANDATORY PHOTO BASELINE VERIFICATION TEST         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Get or create a HUB_PARTNER user
    let hubUser = await prisma.user.findFirst({ where: { role: 'HUB_PARTNER' } });
    if (!hubUser) {
      hubUser = await prisma.user.create({
        data: {
          name: 'Hub QC Officer',
          email: `hub_qc_${Date.now()}@wardrob-test.com`,
          phone: `95${Math.floor(10000000 + Math.random() * 90000000)}`,
          role: 'HUB_PARTNER',
        }
      });
    }
    const hubToken = createToken(hubUser.id, 'HUB_PARTNER');

    // 2. Create a test booking for inspection testing
    const lister = await prisma.user.create({
      data: {
        name: 'QC Lister',
        email: `qc_lister_${Date.now()}@test.com`,
        phone: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'LISTER'
      }
    });
    const listerProfile = await prisma.listerProfile.create({
      data: {
        userId: lister.id,
        shopName: 'QC Boutique',
        status: 'APPROVED',
        registrationFeePaid: true
      }
    });
    const renter = await prisma.user.create({
      data: {
        name: 'QC Renter',
        email: `qc_renter_${Date.now()}@test.com`,
        phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'RENTER'
      }
    });
    const listing = await prisma.listing.create({
      data: {
        listerProfileId: listerProfile.id,
        title: 'QC Test Anarkali Suit',
        description: 'Testing mandatory photo requirements',
        category: 'Anarkali',
        size: 'M',
        condition: 'NEW',
        rentalPrice: 6000,
        securityDeposit: 2000,
        baselineImages: ['https://images.unsplash.com/sample-anarkali.jpg'],
        status: 'RENTED'
      }
    });

    const booking = await prisma.booking.create({
      data: {
        renterId: renter.id,
        listingId: listing.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        rentAmount: 6000,
        securityDeposit: 2000,
        totalAmount: 8000,
        status: 'AT_HUB_PRE'
      }
    });

    console.log(`Created Test Booking: ${booking.id}`);

    // TEST 1: Attempt LISTER_TO_HUB_INTAKE with zero photos -> MUST FAIL (400)
    console.log('\n--- TEST 1: Intake Inspection with 0 Photos ---');
    const res1 = await fetch(`${BASE_URL}/api/hub/inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hubToken}`
      },
      body: JSON.stringify({
        bookingId: booking.id,
        inspectionType: 'LISTER_TO_HUB_INTAKE',
        evidencePhotos: [] // ZERO PHOTOS
      })
    });

    const data1 = await res1.json();
    console.log(`HTTP Status: ${res1.status}`);
    console.log(`Response:`, data1);

    if (res1.status === 400 && data1.success === false && data1.error.includes('intake photo is required')) {
      console.log('✅ PASS: Intake inspection with 0 photos was strictly REJECTED by the server!');
    } else {
      throw new Error(`TEST 1 FAILED: Expected 400 rejection for 0 intake photos, got ${res1.status}`);
    }

    // TEST 2: Attempt PRE_DISPATCH with zero photos -> MUST FAIL (400)
    console.log('\n--- TEST 2: Pre-Dispatch Inspection with 0 Photos ---');
    const res2 = await fetch(`${BASE_URL}/api/hub/inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hubToken}`
      },
      body: JSON.stringify({
        bookingId: booking.id,
        inspectionType: 'PRE_DISPATCH',
        evidencePhotos: [] // ZERO PHOTOS
      })
    });

    const data2 = await res2.json();
    console.log(`HTTP Status: ${res2.status}`);
    console.log(`Response:`, data2);

    if (res2.status === 400 && data2.success === false && data2.error.includes('pre-dispatch photo is required')) {
      console.log('✅ PASS: Pre-Dispatch inspection with 0 photos was strictly REJECTED by the server!');
    } else {
      throw new Error(`TEST 2 FAILED: Expected 400 rejection for 0 pre-dispatch photos, got ${res2.status}`);
    }

    // TEST 3: Attempt POST_RETURN with Grade B and zero photos -> MUST FAIL (400)
    console.log('\n--- TEST 3: Post-Return Damage Report with 0 Photos ---');
    const res3 = await fetch(`${BASE_URL}/api/hub/inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hubToken}`
      },
      body: JSON.stringify({
        bookingId: booking.id,
        inspectionType: 'POST_RETURN',
        grade: 'B_MINOR',
        deductionAmount: 500,
        evidencePhotos: [] // ZERO PHOTOS
      })
    });

    const data3 = await res3.json();
    console.log(`HTTP Status: ${res3.status}`);
    console.log(`Response:`, data3);

    if (res3.status === 400 && data3.success === false && data3.error.includes('Evidence photos are mandatory')) {
      console.log('✅ PASS: Post-Return damage deduction with 0 photos was strictly REJECTED by the server!');
    } else {
      throw new Error(`TEST 3 FAILED: Expected 400 rejection for 0 damage photos, got ${res3.status}`);
    }

    // TEST 4: Attempt Listing Creation with zero baseline photos -> MUST FAIL (400)
    console.log('\n--- TEST 4: Lister Listing Creation with 0 Photos ---');
    const listerToken = createToken(lister.id, 'LISTER');
    const res4 = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${listerToken}`
      },
      body: JSON.stringify({
        title: 'Zero Photo Dress',
        description: 'Should be rejected',
        category: 'Lehenga',
        size: 'L',
        rentalPrice: 7000,
        securityDeposit: 3000,
        baselineImages: [] // ZERO PHOTOS
      })
    });

    const data4 = await res4.json();
    console.log(`HTTP Status: ${res4.status}`);
    console.log(`Response:`, data4);

    if (res4.status === 400 && data4.success === false && data4.error.includes('At least one garment photo is required')) {
      console.log('✅ PASS: Listing creation with 0 photos was strictly REJECTED by the server!');
    } else {
      throw new Error(`TEST 4 FAILED: Expected 400 rejection for 0 listing photos, got ${res4.status}`);
    }

    // TEST 5: Legitimate Intake with Valid Photo -> MUST SUCCEED (200) & Allocate Barcode SKU
    console.log('\n--- TEST 5: Legitimate Intake with Valid Photo ---');
    const res5 = await fetch(`${BASE_URL}/api/hub/inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hubToken}`
      },
      body: JSON.stringify({
        bookingId: booking.id,
        inspectionType: 'LISTER_TO_HUB_INTAKE',
        evidencePhotos: ['https://images.unsplash.com/verified-intake-garment-tag.jpg']
      })
    });

    const data5 = await res5.json();
    console.log(`HTTP Status: ${res5.status}`);
    console.log(`Response:`, data5);

    if (res5.status === 200 && data5.success === true && data5.sku) {
      console.log(`✅ PASS: Legitimate intake succeeded with generated barcode SKU: ${data5.sku}`);
    } else {
      throw new Error(`TEST 5 FAILED: Expected 200 success with SKU, got ${res5.status}`);
    }

    console.log('\n============================================================');
    console.log('🏆 ALL 5 MANDATORY PHOTO ENFORCEMENT TESTS PASSED!');
    console.log('============================================================\n');

  } catch (error) {
    console.error('\n❌ MANDATORY PHOTO VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMandatoryPhotos();
