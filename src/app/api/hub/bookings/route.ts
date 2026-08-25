import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendUpcomingReturnReminders, processOverdueReturns, sendEscalatingOverdueReminders } from '@/lib/lazy-checks';

export async function GET(request: Request) {
  try {
    // Non-blocking lazy checks
    sendUpcomingReturnReminders().catch(console.error);
    processOverdueReturns().catch(console.error);
    sendEscalatingOverdueReminders().catch(console.error);

    const user = await getAuthUser(request);
    if (!user || (user.role !== 'HUB_PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    // Fetch bookings that need Pre-Dispatch Inspection
    const preDispatchBookingsRaw = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'AT_HUB_PRE'] },
      },
      include: {
        listing: true,
        renter: { select: { name: true, phone: true } },
        shipments: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const intakeBookings = preDispatchBookingsRaw.filter(b => {
      // Needs intake if it's arriving from Lister
      if (b.listing.status !== 'AT_HUB') return true; 
      return false;
    });

    const preDispatchBookings = preDispatchBookingsRaw.filter(b => {
      // Ready for pre-dispatch if it's already AT_HUB (intake complete)
      if (b.listing.status === 'AT_HUB') return true;
      return false;
    });

    // Fetch bookings that need Post-Return Inspection
    const postReturnBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['IN_USE', 'RETURNED_TO_HUB'] },
      },
      include: {
        listing: true,
        renter: { select: { name: true, phone: true } },
      },
      orderBy: { endDate: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const returnsDueToday = postReturnBookings.filter(b => {
      // Find items that are IN_USE and their endDate is today or earlier
      if (b.status === 'IN_USE') {
        const endDate = new Date(b.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate <= today;
      }
      return false;
    });

    return NextResponse.json({
      success: true,
      intakeBookings,
      preDispatchBookings,
      postReturnBookings,
      returnsDueToday,
    });
  } catch (error: any) {
    console.error('Hub Bookings API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
