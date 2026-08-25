import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { encryptString } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { idNumber, idType, idPhotoUrl } = await request.json();

    if (!idNumber || !idType || !idPhotoUrl) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    const encryptedIdNumber = encryptString(idNumber);

    await prisma.user.update({
      where: { id: user.userId },
      data: { 
        idVerificationStatus: 'PENDING',
        idType,
        idNumber: encryptedIdNumber,
        idPhotoUrl,
        idRejectionReason: null
      }
    });

    return NextResponse.json({ success: true, message: 'ID Verification submitted and is pending review.' });
  } catch (error: any) {
    console.error('Verify ID Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
