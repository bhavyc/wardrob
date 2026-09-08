import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (authUser?.sessionId) {
      await prisma.session.deleteMany({
        where: { id: authUser.sessionId },
      });
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    response.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    console.error('Logout Error:', error);
    const response = NextResponse.json({ success: true, message: 'Logged out.' });
    response.cookies.set('auth_token', '', { path: '/', maxAge: 0 });
    return response;
  }
}
