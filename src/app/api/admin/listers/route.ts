import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

import { decryptString } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const listers = await prisma.listerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, idVerified: true, rating: true, createdAt: true } },
        _count: { select: { listings: true, payouts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const decryptedListers = listers.map(lister => ({
      ...lister,
      aadhaarNumber: lister.aadhaarNumber ? decryptString(lister.aadhaarNumber) : null,
      panNumber: lister.panNumber ? decryptString(lister.panNumber) : null,
      bankAccountNo: lister.bankAccountNo ? decryptString(lister.bankAccountNo) : null,
    }));

    return NextResponse.json({ success: true, listers: decryptedListers });
  } catch (error: any) {
    console.error('Admin Listers GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { listerProfileId, status, commissionOverride } = await request.json();

    if (!listerProfileId || !status) {
      return NextResponse.json({ success: false, error: 'listerProfileId and status are required' }, { status: 400 });
    }

    const updated = await prisma.listerProfile.update({
      where: { id: listerProfileId },
      data: {
        status: status as any,
        commissionOverride: commissionOverride !== undefined ? Number(commissionOverride) : undefined,
      },
      include: { user: true },
    });

    // If approved, also mark user as idVerified
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: updated.userId },
        data: { idVerified: true },
      });
    }

    return NextResponse.json({ success: true, lister: updated });
  } catch (error: any) {
    console.error('Admin Listers PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
