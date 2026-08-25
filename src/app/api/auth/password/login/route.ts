import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wardrob-fallback-secret-key-12345';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { phone: email.trim() } // support logging in with phone number too
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 400 }
      );
    }

    // Check if user is locked out
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - new Date().getTime()) / 60000);
      return NextResponse.json(
        { success: false, error: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minutes.` },
        { status: 403 }
      );
    }

// Verify password matching
    let isPasswordCorrect = false;

    if (user.passwordHash) {
      isPasswordCorrect = await bcrypt.compare(cleanPassword, user.passwordHash);
    }

    if (!isPasswordCorrect) {
      // Increment failed login attempts
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      let newLockedUntil = null;
      
      if (newAttempts >= 5) {
        newLockedUntil = new Date(Date.now() + 15 * 60000); // Lock for 15 mins
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: newLockedUntil,
        }
      });

      if (newLockedUntil) {
        return NextResponse.json(
          { success: false, error: 'Account locked for 15 minutes due to too many failed attempts.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Incorrect password.' },
        { status: 400 }
      );
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        }
      });
    }

    // Check if user is lister and their profile is PENDING
    if (user.role === 'LISTER') {
      const listerProfile = await prisma.listerProfile.findUnique({
        where: { userId: user.id },
      });
      if (listerProfile && listerProfile.status === 'PENDING') {
        return NextResponse.json(
          { success: false, error: 'Account under review' },
          { status: 403 }
        );
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        phone: user.phone,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: Number(user.walletBalance),
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('API Password Login Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
