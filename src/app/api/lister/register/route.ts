import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wardrob-fallback-secret-key-12345';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authUser = await getAuthUser(request);

    let userId: string;

    if (authUser) {
      // 1. User is already logged in, upgrade to Lister role
      userId = authUser.userId;

      // Validate that the user actually exists in the database to prevent stale cookie 500 errors
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        const response = NextResponse.json(
          { success: false, error: 'Session expired or user deleted. Please log in again.' },
          { status: 401 }
        );
        response.cookies.delete('auth_token');
        return response;
      }
      
      const { shopName, bio, aadhaarNumber, panNumber, bankAccountNo, bankIfsc } = body;
      if (!shopName || !bio || !aadhaarNumber || !panNumber || !bankAccountNo || !bankIfsc) {
        return NextResponse.json(
          { success: false, error: 'All fields including KYC details (Aadhaar, PAN, Bank Account, IFSC) are required.' },
          { status: 400 }
        );
      }

      if (aadhaarNumber.length !== 12 || isNaN(Number(aadhaarNumber))) {
        return NextResponse.json(
          { success: false, error: 'Aadhaar number must be exactly 12 digits.' },
          { status: 400 }
        );
      }

      if (panNumber.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'PAN card number must be exactly 10 characters.' },
          { status: 400 }
        );
      }

      // Check if lister profile already exists
      const existingProfile = await prisma.listerProfile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        return NextResponse.json(
          { success: false, error: 'Lister profile already exists.' },
          { status: 400 }
        );
      }

      // Transaction to update role and create profile
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
            aadhaarNumber: aadhaarNumber.trim(),
            panNumber: panNumber.trim().toUpperCase(),
            bankAccountNo: bankAccountNo.trim(),
            bankIfsc: bankIfsc.trim().toUpperCase(),
            status: 'PENDING',
          },
        }),
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Lister onboarding complete!',
      });

    } else {
      // 2. Guest registration: Create User and Lister Profile together
      const { name, email, phone, password, shopName, bio, aadhaarNumber, panNumber, bankAccountNo, bankIfsc } = body;

      if (!name || !email || !phone || !password || !shopName || !bio || !aadhaarNumber || !panNumber || !bankAccountNo || !bankIfsc) {
        return NextResponse.json(
          { success: false, error: 'All fields including password and KYC details are required.' },
          { status: 400 }
        );
      }

      if (aadhaarNumber.length !== 12 || isNaN(Number(aadhaarNumber))) {
        return NextResponse.json(
          { success: false, error: 'Aadhaar number must be exactly 12 digits.' },
          { status: 400 }
        );
      }

      if (panNumber.length !== 10) {
        return NextResponse.json(
          { success: false, error: 'PAN card number must be exactly 10 characters.' },
          { status: 400 }
        );
      }

      // Check if email or phone is already registered
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email address is already in use.' },
          { status: 400 }
        );
      }

      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: 'Phone number is already in use.' },
          { status: 400 }
        );
      }

      // Create User and Profile in a single transaction
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash: await bcrypt.hash(password.trim(), 10),
          role: 'LISTER',
          listerProfile: {
            create: {
              shopName,
              bio,
              aadhaarNumber,
              panNumber,
              bankAccountNo,
              bankIfsc,
              status: 'PENDING',
            },
          },
        },
      });

      return NextResponse.json({ success: true, message: 'Lister registered successfully!' });
    }
  } catch (error: any) {
    console.error('API Lister Register Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
