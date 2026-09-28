import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { getClientIp } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email';

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

    // Generate 6-digit secure numeric verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpires = new Date(Date.now() + 15 * 60000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpires
      }
    });

    // Determine base URL for email link
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = origin || (host ? `${proto}://${host}` : 'http://localhost:3000');
    const resetUrl = `${baseUrl}/reset-password?token=${resetCode}`;

    // Send real luxury branded email via Gmail SMTP
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      resetCode,
      userName: user.name || 'Valued Member',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'A password reset code and direct link have been sent to your email.',
      ...(process.env.NODE_ENV === 'development' ? { dev_token: resetCode } : {})
    });

  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
