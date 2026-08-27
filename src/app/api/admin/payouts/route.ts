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
            user: { select: { id: true, name: true, email: true, phone: true, walletBalance: true } },
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

    // Atomic transaction to club wallet balance
    const updatedPayout = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: {
          lister: { include: { user: true } },
        }
      });

      if (!payout) throw new Error('Payout not found');
      
      let finalAmount: number = Number(payout.amount);
      let finalBatchRef = batchRef || undefined;
      
      // If marking as completed and there is a wallet balance, club it
      if (status === 'COMPLETED' && payout.status !== 'COMPLETED') {
        const currentWalletBalance = Number(payout.lister.user.walletBalance);
        if (currentWalletBalance > 0) {
          finalAmount = Number(payout.amount) + currentWalletBalance;
          finalBatchRef = `${batchRef || 'MANUAL'} (Clubbed Wallet ₹${currentWalletBalance})`;
          
          // Deduct from wallet balance
          await tx.user.update({
            where: { id: payout.lister.user.id },
            data: { walletBalance: { decrement: currentWalletBalance } }
          });
        }
      }

      return await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: status as any,
          batchRef: finalBatchRef,
          amount: finalAmount,
          walletBalanceIncluded: status === 'COMPLETED' && payout.status !== 'COMPLETED' ? Number(payout.lister.user.walletBalance) : 0
        },
        include: {
          lister: {
            include: { user: { select: { name: true, email: true, walletBalance: true } } },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Payout marked as ${status}`,
      payout: updatedPayout,
    });
  } catch (error: any) {
    console.error('Admin Payouts PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
