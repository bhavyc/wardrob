import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const payouts = await prisma.payout.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        lister: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        booking: {
          include: {
            renter: { select: { name: true, email: true } },
            listing: { select: { title: true, category: true, baselineImages: true } },
            damageReports: {
              include: { dispute: true }
            }
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, payouts });
  } catch (error: any) {
    console.error('Admin Payouts GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { payoutId, status, batchRef } = await request.json();

    if (!payoutId || !status) {
      return NextResponse.json({ success: false, error: 'payoutId and status are required' }, { status: 400 });
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: status as any,
        batchRef: batchRef || undefined,
      },
      include: {
        lister: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payout marked as ${status}`,
      payout: updatedPayout,
    });
  } catch (error: any) {
    console.error('Admin Payouts PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
