import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanEmail }]
      }
    });

    if (!user) {
      // Return success anyway to prevent email enumeration attacks
      return NextResponse.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires
      }
    });

    // In production, send email/SMS. In development mode only, log to console.
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV ONLY] Password reset token for ${user.email}: ${resetToken}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'If that email exists in our records, a password reset link has been sent.',
      ...(process.env.NODE_ENV === 'development' ? { dev_token: resetToken } : {})
    });

  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
