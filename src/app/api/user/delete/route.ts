import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    // Delete the user from the database
    await prisma.user.delete({
      where: { id: authUser.userId },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully.',
    });

    // Clear session cookie
    response.cookies.delete('auth_token');

    return response;
  } catch (error: any) {
    console.error('API User Delete Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
