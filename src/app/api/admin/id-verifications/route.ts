import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { decryptString } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const rawUsers = await prisma.user.findMany({
      where: {
        idVerificationStatus: status as any
      },
      select: {
        id: true,
        name: true,
        email: true,
        idType: true,
        idNumber: true,
        idPhotoUrl: true,
        idVerificationStatus: true,
        idRejectionReason: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Decrypt ID Numbers before sending to Admin
    const users = rawUsers.map(user => {
      let decryptedId = user.idNumber;
      if (user.idNumber) {
        try {
          decryptedId = decryptString(user.idNumber);
        } catch (e) {
          // If decryption fails (e.g. legacy plaintext), return as-is
        }
      }
      return { ...user, idNumber: decryptedId };
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Fetch ID Verifications Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action, reason } = await request.json();

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    if (action === 'approve') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          idVerificationStatus: 'APPROVED',
          idVerified: true,
          idRejectionReason: null
        }
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          idVerificationStatus: 'REJECTED',
          idVerified: false,
          idRejectionReason: reason || 'Your ID was rejected. Please upload a clear and valid document.'
        }
      });
    }

    return NextResponse.json({ success: true, message: `ID Verification ${action}d successfully.` });
  } catch (error: any) {
    console.error('Update ID Verification Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
