import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        walletBalance: true,
        idVerified: true,
        idVerificationStatus: true,
        idRejectionReason: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 401 }
      );
      response.cookies.delete('auth_token');
      return response;
    }

    // Check if lister profile exists
    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        shopName: true,
        status: true,
        registrationFeePaid: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      ListerProfile: listerProfile,
      listerProfile,
    });
  } catch (error: any) {
    console.error('API Auth Session Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
