import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await getAuthUser(request);
    
    // Only Admin can perform force settlement
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const bookingId = params.id;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { lister: true } } }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'COMPLETED' || booking.status === 'LOST_NOT_RETURNED') {
      return NextResponse.json({ success: false, error: 'Booking is already settled or marked as lost.' }, { status: 400 });
    }

    // Must be overdue to qualify
    const now = new Date();
    if (now <= booking.endDate) {
      return NextResponse.json({ success: false, error: 'Booking is not yet overdue.' }, { status: 400 });
    }

    const diffTime = now.getTime() - booking.endDate.getTime();
    const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysOverdue < 15) {
      return NextResponse.json({ success: false, error: `Booking must be at least 15 days overdue. Currently ${daysOverdue} days.` }, { status: 400 });
    }

    // Force Settlement Math (Same as full shortfall scenario)
    const securityDeposit = Number(booking.securityDeposit);
    const rentAmount = Number(booking.rentAmount);
    const extensionFee = Number(booking.extensionFee) || 0;
    
    const commissionRate = 0.35; // Flat 35% commission (65% Lister / 35% Admin)
    
    const listerRentShare = rentAmount * (1 - commissionRate);
    const listerExtensionShare = extensionFee * 0.50; // 50/50 split for extension fee
    
    const commission = (rentAmount * commissionRate) + (extensionFee * 0.50);
    
    // Lister receives their share of rent + extension fee + the entire security deposit (forfeited by Renter)
    const finalListerPayout = listerRentShare + listerExtensionShare + securityDeposit;

    // Run updates atomically
    await prisma.$transaction(async (tx) => {
      // 1. Mark listing as UNLISTED (lost)
      await tx.listing.update({
        where: { id: booking.listingId },
        data: { 
          status: 'UNLISTED',
          shelfLocation: null
        }
      });

      // 2. Add severe penalty to Renter (+50)
      await tx.user.update({
        where: { id: booking.renterId },
        data: { penaltyScore: { increment: 50 } }
      });

      // 3. Create Payout for Lister
      await tx.payout.create({
        data: {
          bookingId,
          listerProfileId: booking.listing.listerProfileId,
          amount: finalListerPayout,
          commissionPaid: commission,
          status: 'PENDING'
        }
      });

      // 4. Update Booking to terminal state LOST_NOT_RETURNED
      await tx.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'LOST_NOT_RETURNED',
          // No actualReturnDate is set, because it wasn't returned
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Booking forcefully settled. Deposit forfeited and Lister payout generated.' 
    });

  } catch (error: any) {
    console.error('Force Settlement Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
