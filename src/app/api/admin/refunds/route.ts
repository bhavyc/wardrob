import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const refunds = await prisma.refund.findMany({
      where: status && status !== 'ALL' ? { status: status as any } : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, walletBalance: true },
        },
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                category: true,
                baselineImages: true,
                rentalPrice: true,
                securityDeposit: true,
              },
            },
            renter: {
              select: { id: true, name: true, email: true, phone: true },
            },
            damageReports: {
              include: { dispute: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      refunds,
      manualApprovalRequired: process.env.REQUIRE_MANUAL_REFUND_APPROVAL !== 'false',
    });
  } catch (error: any) {
    console.error('Admin Refunds GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
