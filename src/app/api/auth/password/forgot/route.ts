import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

import { getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Distributed Rate Limit: max 3 attempts per 10 minutes per IP
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentAttempts = await prisma.duplicatePhotoHash.count({
      where: {
        contextId: 'RATE_LIMIT_FORGOT_PW',
        hashValue: { startsWith: ip },
        createdAt: { gte: tenMinutesAgo }
      }
    });

    if (recentAttempts >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many password reset requests. Please try again in 10 minutes.' },
        { status: 429 }
      );
    }

    await prisma.duplicatePhotoHash.create({
      data: {
        contextId: 'RATE_LIMIT_FORGOT_PW',
        hashValue: `${ip}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }
    });

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
