import 'dotenv/config';
import { prisma } from '../src/lib/db';
import jwt from 'jsonwebtoken';
import { POST as postHubInspection } from '../src/app/api/hub/inspection/route';

async function runTest() {
  console.log('================================================================');
  console.log('   MANUAL ADMIN REFUND APPROVAL & IDEMPOTENCY VERIFICATION      ');
  console.log('================================================================\n');

  // 1. Fetch Admin and Hub Partner users
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });
  if (!adminUser) throw new Error('No ADMIN user found in DB');

  let hubUser = await prisma.user.findFirst({
    where: { role: 'HUB_PARTNER' },
  });
  if (!hubUser) hubUser = adminUser;

  // Create auth session/tokens
  const adminSession = await prisma.session.create({
    data: {
      userId: adminUser.id,
      token: 'test-admin-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
  });
  const adminToken = jwt.sign(
    { userId: adminUser.id, role: 'ADMIN', sessionId: adminSession.id },
    process.env.JWT_SECRET || 'fallback_secret',
    { algorithm: 'HS256' }
  );

  const hubSession = await prisma.session.create({
    data: {
      userId: hubUser.id,
      token: 'test-hub-token-' + Date.now(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
  });
  const hubToken = jwt.sign(
    { userId: hubUser.id, role: hubUser.role, sessionId: hubSession.id },
    process.env.JWT_SECRET || 'fallback_secret',
    { algorithm: 'HS256' }
  );

  // 2. Fetch Lister & Renter
  const listerProfile = await prisma.listerProfile.findFirst({
    include: { user: true },
  });
  const renter = await prisma.user.findFirst({
    where: { role: 'RENTER' },
  });
  if (!listerProfile || !renter) {
    throw new Error('Missing lister profile or renter in DB');
  }

  // Create test listing
  const listing = await prisma.listing.create({
    data: {
      listerProfileId: listerProfile.id,
      title: 'Manual Refund Test Sherwani',
      description: 'Test garment for refund approval flow',
      category: 'Sherwani',
      size: 'XL',
      condition: 'EXCELLENT',
      rentalPrice: 6000,
      securityDeposit: 5000,
      baselineImages: ['https://example.com/test.jpg'],
      status: 'AVAILABLE',
    },
  });

  console.log(`[Setup] Created test listing ${listing.id} (Security Deposit: ₹5,000)`);

  // =========================================================================
  // TEST CASE 1: REQUIRE_MANUAL_REFUND_APPROVAL=true
  // Hub inspection should create a PENDING refund and NOT initiate Razorpay
  // =========================================================================
  console.log('\n--- TEST CASE 1: Post-Return with REQUIRE_MANUAL_REFUND_APPROVAL=true ---');
  process.env.REQUIRE_MANUAL_REFUND_APPROVAL = 'true';

  const booking1 = await prisma.booking.create({
    data: {
      renterId: renter.id,
      listingId: listing.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400 * 1000 * 3),
      rentAmount: 6000,
      securityDeposit: 5000,
      totalAmount: 11000,
      status: 'RETURNED_TO_HUB',
      razorpayPaymentId: 'pay_mock_test_12345',
    },
  });

  // Call /api/hub/inspection
  const inspRes1 = await fetch('http://localhost:3000/api/hub/inspection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hubToken}`,
    },
    body: JSON.stringify({
      bookingId: booking1.id,
      inspectionType: 'POST_RETURN',
      grade: 'A_NO_ISSUE',
      deductionAmount: 0,
      isItemComplete: true,
      missingPartsDescription: '',
      evidencePhotos: [
        'https://example.com/front.jpg',
        'https://example.com/back.jpg',
        'https://example.com/detail.jpg',
      ],
    }),
  });

  const inspJson1 = await inspRes1.json();
  console.log('[Test 1] Hub inspection response:', inspJson1.success ? 'SUCCESS' : inspJson1.error);

  // Verify Booking & Refund in DB
  const verifiedBooking1 = await prisma.booking.findUnique({
    where: { id: booking1.id },
  });
  const pendingRefund = await prisma.refund.findFirst({
    where: { bookingId: booking1.id },
  });

  console.log(`[Test 1] Booking status: ${verifiedBooking1?.status}`);
  console.log(`[Test 1] Booking refundInitiatedAt: ${verifiedBooking1?.refundInitiatedAt} (Expected: null)`);
  console.log(`[Test 1] Refund record status: ${pendingRefund?.status} (Expected: PENDING)`);
  console.log(`[Test 1] Refund amount: ₹${pendingRefund?.amount} (Expected: ₹5000)`);

  if (verifiedBooking1?.refundInitiatedAt !== null) {
    throw new Error('TEST 1 FAILED: refundInitiatedAt should be NULL when manual approval is required!');
  }
  if (!pendingRefund || pendingRefund.status !== 'PENDING') {
    throw new Error('TEST 1 FAILED: Refund record status should be PENDING!');
  }
  console.log('✅ TEST 1 PASSED: Refund held in PENDING state awaiting Admin approval.\n');

  // =========================================================================
  // TEST CASE 2: Admin approves refund via /api/admin/refunds/[id]/approve
  // Pre-flight flag written, refund processed, status marked COMPLETED
  // =========================================================================
  console.log('--- TEST CASE 2: Admin Approves Refund via API ---');
  const approveRes = await fetch(`http://localhost:3000/api/admin/refunds/${pendingRefund.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  });

  const approveJson = await approveRes.json();
  console.log('[Test 2] Admin Approve response status:', approveRes.status);
  console.log('[Test 2] Message:', approveJson.message);

  const approvedBooking = await prisma.booking.findUnique({
    where: { id: booking1.id },
  });
  const approvedRefund = await prisma.refund.findUnique({
    where: { id: pendingRefund.id },
  });

  console.log(`[Test 2] Booking refundInitiatedAt: ${approvedBooking?.refundInitiatedAt} (Expected: valid Timestamp)`);
  console.log(`[Test 2] Refund record status: ${approvedRefund?.status} (Expected: COMPLETED)`);

  if (!approvedBooking?.refundInitiatedAt) {
    throw new Error('TEST 2 FAILED: refundInitiatedAt was NOT written during approval!');
  }
  if (approvedRefund?.status !== 'COMPLETED') {
    throw new Error('TEST 2 FAILED: Refund status was NOT updated to COMPLETED!');
  }
  console.log('✅ TEST 2 PASSED: Pre-flight flag written & refund marked COMPLETED.\n');

  // =========================================================================
  // TEST CASE 3: Idempotency protection check
  // Second approval call on same refund MUST be rejected
  // =========================================================================
  console.log('--- TEST CASE 3: Idempotency Protection (Double-Approval Prevention) ---');
  const retryRes = await fetch(`http://localhost:3000/api/admin/refunds/${pendingRefund.id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
  });

  const retryJson = await retryRes.json();
  console.log('[Test 3] Retry response status:', retryRes.status, '(Expected: 400)');
  console.log('[Test 3] Retry error message:', retryJson.error);

  if (retryRes.status !== 400) {
    throw new Error('TEST 3 FAILED: Second approval call was NOT rejected with 400!');
  }
  console.log('✅ TEST 3 PASSED: Idempotency check successfully blocked duplicate refund.\n');

  // =========================================================================
  // TEST CASE 4: Toggle off (REQUIRE_MANUAL_REFUND_APPROVAL=false)
  // Reverts to fully automated refund flow
  // =========================================================================
  console.log('--- TEST CASE 4: Fully Automated Flow when Toggle is FALSE ---');
  process.env.REQUIRE_MANUAL_REFUND_APPROVAL = 'false';

  const booking2 = await prisma.booking.create({
    data: {
      renterId: renter.id,
      listingId: listing.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400 * 1000 * 3),
      rentAmount: 6000,
      securityDeposit: 5000,
      totalAmount: 11000,
      status: 'RETURNED_TO_HUB',
      // No razorpayPaymentId -> will automatically credit wallet
    },
  });

  const inspReq2 = new Request('http://localhost:3000/api/hub/inspection', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hubToken}`,
    },
    body: JSON.stringify({
      bookingId: booking2.id,
      inspectionType: 'POST_RETURN',
      grade: 'A_NO_ISSUE',
      deductionAmount: 0,
      isItemComplete: true,
      missingPartsDescription: '',
      evidencePhotos: [
        'https://example.com/front2.jpg',
        'https://example.com/back2.jpg',
        'https://example.com/detail2.jpg',
      ],
    }),
  });

  const inspRes2 = await postHubInspection(inspReq2);
  const inspJson2 = await inspRes2.json();
  console.log('[Test 4] Hub inspection response:', inspJson2.success ? 'SUCCESS' : inspJson2.error);

  const verifiedBooking2 = await prisma.booking.findUnique({
    where: { id: booking2.id },
  });
  const autoRefund = await prisma.refund.findFirst({
    where: { bookingId: booking2.id },
  });

  console.log(`[Test 4] Booking status: ${verifiedBooking2?.status}`);
  console.log(`[Test 4] Refund record status: ${autoRefund?.status} (Expected: COMPLETED automatically)`);

  if (!autoRefund || autoRefund.status !== 'COMPLETED') {
    throw new Error('TEST 4 FAILED: When toggle is false, refund should be COMPLETED automatically!');
  }
  console.log('✅ TEST 4 PASSED: System seamlessly falls back to 100% automatic refunds when toggle is disabled.\n');

  // Reset env var back to true
  process.env.REQUIRE_MANUAL_REFUND_APPROVAL = 'true';

  console.log('================================================================');
  console.log('🎉 ALL 4 TESTS PASSED! MANUAL REFUND APPROVAL SYSTEM CERTIFIED.');
  console.log('================================================================');
}

runTest()
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
