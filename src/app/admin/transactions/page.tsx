'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface UnifiedTransaction {
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

interface SummaryMetrics {
  totalInflowGMV: number;
  totalPlatformCommission: number;
  totalDepositsProcessed: number;
  totalPayoutsDisbursed: number;
  totalRegistrationRevenue: number;
  totalTransactions: number;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Transaction for Granular Drawer / Modal
  const [activeTxn, setActiveTxn] = useState<UnifiedTransaction | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Pagination slice
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [transactions, currentPage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1480, margin: '0 auto', color: '#1E293B' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C5A880',
                background: 'rgba(197, 168, 128, 0.12)',
                border: '1px solid rgba(197, 168, 128, 0.3)',
                padding: '3px 8px',
                borderRadius: 4,
              }}
            >
              FINANCIAL AUDIT
            </span>
            <span style={{ fontSize: 13, color: '#64748B' }}>Real-time Gateway & Settlement Ledger</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Money Transactions & Financial Audit
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
            Granular ledger tracking renter payments, security deposit escrows, lister payouts, and platform revenues.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.15)',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            style={{ animation: loading ? 'adminSpin 1s linear infinite' : 'none' }}
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh Ledger'}
        </button>
      </div>

      {/* ── Executive KPI Metric Cards ── */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Card 1: Gross Volume Inflow */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '20px 22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase' }}>
                Total Inflow (GMV)
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ↓
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {formatCurrency(summary.totalInflowGMV)}
            </div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
              Incoming Customer Rentals via Razorpay
            </div>
          </div>

          {/* Card 2: Platform Net Commission */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '20px 22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase' }}>
                Platform Net Revenue
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                ★
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#B45309', letterSpacing: '-0.02em' }}>
              {formatCurrency(summary.totalPlatformCommission)}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Commission (20%) + ₹500 Lister studio fees
            </div>
          </div>

          {/* Card 3: Lister Disbursals */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '20px 22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase' }}>
                Disbursed to Listers
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ↑
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1D4ED8', letterSpacing: '-0.02em' }}>
              {formatCurrency(summary.totalPayoutsDisbursed)}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Net earnings paid out to boutique partners
            </div>
          </div>

          {/* Card 4: Security Deposit Pool */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              padding: '20px 22px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase' }}>
                Security Deposit Escrow
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                🛡️
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {formatCurrency(summary.totalDepositsProcessed)}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Customer deposits secured during active rentals
            </div>
          </div>
        </div>
      )}

      {/* ── Filter & Search Toolbar ── */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Type Filter Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { key: 'ALL', label: 'All Transactions' },
            { key: 'RENTAL_PAYMENT', label: 'Renter Payments (Inflow)' },
            { key: 'SECURITY_DEPOSIT_REFUND', label: 'Deposit Refunds' },
            { key: 'LISTER_PAYOUT', label: 'Lister Payouts (Outflow)' },
            { key: 'REGISTRATION_FEE', label: 'Studio Fees (₹500)' },
          ].map((tab) => {
            const active = typeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTypeFilter(tab.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  border: active ? '1px solid #0F172A' : '1px solid #CBD5E1',
                  background: active ? '#0F172A' : '#F8FAFC',
                  color: active ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side: Status Filter & Search */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              color: '#334155',
              background: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed / Paid</option>
            <option value="PENDING">Pending Settlement</option>
            <option value="REFUNDED">Refunded</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <div style={{ position: 'relative', minWidth: 260 }}>
            <input
              type="text"
              placeholder="Search by ID, Name, Email, Razorpay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Transaction Table ── */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '3px solid #E2E8F0',
                borderTopColor: '#0F172A',
                animation: 'adminSpin 0.7s linear infinite',
                margin: '0 auto 14px',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Loading ledger records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>No transactions match your query</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Try clearing search or filters</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Transaction Ref / Date</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Type & Flow</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Payer / Payee</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Related Outfit / Context</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Gross Value</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Platform Net</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Gateway / Ref</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'center' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => {
                  const isInflow = tx.direction === 'INFLOW';
                  const isRefund = tx.direction === 'REFUND';

                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                    >
                      {/* Col 1: Transaction ID & Date */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', fontSize: 12 }}>
                          {tx.id}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{formatDate(tx.createdAt)}</div>
                      </td>

                      {/* Col 2: Type & Flow badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 4,
                              background: isInflow ? '#ECFDF5' : isRefund ? '#FFFBEB' : '#EFF6FF',
                              color: isInflow ? '#047857' : isRefund ? '#B45309' : '#1D4ED8',
                              border: `1px solid ${isInflow ? '#A7F3D0' : isRefund ? '#FDE68A' : '#BFDBFE'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {isInflow ? '↓ INFLOW' : isRefund ? '↺ REFUND' : '↑ OUTFLOW'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#334155', fontWeight: 600, marginTop: 4 }}>
                          {tx.type === 'RENTAL_PAYMENT' && 'Rental Checkout'}
                          {tx.type === 'SECURITY_DEPOSIT_REFUND' && 'Deposit Return'}
                          {tx.type === 'LISTER_PAYOUT' && 'Lister Settlement'}
                          {tx.type === 'REGISTRATION_FEE' && 'Studio Onboarding'}
                        </div>
                      </td>

                      {/* Col 3: Payer / Payee */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginRight: 4 }}>FROM:</span>
                          {tx.payer.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500, marginRight: 4 }}>TO:</span>
                          {tx.payee.shopName || tx.payee.name}
                        </div>
                      </td>

                      {/* Col 4: Related Outfit / Context */}
                      <td style={{ padding: '14px 18px' }}>
                        {tx.outfit ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {tx.outfit.image ? (
                              <img
                                src={tx.outfit.image}
                                alt={tx.outfit.title}
                                style={{ width: 36, height: 44, borderRadius: 4, objectFit: 'cover', border: '1px solid #E2E8F0' }}
                              />
                            ) : (
                              <div style={{ width: 36, height: 44, borderRadius: 4, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                👗
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#0F172A', maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {tx.outfit.title}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748B' }}>{tx.outfit.category}</div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: 12 }}>Platform Treasury</span>
                        )}
                      </td>

                      {/* Col 5: Gross Value */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 14,
                            color: isInflow ? '#059669' : isRefund ? '#D97706' : '#2563EB',
                          }}
                        >
                          {isInflow ? '+' : '-'} {formatCurrency(tx.grossAmount)}
                        </div>
                        {tx.breakdown.securityDeposit && tx.type === 'RENTAL_PAYMENT' && (
                          <div style={{ fontSize: 10, color: '#64748B' }}>
                            Dep: {formatCurrency(tx.breakdown.securityDeposit)}
                          </div>
                        )}
                      </td>

                      {/* Col 6: Platform Net */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: tx.netPlatformRevenue > 0 ? '#B45309' : '#64748B' }}>
                          {tx.netPlatformRevenue > 0 ? formatCurrency(tx.netPlatformRevenue) : '—'}
                        </div>
                        {tx.netPlatformRevenue > 0 && (
                          <div style={{ fontSize: 10, color: '#B45309' }}>Commission</div>
                        )}
                      </td>

                      {/* Col 7: Gateway / Ref */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{tx.gateway.provider}</div>
                        <div
                          style={{
                            fontSize: 10.5,
                            fontFamily: 'monospace',
                            color: '#64748B',
                            maxWidth: 130,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={tx.gateway.paymentId || tx.gateway.refundId || tx.gateway.batchRef || tx.gateway.orderId || ''}
                        >
                          {tx.gateway.paymentId || tx.gateway.refundId || tx.gateway.batchRef || tx.gateway.orderId || '—'}
                        </div>
                      </td>

                      {/* Col 8: Status Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 4,
                            background:
                              tx.status === 'COMPLETED'
                                ? '#DCFCE7'
                                : tx.status === 'PENDING'
                                ? '#FEF3C7'
                                : tx.status === 'REFUNDED'
                                ? '#F1F5F9'
                                : '#FEE2E2',
                            color:
                              tx.status === 'COMPLETED'
                                ? '#15803D'
                                : tx.status === 'PENDING'
                                ? '#B45309'
                                : tx.status === 'REFUNDED'
                                ? '#475569'
                                : '#B91C1C',
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Col 9: Action button */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setActiveTxn(tx);
                            setShowRawJson(false);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#0F172A',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0F172A')}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {transactions.length > ITEMS_PER_PAGE && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Pagination
            currentPage={currentPage}
            totalItems={transactions.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          GRANULAR SINGLE TRANSACTION AUDIT DRAWER / MODAL
          ───────────────────────────────────────────────────────────────────────────── */}
      {activeTxn && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setActiveTxn(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 620,
              height: '100vh',
              background: '#FFFFFF',
              boxShadow: '-6px 0 30px rgba(0,0,0,0.2)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'adminContentIn 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '22px 28px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#090D16',
                color: '#FFFFFF',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#C5A880',
                      letterSpacing: '0.1em',
                      background: 'rgba(197, 168, 128, 0.15)',
                      padding: '2px 6px',
                      borderRadius: 3,
                    }}
                  >
                    AUDIT DOSSIER
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>{formatDate(activeTxn.createdAt)}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'monospace', color: '#F8FAFC' }}>
                  {activeTxn.id}
                </div>
              </div>

              <button
                onClick={() => setActiveTxn(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#FFFFFF',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body Content */}
            <div style={{ padding: '24px 28px', flex: 1 }}>
              {/* Top Summary Banner */}
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  padding: 18,
                  border: '1px solid #E2E8F0',
                  marginBottom: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Gross Transaction Amount
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                    {formatCurrency(activeTxn.grossAmount)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: activeTxn.status === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7',
                      color: activeTxn.status === 'COMPLETED' ? '#15803D' : '#B45309',
                      border: `1px solid ${activeTxn.status === 'COMPLETED' ? '#86EFAC' : '#FDE68A'}`,
                    }}
                  >
                    STATUS: {activeTxn.status}
                  </span>
                </div>
              </div>

              {/* 1. Itemized Financial Line Items Breakdown */}
              <div style={{ marginBottom: 26 }}>
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    margin: '0 0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ color: '#C5A880' }}>■</span> Detailed Financial Breakdown (Invoice)
                </h3>

                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    overflow: 'hidden',
                    fontSize: 13,
                  }}
                >
                  {activeTxn.breakdown.baseRent !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#475569' }}>Outfit Base Rental Amount:</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(activeTxn.breakdown.baseRent)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.securityDeposit !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#475569' }}>Security Deposit Component (Escrow):</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(activeTxn.breakdown.securityDeposit)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.extensionFee !== undefined && activeTxn.breakdown.extensionFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#475569' }}>Rental Extension Fee:</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(activeTxn.breakdown.extensionFee)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.latePenalty !== undefined && activeTxn.breakdown.latePenalty > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#EF4444' }}>Late Return Penalty:</span>
                      <span style={{ fontWeight: 600, color: '#EF4444' }}>{formatCurrency(activeTxn.breakdown.latePenalty)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.damageDeduction !== undefined && activeTxn.breakdown.damageDeduction > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9', background: '#FEF2F2' }}>
                      <span style={{ color: '#B91C1C', fontWeight: 600 }}>Damage Inspection Deduction:</span>
                      <span style={{ fontWeight: 700, color: '#B91C1C' }}>- {formatCurrency(activeTxn.breakdown.damageDeduction)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.platformCommission !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9', background: '#FFFBEB' }}>
                      <span style={{ color: '#B45309', fontWeight: 600 }}>Platform Commission (20% Cut):</span>
                      <span style={{ fontWeight: 700, color: '#B45309' }}>{formatCurrency(activeTxn.breakdown.platformCommission)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.netPayout !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9', background: '#EFF6FF' }}>
                      <span style={{ color: '#1E40AF', fontWeight: 700 }}>Net Disbursed to Lister:</span>
                      <span style={{ fontWeight: 800, color: '#1E40AF' }}>{formatCurrency(activeTxn.breakdown.netPayout)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.refundedAmount !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9', background: '#ECFDF5' }}>
                      <span style={{ color: '#047857', fontWeight: 700 }}>Net Refund to Renter:</span>
                      <span style={{ fontWeight: 800, color: '#047857' }}>{formatCurrency(activeTxn.breakdown.refundedAmount)}</span>
                    </div>
                  )}

                  {activeTxn.breakdown.registrationFee !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#475569' }}>Studio Verification & KYC Fee:</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatCurrency(activeTxn.breakdown.registrationFee)}</span>
                    </div>
                  )}

                  {/* Total row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#F8FAFC',
                      fontWeight: 800,
                      fontSize: 14,
                      color: '#0F172A',
                    }}
                  >
                    <span>Total Transaction Value:</span>
                    <span>{formatCurrency(activeTxn.grossAmount)}</span>
                  </div>
                </div>
              </div>

              {/* 2. Parties Involved Dossier */}
              <div style={{ marginBottom: 26 }}>
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    margin: '0 0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ color: '#C5A880' }}>■</span> Counterparty & Banking Dossier
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Payer Box */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                      PAYER ({activeTxn.payer.role})
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{activeTxn.payer.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{activeTxn.payer.email}</div>
                    {activeTxn.payer.phone && <div style={{ fontSize: 12, color: '#64748B' }}>📞 {activeTxn.payer.phone}</div>}
                    {activeTxn.payer.userId && (
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#94A3B8', marginTop: 4 }}>
                        User ID: {activeTxn.payer.userId}
                      </div>
                    )}
                  </div>

                  {/* Payee Box */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                      BENEFICIARY ({activeTxn.payee.role})
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {activeTxn.payee.shopName ? `${activeTxn.payee.shopName} (${activeTxn.payee.name})` : activeTxn.payee.name}
                    </div>
                    {activeTxn.payee.email && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{activeTxn.payee.email}</div>}
                    {activeTxn.payee.bankAccountNo && (
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#334155', marginTop: 4 }}>
                        🏦 Bank A/C: ••••{activeTxn.payee.bankAccountNo.slice(-4)}
                      </div>
                    )}
                    {activeTxn.payee.bankIfsc && (
                      <div style={{ fontSize: 11, color: '#64748B' }}>IFSC: {activeTxn.payee.bankIfsc}</div>
                    )}
                    {activeTxn.payee.panNumber && (
                      <div style={{ fontSize: 11, color: '#64748B' }}>PAN: {activeTxn.payee.panNumber}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Related Outfit & Booking Context */}
              {activeTxn.outfit && (
                <div style={{ marginBottom: 26 }}>
                  <h3
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#64748B',
                      margin: '0 0 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ color: '#C5A880' }}>■</span> Outfit & Booking Record
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    {activeTxn.outfit.image && (
                      <img
                        src={activeTxn.outfit.image}
                        alt={activeTxn.outfit.title}
                        style={{ width: 68, height: 88, borderRadius: 8, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#C5A880',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {activeTxn.outfit.category}
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                        {activeTxn.outfit.title}
                      </div>

                      {activeTxn.booking && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                          <div>
                            <strong>Rental Duration:</strong> {formatDate(activeTxn.booking.startDate)} →{' '}
                            {formatDate(activeTxn.booking.endDate)}
                          </div>
                          {activeTxn.booking.actualReturnDate && (
                            <div style={{ color: '#059669', marginTop: 2 }}>
                              <strong>Returned On:</strong> {formatDate(activeTxn.booking.actualReturnDate)}
                            </div>
                          )}
                          <div style={{ marginTop: 4 }}>
                            <strong>Booking Status:</strong>{' '}
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{activeTxn.booking.status}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Payment Gateway & Technical Audit Trail */}
              <div style={{ marginBottom: 26 }}>
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    margin: '0 0 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ color: '#C5A880' }}>■</span> Payment Gateway & Audit References
                </h3>

                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B' }}>Payment Gateway:</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{activeTxn.gateway.provider}</span>
                  </div>

                  {activeTxn.gateway.orderId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Razorpay Order ID:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 11 }}>
                          {activeTxn.gateway.orderId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(activeTxn.gateway.orderId!, 'Order ID copied!')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                          title="Copy"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTxn.gateway.paymentId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Razorpay Payment ID:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 11 }}>
                          {activeTxn.gateway.paymentId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(activeTxn.gateway.paymentId!, 'Payment ID copied!')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                          title="Copy"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTxn.gateway.refundId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Gateway Refund ID:</span>
                      <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 11 }}>
                        {activeTxn.gateway.refundId}
                      </code>
                    </div>
                  )}

                  {activeTxn.gateway.batchRef && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Bank Disbursal Batch Ref:</span>
                      <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 11 }}>
                        {activeTxn.gateway.batchRef}
                      </code>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ color: '#64748B' }}>Database Timestamp:</span>
                    <span style={{ color: '#0F172A', fontFamily: 'monospace', fontSize: 11 }}>{activeTxn.createdAt}</span>
                  </div>
                </div>

                {copySuccess && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                    ✓ {copySuccess}
                  </div>
                )}
              </div>

              {/* 5. Raw JSON Payload Inspection Toggle */}
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  style={{
                    background: 'none',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  {showRawJson ? 'Hide Raw Audit Payload ▲' : 'View Full Raw JSON Payload ▼'}
                </button>

                {showRawJson && (
                  <pre
                    style={{
                      background: '#090D16',
                      color: '#38BDF8',
                      padding: 14,
                      borderRadius: 8,
                      fontSize: 11,
                      overflowX: 'auto',
                      marginTop: 10,
                      maxHeight: 240,
                    }}
                  >
                    {JSON.stringify(activeTxn, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: '16px 28px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Wardrob Verified Audit ID: <strong>{activeTxn.id}</strong>
              </div>
              <button
                onClick={() => setActiveTxn(null)}
                style={{
                  padding: '8px 18px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Audit Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
