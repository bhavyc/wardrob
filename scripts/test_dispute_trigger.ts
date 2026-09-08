import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

async function runTest() {
  console.log('--- STARTING DISPUTE TRIGGER TEST ---');

  // 1. Find or create an admin/hub user
  let hubUser = await prisma.user.findFirst({
    where: { role: 'HUB_PARTNER' }
  });

  if (!hubUser) {
    hubUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
  }

  if (!hubUser) {
    throw new Error('No HUB_PARTNER or ADMIN user found in DB');
  }

  const session = await prisma.session.create({
    data: {
      userId: hubUser.id,
      token: 'test-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 3600 * 1000)
    }
  });

  const token = jwt.sign(
    { userId: hubUser.id, role: hubUser.role, sessionId: session.id },
    process.env.JWT_SECRET || 'fallback_secret',
    { algorithm: 'HS256' }
  );

  // 2. Find a lister and renter
  const listerProfile = await prisma.listerProfile.findFirst({
    include: { user: true }
  });
  const renter = await prisma.user.findFirst({
    where: { role: 'RENTER' }
  });

  if (!listerProfile || !renter) {
    throw new Error('Missing lister profile or renter in DB');
  }

  // Create a test listing with 4000 security deposit
  const listing = await prisma.listing.create({
    data: {
      listerProfileId: listerProfile.id,
      title: 'Dispute Trigger Test Sherwani',
      description: 'Test garment for dispute trigger',
      category: 'Sherwani',
      size: 'L',
      condition: 'EXCELLENT',
      rentalPrice: 5000,
      securityDeposit: 4000,
      baselineImages: ['https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg'],
      status: 'AVAILABLE'
    }
  });

  console.log(`Created test listing ${listing.id} with ₹4,000 security deposit.`);

  // Test Case 1: ₹3,500 deduction on ₹4,000 deposit (87.5% >= 50%, no shortfall)
  // Should AUTO-CREATE DISPUTE and LOCK PAYOUT
  console.log('\n--- TEST CASE 1: ₹3,500 deduction on ₹4,000 deposit (>= 50%) ---');
  const booking1 = await prisma.booking.create({
    data: {
      renterId: renter.id,
      listingId: listing.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400 * 1000 * 3), // not late
      rentAmount: 5000,
      securityDeposit: 4000,
      totalAmount: 9000,
      status: 'RETURNED_TO_HUB'
    }
  });

  // Call /api/hub/inspection
  const res1 = await fetch('http://localhost:3000/api/hub/inspection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      bookingId: booking1.id,
      inspectionType: 'POST_RETURN',
      grade: 'B_MINOR',
      deductionAmount: 3500,
      isItemComplete: true,
      missingPartsDescription: '',
      evidencePhotos: ['https://example.com/damage1.jpg']
    })
  });

  const json1 = await res1.json();
  console.log('Inspection 1 API response:', json1);

  // Verify DB state for booking 1
  const report1 = await prisma.damageReport.findFirst({
    where: { bookingId: booking1.id },
    include: { dispute: true }
  });
  const payout1 = await prisma.payout.findUnique({
    where: { bookingId: booking1.id }
  });

  console.log(`Damage Report 1: isDisputed = ${report1?.isDisputed}`);
  console.log(`Dispute 1:`, report1?.dispute ? {
    status: report1.dispute.status,
    adminNotes: report1.dispute.adminNotes
  } : 'NONE');
  console.log(`Payout 1: status = ${payout1?.status}, amount = ₹${payout1?.amount}`);

  if (!report1?.dispute || report1.dispute.status !== 'OPEN') {
    throw new Error('FAILED: Test Case 1 did NOT create an OPEN dispute!');
  }
  if (!report1.isDisputed) {
    throw new Error('FAILED: Test Case 1 did NOT mark report as isDisputed!');
  }

  // Verify that Payout 1 cannot be marked COMPLETED while dispute is OPEN
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  let adminToken = token;
  let adminSession: any = null;
  if (adminUser) {
    adminSession = await prisma.session.create({
      data: {
        userId: adminUser.id,
        token: 'admin-test-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 3600 * 1000)
      }
    });
    adminToken = jwt.sign(
      { userId: adminUser.id, role: 'ADMIN', sessionId: adminSession.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { algorithm: 'HS256' }
    );
  }

  const patchRes = await fetch('http://localhost:3000/api/admin/payouts', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      payoutId: payout1?.id,
      status: 'COMPLETED'
    })
  });
  const patchData = await patchRes.json();
  console.log('Admin attempting to complete locked Payout 1:', patchData);
  if (adminSession) {
    await prisma.session.delete({ where: { id: adminSession.id } });
  }

  if (patchRes.ok && patchData.success) {
    throw new Error('FAILED: Payout 1 was marked COMPLETED despite active dispute!');
  }
  console.log('🔒 Payout 1 is strictly LOCKED against completion as expected:', patchData.error);
  console.log('✅ TEST CASE 1 PASSED: Dispute auto-created with status OPEN, locking the payout!');


  // Test Case 2: ₹1,000 deduction on ₹4,000 deposit (25% < 50%, no shortfall)
  // Should NOT create dispute, should auto-process without dispute
  console.log('\n--- TEST CASE 2: ₹1,000 deduction on ₹4,000 deposit (< 50%) ---');
  const booking2 = await prisma.booking.create({
    data: {
      renterId: renter.id,
      listingId: listing.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400 * 1000 * 3), // not late
      rentAmount: 5000,
      securityDeposit: 4000,
      totalAmount: 9000,
      status: 'RETURNED_TO_HUB'
    }
  });

  const res2 = await fetch('http://localhost:3000/api/hub/inspection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      bookingId: booking2.id,
      inspectionType: 'POST_RETURN',
      grade: 'B_MINOR',
      deductionAmount: 1000,
      isItemComplete: true,
      missingPartsDescription: '',
      evidencePhotos: ['https://example.com/damage2.jpg']
    })
  });

  const json2 = await res2.json();
  console.log('Inspection 2 API response:', json2);

  // Verify DB state for booking 2
  const report2 = await prisma.damageReport.findFirst({
    where: { bookingId: booking2.id },
    include: { dispute: true }
  });
  const payout2 = await prisma.payout.findUnique({
    where: { bookingId: booking2.id }
  });

  console.log(`Damage Report 2: isDisputed = ${report2?.isDisputed}`);
  console.log(`Dispute 2:`, report2?.dispute ? report2.dispute : 'NONE');
  console.log(`Payout 2: status = ${payout2?.status}, amount = ₹${payout2?.amount}`);

  if (report2?.dispute) {
    throw new Error('FAILED: Test Case 2 created a dispute when it should NOT have!');
  }
  if (report2?.isDisputed) {
    throw new Error('FAILED: Test Case 2 marked report as disputed!');
  }
  console.log('✅ TEST CASE 2 PASSED: Processed automatically with NO dispute!');

  // Cleanup test session
  await prisma.session.delete({ where: { id: session.id } });
  console.log('\n--- ALL REAL TESTS COMPLETED SUCCESSFULLY ---');
}

runTest()
  .catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
