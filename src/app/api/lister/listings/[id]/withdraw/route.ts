import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: listingId } = await context.params;
    const user = await getAuthUser(request);
    if (!user || user.role !== 'LISTER') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Lister owns this listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { lister: true }
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    if (listing.lister.userId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (listing.status !== 'AT_HUB') {
      return NextResponse.json({ success: false, error: 'Only items currently at the Hub can be withdrawn' }, { status: 400 });
    }

    // Find the latest booking to attach the shipment to (since Shipment requires bookingId)
    const latestBooking = await prisma.booking.findFirst({
      where: { listingId },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestBooking) {
      return NextResponse.json({ success: false, error: 'Cannot withdraw: No associated booking history found to attach logistics.' }, { status: 400 });
    }

    // Update Listing Status and Create Shipment Transaction
    await prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: listingId },
        data: { status: 'UNLISTED' } // Prevent new bookings while withdrawing
      });

      await tx.shipment.create({
        data: {
          bookingId: latestBooking.id,
          leg: 'HUB_TO_LISTER',
          status: 'PENDING'
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Withdrawal initiated. A courier will return the item from the Hub to your registered address.' });

  } catch (error: any) {
    console.error('Withdrawal API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
