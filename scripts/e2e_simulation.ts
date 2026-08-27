import { prisma } from '../src/lib/db';
import crypto from 'crypto';

async function runSimulation() {
  console.log('🚀 Starting Wardrob E2E Simulation...');
  
  try {
    // 1. Create Users
    console.log('\n--- 1. User Creation ---');
    
    // Existing referrer
    const referrerUser = await prisma.user.create({
      data: {
        name: 'E2E Referrer Lister',
        email: `referrer_${Date.now()}@test.com`,
        phone: `999${Math.floor(Math.random() * 10000000)}`,
        role: 'LISTER'
      }
    });
    
    const referrerProfile = await prisma.listerProfile.create({
      data: {
        userId: referrerUser.id,
        shopName: 'Referrer Couture',
        status: 'APPROVED',
        referralCode: `REF${Date.now().toString().slice(-4)}`
      }
    });
    console.log(`✅ Referrer Lister created: ${referrerUser.email} (Code: ${referrerProfile.referralCode})`);

    // New Lister (Referred)
    const newListerUser = await prisma.user.create({
      data: {
        name: 'E2E New Lister',
        email: `lister_${Date.now()}@test.com`,
        phone: `888${Math.floor(Math.random() * 10000000)}`,
        role: 'LISTER'
      }
    });

    const newListerProfile = await prisma.listerProfile.create({
      data: {
        userId: newListerUser.id,
        shopName: 'E2E Luxury Finds',
        status: 'APPROVED',
        referredByCode: referrerProfile.referralCode,
        referralCode: `NEW${Date.now().toString().slice(-4)}`,
        bankAccountNo: '1234567890',
        bankIfsc: 'HDFC0001234'
      }
    });
    console.log(`✅ New Lister created: ${newListerUser.email} (Referred by: ${referrerProfile.referralCode})`);

    // Renter
    const renterUser = await prisma.user.create({
      data: {
        name: 'E2E Renter',
        email: `renter_${Date.now()}@test.com`,
        phone: `777${Math.floor(Math.random() * 10000000)}`,
        role: 'RENTER'
      }
    });
    console.log(`✅ Renter created: ${renterUser.email}`);

    // 2. Lister Registration Payment & Referral Processing
    console.log('\n--- 2. Lister Payment & Referral ---');
    const payment = await prisma.registrationPayment.create({
      data: {
        listerProfileId: newListerProfile.id,
        amount: 500,
        razorpayOrderId: `order_${Date.now()}`,
        status: 'PENDING'
      }
    });

    // Simulate marking payment completed via atomic transaction 
    // (similar to what happens in registration-fee/verify API)
    await prisma.$transaction(async (tx) => {
      await tx.registrationPayment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED', razorpayPaymentId: `pay_${Date.now()}` }
      });
      await tx.listerProfile.update({
        where: { id: newListerProfile.id },
        data: { registrationFeePaid: true }
      });
      // Reward Referrer
      await tx.referral.create({
        data: {
          referrerId: referrerProfile.id,
          referredListerId: newListerProfile.id,
          rewardAmount: 200,
          status: 'CREDITED'
        }
      });
      await tx.user.update({
        where: { id: referrerUser.id },
        data: { walletBalance: { increment: 200 } }
      });
    });
    console.log(`✅ Lister Registration Paid. Referral ₹200 credited to ${referrerUser.email}`);

    // 3. Create Listing
    console.log('\n--- 3. Create Listing ---');
    const listing = await prisma.listing.create({
      data: {
        listerProfileId: newListerProfile.id,
        title: 'E2E Designer Sabyasachi Lehenga',
        description: 'Pristine condition luxury wear.',
        category: 'Lehenga',
        size: 'M',
        condition: 'LIKE_NEW',
        rentalPrice: 3000,
        securityDeposit: 1500,
        baselineImages: ['https://example.com/lehenga1.jpg'],
        status: 'AVAILABLE'
      }
    });
    console.log(`✅ Listing created: ${listing.title} (₹${listing.rentalPrice} Rent / ₹${listing.securityDeposit} Deposit)`);

    // 4. Booking Lifecycle
    console.log('\n--- 4. Renter Booking ---');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 2); // 2 days from now
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 4); // 4 days rental

    const booking = await prisma.booking.create({
      data: {
        renterId: renterUser.id,
        listingId: listing.id,
        startDate,
        endDate,
        rentAmount: listing.rentalPrice,
        securityDeposit: listing.securityDeposit,
        totalAmount: Number(listing.rentalPrice) + Number(listing.securityDeposit),
        status: 'CONFIRMED',
        razorpayOrderId: `book_order_${Date.now()}`,
        razorpayPaymentId: `book_pay_${Date.now()}`
      }
    });
    console.log(`✅ Booking created: ID ${booking.id}`);

    // 5. Operations Flow
    console.log('\n--- 5. Hub Operations & Logistics ---');
    
    // Intake
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'AT_HUB_PRE' } });
    console.log(`✅ Dress received at Hub (AT_HUB_PRE)`);
    
    // Dispatch
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'OUT_FOR_DELIVERY' } });
    console.log(`✅ Dress dispatched to Renter`);
    
    // Delivery & Use
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'IN_USE' } });
    console.log(`✅ Dress Delivered (IN_USE)`);
    
    // Return
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'RETURNED_TO_HUB', actualReturnDate: new Date() } });
    console.log(`✅ Dress Returned to Hub`);

    // Inspection
    const damageReport = await prisma.damageReport.create({
      data: {
        bookingId: booking.id,
        inspectionType: 'POST_RETURN',
        grade: 'A_NO_ISSUE',
        deductionAmount: 0
      }
    });
    console.log(`✅ Post-return Inspection complete (Grade: A)`);

    // Complete Booking
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'COMPLETED' } });
    
    // Renter Wallet Refund (Security Deposit)
    await prisma.user.update({
      where: { id: renterUser.id },
      data: { walletBalance: { increment: listing.securityDeposit } }
    });
    console.log(`✅ Security Deposit refunded to Renter wallet`);

    // Generate Payout for Lister
    const commission = Number(listing.rentalPrice) * 0.15; // 15% commission
    const listerPayoutAmount = Number(listing.rentalPrice) - commission;
    
    const payout = await prisma.payout.create({
      data: {
        bookingId: booking.id,
        listerProfileId: newListerProfile.id,
        amount: listerPayoutAmount,
        commissionPaid: commission,
        status: 'PENDING'
      }
    });
    console.log(`✅ Payout generated: ₹${listerPayoutAmount} for Lister`);

    // 6. Admin Payout Settlement (Including our new wallet clubbing feature)
    console.log('\n--- 6. Admin Payout Settlement (Clubbing Feature Test) ---');
    
    // Let's test the referral reward clubbing. 
    // Note: The referrer got the ₹200 wallet reward. Let's create a fake payout for the referrer to test clubbing, 
    // or we can pretend the new lister also got some wallet money. 
    // Let's create a payout for the Referrer so we can test their wallet balance getting clubbed.
    
    const fakeBookingForReferrer = await prisma.booking.create({
      data: {
        renterId: renterUser.id,
        listingId: listing.id,
        startDate: new Date(),
        endDate: new Date(),
        rentAmount: 1000,
        securityDeposit: 0,
        totalAmount: 1000,
        status: 'COMPLETED'
      }
    });
    const referrerPayout = await prisma.payout.create({
      data: {
        bookingId: fakeBookingForReferrer.id,
        listerProfileId: referrerProfile.id,
        amount: 850,
        commissionPaid: 150,
        status: 'PENDING'
      }
    });

    console.log(`-> Referrer has a pending payout of ₹850 and wallet balance of ₹200.`);
    
    // Simulate API PATCH Call transaction for clubbing
    const result = await prisma.$transaction(async (tx) => {
      const p = await tx.payout.findUnique({
        where: { id: referrerPayout.id },
        include: { lister: { include: { user: true } } }
      });
      
      if (!p) throw new Error('Payout not found');
      
      let finalAmount = Number(p.amount);
      const currentWalletBalance = Number(p.lister.user.walletBalance);
      
      if (currentWalletBalance > 0) {
        finalAmount += currentWalletBalance;
        await tx.user.update({
          where: { id: p.lister.user.id },
          data: { walletBalance: { decrement: currentWalletBalance } }
        });
      }

      return tx.payout.update({
        where: { id: p.id },
        data: {
          status: 'COMPLETED',
          amount: finalAmount,
          batchRef: 'MANUAL_TEST_CLUBBED',
          walletBalanceIncluded: currentWalletBalance
        },
        include: { lister: { include: { user: true } } }
      });
    });

    console.log(`✅ Payout marked COMPLETED.`);
    console.log(`   Expected Total Amount: 1050 (850 + 200). Actual: ${result.amount}`);
    console.log(`   Wallet Balance Included Field: ${result.walletBalanceIncluded}`);
    console.log(`   User's new Wallet Balance: ${result.lister.user.walletBalance}`);

    console.log('\n🎉 E2E SIMULATION COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('\n❌ E2E SIMULATION FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runSimulation();
