import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET || 'wardrob_cron_secret_token_12345';
    
    let isAuthorized = false;
    
    if (authUser && authUser.role === 'ADMIN') {
      isAuthorized = true;
    } else if (authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Access restricted to administrative reconciliation.' },
        { status: 401 }
      );
    }

    // Fetch PENDING bookings created more than 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const staleBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: thirtyMinutesAgo,
        },
      },
    });

    let reconciledCancelledCount = 0;

    for (const booking of staleBookings) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });
      reconciledCancelledCount++;
    }

    return NextResponse.json({
      success: true,
      summary: {
        staleBookingsFound: staleBookings.length,
        cancelledCount: reconciledCancelledCount,
      },
    });
  } catch (error: any) {
    console.error('API Admin Bookings Reconcile Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during booking reconciliation.' },
      { status: 500 }
    );
  }
}
