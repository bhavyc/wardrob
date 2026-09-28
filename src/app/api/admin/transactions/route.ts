import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export interface UnifiedTransaction {
  id: string;
  rawId: string;
  type: 'RENTAL_PAYMENT' | 'SECURITY_DEPOSIT_REFUND' | 'LISTER_PAYOUT' | 'REGISTRATION_FEE';
  direction: 'INFLOW' | 'OUTFLOW' | 'REFUND';
  title: string;
  description: string;
  grossAmount: number;
  netPlatformRevenue: number;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED' | 'CANCELLED';
  createdAt: string;

  breakdown: {
    baseRent?: number;
    securityDeposit?: number;
    extensionFee?: number;
    latePenalty?: number;
    damageDeduction?: number;
    platformCommission?: number;
    commissionRatePercent?: number;
    netPayout?: number;
    refundedAmount?: number;
    registrationFee?: number;
  };

  payer: {
    name: string;
    email: string;
    phone?: string | null;
    role: string;
    userId?: string;
  };

  payee: {
    name: string;
    email?: string;
    phone?: string | null;
    shopName?: string | null;
    bankAccountNo?: string | null;
    bankIfsc?: string | null;
    panNumber?: string | null;
    role: string;
    userId?: string;
  };

  booking?: {
    id: string;
    startDate: string;
    endDate: string;
    actualReturnDate?: string | null;
    status: string;
  };

  outfit?: {
    id: string;
    title: string;
    category: string;
    image?: string | null;
  };

  gateway: {
    provider: string;
    orderId?: string | null;
    paymentId?: string | null;
    refundId?: string | null;
    batchRef?: string | null;
  };
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type') || 'ALL';
    const filterStatus = searchParams.get('status') || 'ALL';
    const searchQuery = (searchParams.get('search') || '').toLowerCase().trim();

    // 1. Fetch Bookings (Renter Inflows)
    const bookings = await prisma.booking.findMany({
      include: {
        renter: { select: { id: true, name: true, email: true, phone: true } },
        listing: {
          include: {
            lister: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
        payout: true,
        refund: true,
        damageReports: {
          include: { dispute: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch Lister Payouts (Atelier Disbursals)
    const payouts = await prisma.payout.findMany({
      include: {
        lister: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        booking: {
          include: {
            renter: { select: { id: true, name: true, email: true, phone: true } },
            listing: { select: { id: true, title: true, category: true, baselineImages: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Fetch Refunds (Security Deposit Returns)
    const refunds = await prisma.refund.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        booking: {
          include: {
            listing: { select: { id: true, title: true, category: true, baselineImages: true } },
            damageReports: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Fetch Registration Payments (Lister Onboarding Fees)
    const registrationPayments = await prisma.registrationPayment.findMany({
      include: {
        listerProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const unifiedList: UnifiedTransaction[] = [];
    const generatedIds = new Set<string>();

    const createTxnId = (prefix: string, rawId: string): string => {
      const stripped = rawId.replace(/^(pay|book|ref|reg|usr)[_-]/i, '').replace(/-/g, '');
      const shortCode = stripped.length >= 8 ? stripped.slice(-8).toUpperCase() : stripped.toUpperCase();
      let candidate = `TXN-${prefix}-${shortCode}`;
      
      let counter = 1;
      while (generatedIds.has(candidate)) {
        candidate = `TXN-${prefix}-${shortCode}-${counter}`;
        counter++;
      }
      generatedIds.add(candidate);
      return candidate;
    };

    // --- Transform Bookings into Rental Payment Inflows ---
    for (const b of bookings) {
      const gross = Number(b.totalAmount);
      const rent = Number(b.rentAmount);
      const deposit = Number(b.securityDeposit);
      const extFee = Number(b.extensionFee || 0);
      const penalty = Number(b.lateReturnPenalty || 0);
      const commission = Number(b.payout?.commissionPaid || (Math.max(2000, Math.round(rent * 0.35)) + Math.round(extFee * 0.50)));

      let status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED' | 'CANCELLED' = 'COMPLETED';
      if (b.status === 'PENDING') status = 'PENDING';
      else if (b.status === 'CANCELLED') status = 'CANCELLED';

      unifiedList.push({
        id: createTxnId('RENT', b.id),
        rawId: b.id,
        type: 'RENTAL_PAYMENT',
        direction: 'INFLOW',
        title: `Rental Payment · ${b.listing.title}`,
        description: `Full rental checkout paid by ${b.renter.name} (Rent + Deposit)`,
        grossAmount: gross,
        netPlatformRevenue: commission,
        status,
        createdAt: b.createdAt.toISOString(),
        breakdown: {
          baseRent: rent,
          securityDeposit: deposit,
          extensionFee: extFee,
          latePenalty: penalty,
          platformCommission: commission,
          commissionRatePercent: 35,
        },
        payer: {
          name: b.renter.name,
          email: b.renter.email,
          phone: b.renter.phone,
          role: 'RENTER',
          userId: b.renter.id,
        },
        payee: {
          name: b.listing.lister.user.name,
          email: b.listing.lister.user.email,
          phone: b.listing.lister.user.phone,
          shopName: b.listing.lister.shopName,
          bankAccountNo: b.listing.lister.bankAccountNo,
          bankIfsc: b.listing.lister.bankIfsc,
          panNumber: b.listing.lister.panNumber,
          role: 'LISTER',
        },
        booking: {
          id: b.id,
          startDate: b.startDate.toISOString(),
          endDate: b.endDate.toISOString(),
          actualReturnDate: b.actualReturnDate?.toISOString() || null,
          status: b.status,
        },
        outfit: {
          id: b.listing.id,
          title: b.listing.title,
          category: b.listing.category,
          image: b.listing.baselineImages?.[0] || null,
        },
        gateway: {
          provider: 'Razorpay',
          orderId: b.razorpayOrderId,
          paymentId: b.razorpayPaymentId,
        },
      });
    }

    // --- Transform Refunds (Deposit Returns) ---
    for (const r of refunds) {
      const refundAmt = Number(r.amount);
      const originalDep = Number(r.booking.securityDeposit);
      const damageDeduction = (r.booking.damageReports || [])
        .filter(dr => dr.inspectionType === 'POST_RETURN' || Number(dr.deductionAmount) > 0)
        .reduce((sum, dr) => sum + Number(dr.deductionAmount || 0), 0);
      const latePenalty = Number(r.booking.lateReturnPenalty || 0);

      unifiedList.push({
        id: createTxnId('REF', r.id),
        rawId: r.id,
        type: 'SECURITY_DEPOSIT_REFUND',
        direction: 'REFUND',
        title: `Security Deposit Refund · ${r.booking.listing.title}`,
        description: `Security deposit returned to ${r.user.name} after hub inspection`,
        grossAmount: refundAmt,
        netPlatformRevenue: 0,
        status: r.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        createdAt: r.createdAt.toISOString(),
        breakdown: {
          securityDeposit: originalDep,
          damageDeduction: damageDeduction,
          latePenalty: latePenalty,
          refundedAmount: refundAmt,
        },
        payer: {
          name: 'Wardrob Escrow Vault',
          email: 'escrow@wardrob.in',
          role: 'PLATFORM_ESCROW',
        },
        payee: {
          name: r.user.name,
          email: r.user.email,
          phone: r.user.phone,
          role: 'RENTER',
          userId: r.user.id,
        },
        booking: {
          id: r.booking.id,
          startDate: r.booking.startDate.toISOString(),
          endDate: r.booking.endDate.toISOString(),
          actualReturnDate: r.booking.actualReturnDate?.toISOString() || null,
          status: r.booking.status,
        },
        outfit: {
          id: r.booking.listing.id,
          title: r.booking.listing.title,
          category: r.booking.listing.category,
          image: r.booking.listing.baselineImages?.[0] || null,
        },
        gateway: {
          provider: r.gateway === 'WALLET' ? 'In-App Wallet' : (r.gateway === 'RAZORPAY' ? 'Razorpay Refund' : (r.gateway || 'Razorpay')),
          orderId: r.booking.razorpayOrderId,
          refundId: r.gatewayRefundId || (r.gateway === 'WALLET' ? 'Credited to User Wallet' : null),
        },
      });
    }

    // --- Transform Payouts (Lister Settlements) ---
    for (const p of payouts) {
      const payoutAmt = Number(p.amount);
      const commPaid = Number(p.commissionPaid);
      const baseRent = Number(p.booking.rentAmount);
      const walletInc = Number(p.walletBalanceIncluded || 0);

      unifiedList.push({
        id: createTxnId('PAY', p.id),
        rawId: p.id,
        type: 'LISTER_PAYOUT',
        direction: 'OUTFLOW',
        title: `Lister Rental Payout · ${p.lister.shopName || p.lister.user.name}`,
        description: `Disbursal for rental of "${p.booking.listing.title}"`,
        grossAmount: payoutAmt,
        netPlatformRevenue: commPaid,
        status: p.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        createdAt: p.createdAt.toISOString(),
        breakdown: {
          baseRent: baseRent,
          platformCommission: commPaid,
          netPayout: payoutAmt,
          commissionRatePercent: 35,
        },
        payer: {
          name: 'Wardrob Payout Desk',
          email: 'finance@wardrob.in',
          role: 'PLATFORM_TREASURY',
        },
        payee: {
          name: p.lister.user.name,
          email: p.lister.user.email,
          phone: p.lister.user.phone,
          shopName: p.lister.shopName,
          bankAccountNo: p.lister.bankAccountNo,
          bankIfsc: p.lister.bankIfsc,
          panNumber: p.lister.panNumber,
          role: 'LISTER',
        },
        booking: {
          id: p.booking.id,
          startDate: p.booking.startDate.toISOString(),
          endDate: p.booking.endDate.toISOString(),
          status: p.booking.status,
        },
        outfit: {
          id: p.booking.listing.id,
          title: p.booking.listing.title,
          category: p.booking.listing.category,
          image: p.booking.listing.baselineImages?.[0] || null,
        },
        gateway: {
          provider: 'Bank Transfer (IMPS/NEFT)',
          batchRef: p.batchRef || null,
        },
      });
    }

    // --- Transform Lister Registration Payments ---
    for (const reg of registrationPayments) {
      const amt = Number(reg.amount);
      let regStatus: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED' | 'CANCELLED' = 'COMPLETED';
      if (reg.status === 'PENDING') regStatus = 'PENDING';
      else if (reg.status === 'FAILED') regStatus = 'FAILED';

      unifiedList.push({
        id: createTxnId('REG', reg.id),
        rawId: reg.id,
        type: 'REGISTRATION_FEE',
        direction: 'INFLOW',
        title: `Lister Onboarding Fee · ${reg.listerProfile.shopName || reg.listerProfile.user.name}`,
        description: `One-time verified studio activation fee paid by ${reg.listerProfile.user.name}`,
        grossAmount: amt,
        netPlatformRevenue: amt,
        status: regStatus,
        createdAt: reg.createdAt.toISOString(),
        breakdown: {
          registrationFee: amt,
        },
        payer: {
          name: reg.listerProfile.user.name,
          email: reg.listerProfile.user.email,
          phone: reg.listerProfile.user.phone,
          role: 'LISTER',
          userId: reg.listerProfile.user.id,
        },
        payee: {
          name: 'Wardrob Platform Treasury',
          email: 'accounts@wardrob.in',
          role: 'PLATFORM',
        },
        gateway: {
          provider: 'Razorpay',
          orderId: reg.razorpayOrderId,
          paymentId: reg.razorpayPaymentId,
        },
      });
    }

    // Sort all unified transactions by newest first
    unifiedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate executive summary metrics across entire dataset
    let totalInflowGMV = 0;
    let totalPlatformCommission = 0;
    let totalDepositsProcessed = 0;
    let totalPayoutsDisbursed = 0;
    let totalRegistrationRevenue = 0;

    for (const tx of unifiedList) {
      if (tx.status === 'COMPLETED') {
        if (tx.type === 'RENTAL_PAYMENT') {
          totalInflowGMV += tx.grossAmount;
          totalPlatformCommission += tx.netPlatformRevenue;
          if (tx.breakdown.securityDeposit) {
            totalDepositsProcessed += tx.breakdown.securityDeposit;
          }
        } else if (tx.type === 'LISTER_PAYOUT') {
          totalPayoutsDisbursed += tx.grossAmount;
        } else if (tx.type === 'REGISTRATION_FEE') {
          totalRegistrationRevenue += tx.grossAmount;
        }
      }
    }

    const summary = {
      totalInflowGMV,
      totalPlatformCommission: totalPlatformCommission + totalRegistrationRevenue,
      totalDepositsProcessed,
      totalPayoutsDisbursed,
      totalRegistrationRevenue,
      totalTransactions: unifiedList.length,
    };

    // Filter by type if requested
    let filtered = unifiedList;
    if (filterType !== 'ALL') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by status if requested
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.id.toLowerCase().includes(searchQuery) ||
          t.title.toLowerCase().includes(searchQuery) ||
          t.payer.name.toLowerCase().includes(searchQuery) ||
          t.payer.email.toLowerCase().includes(searchQuery) ||
          (t.payer.phone && t.payer.phone.toLowerCase().includes(searchQuery)) ||
          t.payee.name.toLowerCase().includes(searchQuery) ||
          (t.payee.shopName && t.payee.shopName.toLowerCase().includes(searchQuery)) ||
          (t.gateway.orderId && t.gateway.orderId.toLowerCase().includes(searchQuery)) ||
          (t.gateway.paymentId && t.gateway.paymentId.toLowerCase().includes(searchQuery)) ||
          (t.gateway.batchRef && t.gateway.batchRef.toLowerCase().includes(searchQuery))
      );
    }

    return NextResponse.json({
      success: true,
      summary,
      transactions: filtered,
      count: filtered.length,
    });
  } catch (error: any) {
    console.error('Admin Transactions GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
