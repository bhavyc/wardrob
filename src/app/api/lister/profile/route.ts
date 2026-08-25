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

    const profile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            rating: true,
            idVerified: true,
          },
        },
        _count: {
          select: {
            listings: true,
            payouts: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Lister profile not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
      Lister: profile,
    });
  } catch (error: any) {
    console.error('API Lister Profile GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
