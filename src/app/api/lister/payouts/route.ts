import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!listerProfile) {
      return NextResponse.json(
        { success: false, error: 'Lister profile not found.' },
        { status: 404 }
      );
    }

    const payouts = await prisma.payout.findMany({
      where: { listerProfileId: listerProfile.id },
      include: {
        booking: {
          include: {
            listing: { select: { title: true, category: true, baselineImages: true } },
            renter: { select: { name: true } },
            damageReports: { include: { dispute: true } }
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSettled = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalPending = payouts
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      success: true,
      payouts,
      stats: {
        totalSettled,
        totalPending,
      },
    });
  } catch (error: any) {
    console.error('API Lister Payouts GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
