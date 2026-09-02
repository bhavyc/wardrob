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
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        renterId: user.userId,
      },
      include: {
        listing: {
          include: {
            lister: {
              select: {
                id: true,
                shopName: true,
                bio: true,
              }
            }
          }
        },
        shipments: true,
        damageReports: { include: { dispute: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error: any) {
    console.error('API User Bookings Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
