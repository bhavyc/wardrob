import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@/generated/prisma/client';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { extensionDays } = await request.json();
    if (!extensionDays || extensionDays < 1) {
      return NextResponse.json({ success: false, error: 'Valid extension days required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { listing: true }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.renterId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (booking.status === 'COMPLETED' || booking.status === 'RETURNED_TO_HUB') {
      return NextResponse.json({ success: false, error: 'Cannot extend a completed booking' }, { status: 400 });
    }

    // Check availability and update inside a Serializable transaction
    const newEndDate = new Date(booking.endDate);
    newEndDate.setDate(newEndDate.getDate() + extensionDays);

    const result = await prisma.$transaction(async (tx) => {
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          listingId: booking.listingId,
          id: { not: booking.id },
          status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE'] },
          startDate: { lte: newEndDate },
          endDate: { gte: booking.endDate }
        }
      });

      if (conflictingBooking) {
        throw new Error('CONFLICT');
      }

      // Extension fee is 25% of the rental package price per extra day
      const baseRent = Number(booking.listing.rentalPrice);
      const extensionFeePerDay = baseRent / 4;
      const totalExtensionFee = extensionFeePerDay * extensionDays;

      if (Number(booking.securityDeposit) < totalExtensionFee) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // Deduct from security deposit
      const updatedSecurityDeposit = Number(booking.securityDeposit) - totalExtensionFee;
      const updatedRentAmount = Number(booking.rentAmount) + totalExtensionFee;

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          endDate: newEndDate,
          securityDeposit: updatedSecurityDeposit,
          rentAmount: updatedRentAmount,
        }
      });

      return { totalExtensionFee };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully extended by ${extensionDays} days. ₹${result.totalExtensionFee} was deducted from your security deposit.` 
    });

  } catch (error: any) {
    console.error('Extension Error:', error);
    if (error.message === 'CONFLICT') {
      return NextResponse.json({ 
        success: false, 
        error: 'Item is not available for extension due to an upcoming booking.' 
      }, { status: 409 });
    }
    if (error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ 
        success: false, 
        error: 'Extension fee exceeds remaining security deposit.' 
      }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
