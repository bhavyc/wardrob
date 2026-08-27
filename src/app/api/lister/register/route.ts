import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wardrob-fallback-secret-key-12345';

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'REF';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authUser = await getAuthUser(request);

    const { name, email, phone, password, shopName, bio, referralCode: inputReferralCode } = body;

    let referredByCodeClean: string | null = null;

    if (inputReferralCode && inputReferralCode.trim().length > 0) {
      const codeToSearch = inputReferralCode.trim().toUpperCase();
      const referrerExists = await prisma.listerProfile.findUnique({
        where: { referralCode: codeToSearch }
      });

      if (!referrerExists) {
        return NextResponse.json(
          { success: false, error: 'Invalid referral code provided.' },
          { status: 400 }
        );
      }

      referredByCodeClean = codeToSearch;
    }

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

      let newRefCode = generateReferralCode();
      // Ensure unique referral code
      while (await prisma.listerProfile.findUnique({ where: { referralCode: newRefCode } })) {
        newRefCode = generateReferralCode();
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
            referralCode: newRefCode,
            referredByCode: referredByCodeClean,
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

      let newRefCode = generateReferralCode();
      while (await prisma.listerProfile.findUnique({ where: { referralCode: newRefCode } })) {
        newRefCode = generateReferralCode();
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
              referralCode: newRefCode,
              referredByCode: referredByCodeClean,
              registrationFeePaid: false,
              status: 'PENDING',
            },
          },
        },
      });

      // Auto login token cookie
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({
        success: true,
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
