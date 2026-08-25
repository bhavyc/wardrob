import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';
import { Prisma } from '@/generated/prisma/client';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Missing payment details.' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found.' }, { status: 404 });
    if (booking.renterId !== user.userId) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    if (booking.pendingExtensionOrderId !== razorpay_order_id) {
      return NextResponse.json({ success: false, error: 'Order ID mismatch.' }, { status: 400 });
    }
    
    // If the extension lock expired, reject the payment verification.
    // The Renter will have to retry the extension.
    if (!booking.pendingExtensionDate || !booking.pendingExtensionExpiry || new Date() > booking.pendingExtensionExpiry) {
      return NextResponse.json({ success: false, error: 'Extension lock expired. Please request extension again.' }, { status: 400 });
    }

    // Verify Razorpay Signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummysecret12345';
    
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Payment signature verification failed.' }, { status: 400 });
    }

    // Success! Update the Booking to finalize the extension
    // We add the extension fee to the total rent amount. Security deposit is untouched.
    
    // We need to fetch the extension fee. To do this perfectly, we can fetch the order amount from Razorpay,
    // or calculate it again. To keep it robust, we'll calculate it again.
    const listing = await prisma.listing.findUnique({ where: { id: booking.listingId } });
    if (!listing) throw new Error('Listing missing');
    
    const originalEndDate = new Date(booking.endDate);
    const newEndDate = new Date(booking.pendingExtensionDate);
    const diffTime = Math.abs(newEndDate.getTime() - originalEndDate.getTime());
    const extensionDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const extensionFeePerDay = Number(listing.rentalPrice) / 4;
    const totalExtensionFee = extensionFeePerDay * extensionDays;

    await prisma.$transaction(async (tx) => {
      // Re-fetch booking inside the serializable lock to guarantee absolute safety
      const lockedBooking = await tx.booking.findUnique({ where: { id: booking.id } });
      if (!lockedBooking || !lockedBooking.pendingExtensionExpiry || new Date() > lockedBooking.pendingExtensionExpiry) {
        throw new Error('EXPIRED');
      }

      // 1. Finalize the extension on the booking and save the payment IDs
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          endDate: newEndDate, // Officially locked
          rentAmount: Number(booking.rentAmount) + totalExtensionFee,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          pendingExtensionDate: null,
          pendingExtensionOrderId: null,
          pendingExtensionExpiry: null
        }
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Payment successful. Extension confirmed.' 
    });

  } catch (error: any) {
    console.error('Extension Verify Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
