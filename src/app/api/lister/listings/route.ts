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

    const listings = await prisma.listing.findMany({
      where: { listerProfileId: listerProfile.id },
      include: {
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isOnboarded = Boolean(listerProfile.registrationFeePaid && listerProfile.status === 'APPROVED');

    return NextResponse.json({
      success: true,
      listings,
      isOnboarded,
      registrationFeePaid: Boolean(listerProfile.registrationFeePaid),
      listerStatus: listerProfile.status,
    });
  } catch (error: any) {
    console.error('API Lister listings GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
