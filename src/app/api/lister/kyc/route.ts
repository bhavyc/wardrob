import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

import { encryptString } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { shopName, bio, aadhaarNumber, panNumber, bankAccountNo, bankIfsc } = await request.json();

    if (!shopName || !aadhaarNumber || !panNumber || !bankAccountNo || !bankIfsc) {
      return NextResponse.json(
        { success: false, error: 'All fields including KYC details are required.' },
        { status: 400 }
      );
    }

    const encryptedAadhaar = encryptString(aadhaarNumber.trim());
    const encryptedPan = encryptString(panNumber.trim().toUpperCase());
    const encryptedBank = encryptString(bankAccountNo.trim());

    const updatedProfile = await prisma.listerProfile.upsert({
      where: { userId: authUser.userId },
      update: {
        shopName: shopName.trim(),
        bio: bio ? bio.trim() : null,
        aadhaarNumber: encryptedAadhaar,
        panNumber: encryptedPan,
        bankAccountNo: encryptedBank,
        bankIfsc: bankIfsc.trim().toUpperCase(),
      },
      create: {
        userId: authUser.userId,
        shopName: shopName.trim(),
        bio: bio ? bio.trim() : null,
        aadhaarNumber: encryptedAadhaar,
        panNumber: encryptedPan,
        bankAccountNo: encryptedBank,
        bankIfsc: bankIfsc.trim().toUpperCase(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'KYC information updated successfully.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('API Lister KYC POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
