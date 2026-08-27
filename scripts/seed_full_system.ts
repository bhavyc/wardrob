import { prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function cleanDatabase() {
  console.log('🧹 Wiping old database records...');
  // Delete in reverse order of dependencies
  await prisma.refund.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.damageReport.deleteMany();
  await prisma.cleaningLog.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.registrationPayment.deleteMany();
  await prisma.listerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database wiped clean.');
}

async function seedFullSystem() {
  console.log('🚀 Starting Full System Seed...');
  
  try {
    await cleanDatabase();

    const defaultPassword = await bcrypt.hash('admin123', 10);

    // 1. Create Users
    console.log('👤 Creating Users (Listers & Renters)...');
    
    // Admin
    await prisma.user.create({
      data: { name: 'Super Admin', email: 'admin@wardrob.in', phone: '0000000000', role: 'ADMIN', passwordHash: defaultPassword }
    });

    // Listers
    const listerUser1 = await prisma.user.create({
      data: { name: 'Anita Dongre', email: 'anita@lister.com', phone: '9999900001', role: 'LISTER', walletBalance: 200, passwordHash: defaultPassword }
    });
    const listerProfile1 = await prisma.listerProfile.create({
      data: { userId: listerUser1.id, shopName: 'Anita Exclusives', status: 'APPROVED', registrationFeePaid: true, referralCode: 'ANITA100', bankAccountNo: '111122223333', bankIfsc: 'HDFC0001' }
    });

    const listerUser2 = await prisma.user.create({
      data: { name: 'Rahul Mishra', email: 'rahul@lister.com', phone: '9999900002', role: 'LISTER', passwordHash: defaultPassword }
    });
    const listerProfile2 = await prisma.listerProfile.create({
      data: { userId: listerUser2.id, shopName: 'Rahul Couture', status: 'APPROVED', registrationFeePaid: true, referralCode: 'RAHUL200', referredByCode: 'ANITA100', bankAccountNo: '444455556666', bankIfsc: 'ICIC0002' }
    });

    // Renters
    const renterUser1 = await prisma.user.create({
      data: { name: 'Priya Sharma', email: 'priya@renter.com', phone: '8888800001', role: 'RENTER', walletBalance: 500 }
    });
    const renterUser2 = await prisma.user.create({
      data: { name: 'Sneha Patel', email: 'sneha@renter.com', phone: '8888800002', role: 'RENTER' }
    });
    const renterUser3 = await prisma.user.create({
      data: { name: 'Aditi Verma', email: 'aditi@renter.com', phone: '8888800003', role: 'RENTER' }
    });

    // 2. Create Listings (10 Luxury Products)
    console.log('👗 Creating 10 Luxury Listings...');
    const products = [
      { title: 'Sabyasachi Heritage Bridal Lehenga', category: 'Lehenga', rentalPrice: 8500, deposit: 3000, img: 'https://images.unsplash.com/photo-1583391733958-d259728fca8c?auto=format&fit=crop&q=80&w=800', sku: 'SAB-LEH-01' },
      { title: 'Manish Malhotra Sequin Saree', category: 'Saree', rentalPrice: 4200, deposit: 1500, img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', sku: 'MM-SAR-02' },
      { title: 'Tarun Tahiliani Ivory Gown', category: 'Gown', rentalPrice: 6500, deposit: 2500, img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800', sku: 'TT-GWN-03' },
      { title: 'Anita Dongre Gotapatti Anarkali', category: 'Anarkali', rentalPrice: 3500, deposit: 1200, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800', sku: 'AD-ANA-04' },
      { title: 'Rahul Mishra Hand-Embroidered Kurta Set', category: 'Kurta Set', rentalPrice: 2800, deposit: 1000, img: 'https://images.unsplash.com/photo-1592305553535-714ccbd8b15d?auto=format&fit=crop&q=80&w=800', sku: 'RM-KUR-05' },
      { title: 'Falguni Shane Peacock Feather Gown', category: 'Gown', rentalPrice: 7000, deposit: 2500, img: 'https://images.unsplash.com/photo-1566207455823-74cf8f20b411?auto=format&fit=crop&q=80&w=800', sku: 'FSP-GWN-06' },
      { title: 'Abu Jani Sandeep Khosla Chikankari Saree', category: 'Saree', rentalPrice: 4500, deposit: 1800, img: 'https://images.unsplash.com/photo-1614050868884-1d6ebfa77da1?auto=format&fit=crop&q=80&w=800', sku: 'AJSK-SAR-07' },
      { title: 'Raw Mango Silk Brocade Sharara', category: 'Sharara', rentalPrice: 3200, deposit: 1200, img: 'https://images.unsplash.com/photo-1610427845353-9fbd2f036577?auto=format&fit=crop&q=80&w=800', sku: 'RM-SHA-08' },
      { title: 'Ritu Kumar Velvet Lehenga', category: 'Lehenga', rentalPrice: 5500, deposit: 2000, img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800', sku: 'RK-LEH-09' },
      { title: 'Gaurav Gupta Sculpted Concept Saree', category: 'Saree', rentalPrice: 6000, deposit: 2200, img: 'https://images.unsplash.com/photo-1583391733958-d259728fca8c?auto=format&fit=crop&q=80&w=800', sku: 'GG-SAR-10' }
    ];

    const listings = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const listing = await prisma.listing.create({
        data: {
          listerProfileId: i % 2 === 0 ? listerProfile1.id : listerProfile2.id,
          title: p.title,
          description: 'A beautiful luxury piece perfect for any grand occasion.',
          category: p.category,
          size: 'M',
          condition: 'LIKE_NEW',
          rentalPrice: p.rentalPrice,
          securityDeposit: p.deposit,
          baselineImages: [p.img],
          status: 'AVAILABLE',
          sku: p.sku,
          isFeatured: i < 5
        }
      });
      listings.push(listing);
    }

    // 3. Create Bookings in various states
    console.log('📅 Creating Bookings (Various States)...');
    
    const today = new Date();
    
    // Booking 1: PENDING (Just booked)
    await prisma.booking.create({
      data: {
        renterId: renterUser1.id,
        listingId: listings[0].id,
        startDate: new Date(today.getTime() + 5 * 86400000),
        endDate: new Date(today.getTime() + 8 * 86400000),
        rentAmount: listings[0].rentalPrice,
        securityDeposit: listings[0].securityDeposit,
        totalAmount: Number(listings[0].rentalPrice) + Number(listings[0].securityDeposit),
        status: 'PENDING',
        razorpayOrderId: 'order_B1',
        razorpayPaymentId: 'pay_B1'
      }
    });

    // Booking 2: CONFIRMED (Awaiting Hub Intake)
    await prisma.booking.create({
      data: {
        renterId: renterUser2.id,
        listingId: listings[1].id,
        startDate: new Date(today.getTime() + 3 * 86400000),
        endDate: new Date(today.getTime() + 6 * 86400000),
        rentAmount: listings[1].rentalPrice,
        securityDeposit: listings[1].securityDeposit,
        totalAmount: Number(listings[1].rentalPrice) + Number(listings[1].securityDeposit),
        status: 'CONFIRMED',
        razorpayOrderId: 'order_B2',
        razorpayPaymentId: 'pay_B2'
      }
    });

    // Booking 3: IN_USE (Renter has it)
    await prisma.booking.create({
      data: {
        renterId: renterUser3.id,
        listingId: listings[2].id,
        startDate: new Date(today.getTime() - 2 * 86400000),
        endDate: new Date(today.getTime() + 1 * 86400000),
        rentAmount: listings[2].rentalPrice,
        securityDeposit: listings[2].securityDeposit,
        totalAmount: Number(listings[2].rentalPrice) + Number(listings[2].securityDeposit),
        status: 'IN_USE',
        razorpayOrderId: 'order_B3',
        razorpayPaymentId: 'pay_B3'
      }
    });

    // Booking 4: RETURNED_TO_HUB (Needs Post-Return Inspection)
    const b4 = await prisma.booking.create({
      data: {
        renterId: renterUser1.id,
        listingId: listings[3].id,
        startDate: new Date(today.getTime() - 7 * 86400000),
        endDate: new Date(today.getTime() - 4 * 86400000),
        actualReturnDate: new Date(today.getTime() - 3 * 86400000),
        rentAmount: listings[3].rentalPrice,
        securityDeposit: listings[3].securityDeposit,
        totalAmount: Number(listings[3].rentalPrice) + Number(listings[3].securityDeposit),
        status: 'RETURNED_TO_HUB',
        razorpayOrderId: 'order_B4',
        razorpayPaymentId: 'pay_B4'
      }
    });

    // Booking 5: COMPLETED (Everything done, payout pending)
    const b5 = await prisma.booking.create({
      data: {
        renterId: renterUser2.id,
        listingId: listings[4].id,
        startDate: new Date(today.getTime() - 10 * 86400000),
        endDate: new Date(today.getTime() - 7 * 86400000),
        actualReturnDate: new Date(today.getTime() - 6 * 86400000),
        rentAmount: listings[4].rentalPrice,
        securityDeposit: listings[4].securityDeposit,
        totalAmount: Number(listings[4].rentalPrice) + Number(listings[4].securityDeposit),
        status: 'COMPLETED',
        razorpayOrderId: 'order_B5',
        razorpayPaymentId: 'pay_B5'
      }
    });

    // Generate Damage Report & Payout for B5
    await prisma.damageReport.create({
      data: {
        bookingId: b5.id,
        inspectionType: 'POST_RETURN',
        grade: 'A_NO_ISSUE',
        deductionAmount: 0
      }
    });

    const comm5 = Number(listings[4].rentalPrice) * 0.35;
    await prisma.payout.create({
      data: {
        bookingId: b5.id,
        listerProfileId: listings[4].listerProfileId,
        amount: Number(listings[4].rentalPrice) - comm5,
        commissionPaid: comm5,
        status: 'PENDING'
      }
    });

    // Booking 6: COMPLETED with Dispute & Paid Payout
    const b6 = await prisma.booking.create({
      data: {
        renterId: renterUser3.id,
        listingId: listings[5].id,
        startDate: new Date(today.getTime() - 15 * 86400000),
        endDate: new Date(today.getTime() - 12 * 86400000),
        actualReturnDate: new Date(today.getTime() - 11 * 86400000),
        rentAmount: listings[5].rentalPrice,
        securityDeposit: listings[5].securityDeposit,
        totalAmount: Number(listings[5].rentalPrice) + Number(listings[5].securityDeposit),
        status: 'COMPLETED',
        razorpayOrderId: 'order_B6',
        razorpayPaymentId: 'pay_B6'
      }
    });

    const dr6 = await prisma.damageReport.create({
      data: {
        bookingId: b6.id,
        inspectionType: 'POST_RETURN',
        grade: 'B_MINOR',
        deductionAmount: 500,
        isDisputed: true
      }
    });

    await prisma.dispute.create({
      data: {
        damageReportId: dr6.id,
        status: 'OPEN',
        reason: 'Renter claims dress was already stained.',
        raisedBy: 'RENTER'
      }
    });

    const comm6 = Number(listings[5].rentalPrice) * 0.35;
    await prisma.payout.create({
      data: {
        bookingId: b6.id,
        listerProfileId: listings[5].listerProfileId,
        amount: Number(listings[5].rentalPrice) - comm6,
        commissionPaid: comm6,
        status: 'COMPLETED',
        batchRef: 'UPI_MANUAL_10928'
      }
    });

    console.log('✅ Full System Seed Completed Successfully!');
    console.log('You can now log into Admin, Lister, and Renter dashboards to see comprehensive data in all states.');
    
  } catch (error) {
    console.error('❌ Error in Full System Seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFullSystem();
