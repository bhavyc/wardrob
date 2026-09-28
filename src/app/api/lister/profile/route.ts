import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { decryptString } from '@/lib/encryption';

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
            walletBalance: true,
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

    const decryptedProfile = {
      ...profile,
      aadhaarNumber: profile.aadhaarNumber ? decryptString(profile.aadhaarNumber) : null,
      panNumber: profile.panNumber ? decryptString(profile.panNumber) : null,
      bankAccountNo: profile.bankAccountNo ? decryptString(profile.bankAccountNo) : null,
    };

    return NextResponse.json({
      success: true,
      profile: decryptedProfile,
      Lister: decryptedProfile,
    });
  } catch (error: any) {
    console.error('API Lister Profile GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
