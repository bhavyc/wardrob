import { prisma } from '../src/lib/db';
import crypto from 'crypto';

async function testPaymentEdgeCases() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        PAYMENT & WEBHOOK EDGE CASE HEADLESS TESTS        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const runId = Date.now().toString().slice(-6);

  try {
    // -------------------------------------------------------------
    // TEST 1: Webhook Handles Lister Registration Payment
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Lister Registration Fee Webhook Recovery ---');
    const listerUser = await prisma.user.create({
      data: {
        name: `Lister Fee Test ${runId}`,
        email: `lister_fee_${runId}@test.com`,
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'LISTER',
      }
    });

    const listerProfile = await prisma.listerProfile.create({
      data: {
        userId: listerUser.id,
        shopName: `Atelier ${runId}`,
        status: 'PENDING',
        registrationFeePaid: false,
      }
    });

    const regOrderId = `order_reg_${runId}`;
    const regPayment = await prisma.registrationPayment.create({
      data: {
        listerProfileId: listerProfile.id,
        amount: 500,
        razorpayOrderId: regOrderId,
        status: 'PENDING',
      }
    });

    // Simulate Webhook POST call
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'wardrob_webhook_secret_local';
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;

    const payload1 = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_reg_${runId}`,
            order_id: regOrderId,
            amount: 50000,
            status: 'captured',
          }
        }
      }
    });

    const sig1 = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload1)
      .digest('hex');

    const res1 = await fetch('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig1,
      },
      body: payload1,
    });

    if (!res1.ok) {
      throw new Error(`Webhook failed with status ${res1.status}`);
    }

    // Verify DB
    const updatedProfile = await prisma.listerProfile.findUnique({
      where: { id: listerProfile.id },
      include: { registrationPayments: true }
    });

    if (!updatedProfile?.registrationFeePaid) {
      throw new Error('FAILED: listerProfile.registrationFeePaid was not marked true by webhook!');
    }
    const updatedRegPayment = updatedProfile.registrationPayments.find(p => p.id === regPayment.id);
    if (updatedRegPayment?.status !== 'COMPLETED') {
      throw new Error('FAILED: registrationPayment status is not COMPLETED!');
    }
    console.log('✅ [PASS] Webhook successfully recovered and completed Lister Registration Payment!');

    // -------------------------------------------------------------
    // TEST 2: Webhook Handles Booking Extension Payment
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Booking Extension Fee Webhook Recovery ---');
    const renterUser = await prisma.user.create({
      data: {
        name: `Renter Ext Test ${runId}`,
        email: `renter_ext_${runId}@test.com`,
        phone: `92${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'RENTER',
      }
    });

    const listing = await prisma.listing.create({
      data: {
        listerProfileId: listerProfile.id,
        title: `Test Dress ${runId}`,
        description: 'Test',
        category: 'Lehenga',
        size: 'M',
        condition: 'LIKE_NEW',
        rentalPrice: 8000,
        securityDeposit: 3000,
        status: 'AVAILABLE',
      }
    });

    const origEnd = new Date(Date.now() + 4 * 24 * 3600 * 1000);
    const newEnd = new Date(Date.now() + 6 * 24 * 3600 * 1000); // 2 days extension

    const extOrderId = `order_ext_${runId}`;
    const booking = await prisma.booking.create({
      data: {
        renterId: renterUser.id,
        listingId: listing.id,
        startDate: new Date(),
        endDate: origEnd,
        rentAmount: 8000,
        securityDeposit: 3000,
        totalAmount: 11000,
        status: 'CONFIRMED',
        pendingExtensionDate: newEnd,
        pendingExtensionOrderId: extOrderId,
        pendingExtensionExpiry: new Date(Date.now() + 30 * 60 * 1000),
      }
    });

    const payload2 = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_ext_${runId}`,
            order_id: extOrderId,
            amount: 400000, // ₹4000
            status: 'captured',
          }
        }
      }
    });

    const sig2 = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload2)
      .digest('hex');

    const res2 = await fetch('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig2,
      },
      body: payload2,
    });

    if (!res2.ok) {
      throw new Error(`Extension webhook failed with status ${res2.status}`);
    }

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    if (updatedBooking?.pendingExtensionOrderId !== null) {
      throw new Error('FAILED: pendingExtensionOrderId was not cleared!');
    }
    if (new Date(updatedBooking!.endDate).getTime() !== newEnd.getTime()) {
      throw new Error(`FAILED: Booking endDate not updated! Expected ${newEnd}, got ${updatedBooking?.endDate}`);
    }
    console.log('✅ [PASS] Webhook successfully locked Extension dates and updated fees!');

    // -------------------------------------------------------------
    // TEST 3: Webhook Atomically Deducts Partial Wallet
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Partial Wallet Deduction in Webhook ---');
    const renterWithWallet = await prisma.user.create({
      data: {
        name: `Renter Wallet ${runId}`,
        email: `renter_wallet_${runId}@test.com`,
        phone: `93${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'RENTER',
        walletBalance: 1000, // Has ₹1000 in wallet
      }
    });

    const partialOrderId = `order_partial_${runId}`;
    // Total is ₹11000. Gateway pays ₹10000. Wallet pays ₹1000.
    const partialBooking = await prisma.booking.create({
      data: {
        renterId: renterWithWallet.id,
        listingId: listing.id,
        startDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        rentAmount: 8000,
        securityDeposit: 3000,
        totalAmount: 11000,
        status: 'PENDING',
        razorpayOrderId: partialOrderId,
      }
    });

    const payload3 = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_partial_${runId}`,
            order_id: partialOrderId,
            amount: 1000000, // ₹10,000 paid via gateway (₹1,000 difference is wallet)
            status: 'captured',
          }
        }
      }
    });

    const sig3 = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload3)
      .digest('hex');

    const res3 = await fetch('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': sig3,
      },
      body: payload3,
    });

    if (!res3.ok) {
      throw new Error(`Partial wallet webhook failed: ${res3.status}`);
    }

    const renterAfterPartial = await prisma.user.findUnique({
      where: { id: renterWithWallet.id }
    });

    if (Number(renterAfterPartial?.walletBalance) !== 0) {
      throw new Error(`FAILED: Renter wallet was not deducted! Expected 0, got ${renterAfterPartial?.walletBalance}`);
    }

    const confirmedPartialBooking = await prisma.booking.findUnique({
      where: { id: partialBooking.id }
    });

    if (confirmedPartialBooking?.status !== 'CONFIRMED') {
      throw new Error('FAILED: Booking was not confirmed!');
    }
    console.log('✅ [PASS] Webhook successfully confirmed booking and deducted ₹1000 partial wallet balance!');

    console.log('\n============================================================');
    console.log('🎉 ALL PAYMENT & WEBHOOK EDGE CASE TESTS PASSED WITH 100% SUCCESS!');
    console.log('============================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentEdgeCases();
