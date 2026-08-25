import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const [
      totalBookings,
      activeBookings,
      totalListings,
      activeListings,
      totalListers,
      pendingListers,
      hubPartnersCount,
      pendingPayouts,
      openDisputes,
      recentBookings,
      recentPayouts,
      chronicOverdueBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE', 'RETURNED_TO_HUB'] },
        },
      }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'AVAILABLE' } }),
      prisma.listerProfile.count(),
      prisma.listerProfile.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'HUB_PARTNER' } }),
      prisma.payout.findMany({
        where: { status: 'PENDING' },
        include: {
          lister: {
            include: { user: { select: { name: true, email: true, phone: true } } },
          },
          booking: {
            include: { listing: { select: { title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.booking.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          renter: { select: { name: true, email: true, phone: true } },
          listing: { select: { title: true, category: true, baselineImages: true } },
        },
      }),
      prisma.payout.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          lister: {
            include: { user: { select: { name: true, email: true } } },
          },
          booking: {
            include: { listing: { select: { title: true } } },
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          status: 'RETURNED_TO_HUB',
          endDate: {
            lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // > 3 days overdue
          },
        },
        orderBy: { endDate: 'asc' }, // Most overdue first
        include: {
          renter: { select: { name: true, phone: true } },
          listing: { select: { title: true } },
          shipments: { where: { leg: 'RENTER_TO_HUB' } },
        },
      }),
    ]);

    const totalPendingPayoutAmount = pendingPayouts.reduce((acc, p) => acc + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalBookings,
        activeBookings,
        totalListings,
        activeListings,
        totalListers,
        pendingListers,
        hubPartnersCount,
        pendingPayoutCount: pendingPayouts.length,
        totalPendingPayoutAmount,
        openDisputes,
      },
      recentBookings,
      recentPayouts,
      chronicOverdueBookings,
    });
  } catch (error: any) {
    console.error('Admin Stats API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
