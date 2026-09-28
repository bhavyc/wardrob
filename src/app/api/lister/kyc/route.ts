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

    const { aadhaarNumber, panNumber, bankAccountNo, bankIfsc } = await request.json();

    if (!aadhaarNumber || !panNumber || !bankAccountNo || !bankIfsc) {
      return NextResponse.json(
        { success: false, error: 'All KYC and bank details are required.' },
        { status: 400 }
      );
    }

    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!listerProfile) {
      return NextResponse.json(
        { success: false, error: 'Lister profile not found.' },
        { status: 404 }
      );
    }

    if (!listerProfile.registrationFeePaid) {
      return NextResponse.json(
        { success: false, error: 'Please pay the ₹500 onboarding activation fee before submitting KYC details.' },
        { status: 400 }
      );
    }

    if (listerProfile.status === 'PENDING' && listerProfile.aadhaarNumber) {
      return NextResponse.json(
        { success: false, error: 'Your KYC documents are already submitted and under review. Updates are locked.' },
        { status: 400 }
      );
    }

    if (listerProfile.status === 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Your KYC has already been verified and approved.' },
        { status: 400 }
      );
    }

    const encryptedAadhaar = encryptString(aadhaarNumber.trim());
    const encryptedPan = encryptString(panNumber.trim().toUpperCase());
    const encryptedBank = encryptString(bankAccountNo.trim());

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.listerProfile.update({
        where: { userId: authUser.userId },
        data: {
          aadhaarNumber: encryptedAadhaar,
          panNumber: encryptedPan,
          bankAccountNo: encryptedBank,
          bankIfsc: bankIfsc.trim().toUpperCase(),
          status: 'PENDING',
        },
      });

      await tx.user.update({
        where: { id: authUser.userId },
        data: {
          aadhaarNumber: encryptedAadhaar,
          panNumber: encryptedPan,
          idVerificationStatus: 'PENDING',
        }
      });

      return profile;
    });

    return NextResponse.json({
      success: true,
      message: 'KYC information updated successfully.',
      status: updatedProfile.status,
    });
  } catch (error: any) {
    console.error('API Lister KYC POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
