const { PrismaClient } = require('./src/generated/prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting ID Verification & Rating Simulation ---');

  // 1. Find a Renter who has NOT submitted ID
  let renterUser = await prisma.user.findFirst({
    where: { role: 'RENTER', idVerificationStatus: 'NOT_SUBMITTED' }
  });

  if (!renterUser) {
    console.log('No eligible Renter found, creating a new test renter...');
    renterUser = await prisma.user.create({
      data: {
        name: 'Test Renter IDFlow',
        email: 'testrenter_idflow@wardrob.com',
        role: 'RENTER',
        idVerificationStatus: 'NOT_SUBMITTED'
      }
    });
  }
  
  console.log(`[Renter] Selected Renter: ${renterUser.email} (ID: ${renterUser.id})`);
  console.log(`[Renter] Current ID Status: ${renterUser.idVerificationStatus}`);

  // 2. Renter Submits ID
  console.log('\n--- Renter submitting ID Verification ---');
  await prisma.user.update({
    where: { id: renterUser.id },
    data: {
      idVerificationStatus: 'PENDING',
      idType: 'Aadhaar',
      idNumber: '9999 8888 7777',
      idPhotoUrl: 'https://example.com/fake-aadhaar.jpg'
    }
  });
  console.log(`[Backend] Renter status updated to PENDING with mock data.`);

  // 3. Admin Reviews ID
  console.log('\n--- Admin Reviewing ID ---');
  const pendingUser = await prisma.user.findUnique({ where: { id: renterUser.id } });
  console.log(`[Admin] Reviewing ID for: ${pendingUser?.email}. Type: ${pendingUser?.idType}, Number: ${pendingUser?.idNumber}`);
  
  // Admin Approves
  await prisma.user.update({
    where: { id: pendingUser.id },
    data: {
      idVerificationStatus: 'APPROVED',
      idVerified: true
    }
  });
  console.log(`[Admin] ID Approved. Renter idVerified is now true.`);

  // 4. Rating System Test
  console.log('\n--- Testing Rating System ---');
  // Find a COMPLETED booking
  let booking = await prisma.booking.findFirst({
    where: { status: 'COMPLETED' },
    include: { listing: { include: { lister: true } } }
  });

  if (!booking) {
    console.log('No COMPLETED bookings found. Cannot simulate rating. Please run e2e-simulation first to complete a booking.');
    return;
  }

  console.log(`Found COMPLETED booking: ${booking.id}`);
  const renterId = booking.renterId;
  const listerUserId = booking.listing.lister.userId;

  // Clear existing reviews for this booking if any
  await prisma.review.deleteMany({
    where: { bookingId: booking.id }
  });

  console.log(`[Renter] Submitting Rating for Lister...`);
  await prisma.review.create({
    data: {
      bookingId: booking.id,
      reviewerId: renterId,
      revieweeId: listerUserId,
      rating: 5,
      comment: 'Excellent condition and fast shipping!',
      listingId: booking.listingId
    }
  });

  // Calculate avg rating
  const listerReviews = await prisma.review.findMany({ where: { revieweeId: listerUserId } });
  const avg = listerReviews.reduce((sum, r) => sum + Number(r.rating), 0) / listerReviews.length;
  await prisma.user.update({
    where: { id: listerUserId },
    data: { rating: avg }
  });
  console.log(`[Backend] Lister average rating updated to: ${avg}`);

  console.log(`\n[Lister] Submitting Rating for Renter...`);
  await prisma.review.create({
    data: {
      bookingId: booking.id,
      reviewerId: listerUserId,
      revieweeId: renterId,
      rating: 4,
      comment: 'Good communication, returned slightly late but okay.'
    }
  });

  const renterReviews = await prisma.review.findMany({ where: { revieweeId: renterId } });
  const rAvg = renterReviews.reduce((sum, r) => sum + Number(r.rating), 0) / renterReviews.length;
  await prisma.user.update({
    where: { id: renterId },
    data: { rating: rAvg }
  });
  console.log(`[Backend] Renter average rating updated to: ${rAvg}`);
  
  console.log('\n--- Simulation Complete ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
