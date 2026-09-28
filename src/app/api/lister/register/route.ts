import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { getClientIp } from '@/lib/rate-limit';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentAttempts = await prisma.duplicatePhotoHash.count({
      where: {
        contextId: 'RATE_LIMIT_LISTER_REGISTER',
        hashValue: { startsWith: ip },
        createdAt: { gte: fifteenMinutesAgo }
      }
    });

    if (recentAttempts >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    await prisma.duplicatePhotoHash.create({
      data: {
        contextId: 'RATE_LIMIT_LISTER_REGISTER',
        hashValue: `${ip}_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }
    });

    let body: any = {};
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json({ success: false, error: 'Empty request payload.' }, { status: 400 });
      }
      body = JSON.parse(text);
    } catch (err) {
      console.error("JSON Parse error:", err);
      return NextResponse.json({ success: false, error: 'Invalid JSON payload.' }, { status: 400 });
    }
    const authUser = await getAuthUser(request);

    const { name, email, phone, password, shopName, bio } = body;

    let userId: string;

    if (authUser) {
      userId = authUser.userId;
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        const response = NextResponse.json(
          { success: false, error: 'Session expired. Please log in again.' },
          { status: 401 }
        );
        response.cookies.delete('auth_token');
        return response;
      }

      if (!shopName || !bio) {
        return NextResponse.json(
          { success: false, error: 'Shop Name and Bio are required.' },
          { status: 400 }
        );
      }

      const existingProfile = await prisma.listerProfile.findUnique({ where: { userId } });
      if (existingProfile) {
        return NextResponse.json(
          { success: false, error: 'Lister profile already exists.' },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { role: 'LISTER' },
        }),
        prisma.listerProfile.create({
          data: {
            userId,
            shopName: shopName.trim(),
            bio: bio ? bio.trim() : null,
            registrationFeePaid: false,
            status: 'PENDING',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Lister profile created. Please pay registration fee.',
      });

    } else {
      if (!name || !email || !phone || !password || !shopName || !bio) {
        return NextResponse.json(
          { success: false, error: 'Name, email, phone, password, shop name, and bio are required.' },
          { status: 400 }
        );
      }

      const emailExists = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email address is already registered.' },
          { status: 400 }
        );
      }

      const phoneExists = await prisma.user.findUnique({ where: { phone: phone.trim() } });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'Phone number is already registered.' },
          { status: 400 }
        );
      }

      const newUser = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          passwordHash: await bcrypt.hash(password.trim(), 10),
          role: 'LISTER',
          listerProfile: {
            create: {
              shopName: shopName.trim(),
              bio: bio ? bio.trim() : null,
              registrationFeePaid: false,
              status: 'PENDING',
            },
          },
        },
      });

      // Create server-side session for revocation tracking
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const sessionRecord = await prisma.session.create({
        data: {
          userId: newUser.id,
          token: `${newUser.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          expiresAt: sessionExpiresAt,
        }
      });

      // Auto login token cookie
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email, 
          role: newUser.role,
          sessionId: sessionRecord.id,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          idVerified: newUser.idVerified,
        },
        message: 'Registration successful! Proceeding to payment.',
      });

      response.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    }
  } catch (error: any) {
    console.error('API Lister Register Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
