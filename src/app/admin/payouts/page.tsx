'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import './admin-payouts.css';

interface PayoutItem {
  id: string;
  amount: string;
  commissionPaid: string;
  status: 'PENDING' | 'COMPLETED';
  batchRef: string | null;
  createdAt: string;
  lister: {
    shopName: string | null;
    bankAccountNo: string | null;
    bankIfsc: string | null;
    panNumber: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      walletBalance: string | number;
    };
  };
  walletBalanceIncluded?: string | number;
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    extensionFee?: string | number;
    listing: {
      title: string;
      category: string;
      baselineImages: string[];
    };
    renter: {
      name: string;
      email: string;
    };
    damageReports?: {
      id: string;
      inspectionType?: string;
      deductionAmount?: string | number;
      dispute?: {
        id: string;
        status: string;
      } | null;
    }[];
  };
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<PayoutItem | null>(null);
  const [batchRefInput, setBatchRefInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const url = filter === 'ALL' ? '/api/admin/payouts' : `/api/admin/payouts?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [filter]);

  const handleMarkAsPaid = async () => {
    if (!activeModal) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: activeModal.id,
          status: 'COMPLETED',
          batchRef: batchRefInput.trim() || 'MANUAL-UPI-TRANSFER',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Payout marked as PAID successfully!', type: 'success' });
        setActiveModal(null);
        setBatchRefInput('');
        fetchPayouts();
      } else {
        setToast({ message: data.error || 'Failed to update payout', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error occurred', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPayoutBreakdown = (p: PayoutItem) => {
    const rentAmt = Number(p.booking.rentAmount || 0);
    const comm = Number(p.commissionPaid || 0);
    const extFee = Number(p.booking.extensionFee || 0);
    const extShare = Math.round(extFee * 0.50);
    const listerBase = Math.max(0, rentAmt - (comm - extShare));
    const walletInc = Number(p.walletBalanceIncluded || 0);
    let damageComp = (p.booking.damageReports || [])
      .filter(dr => dr.inspectionType === 'POST_RETURN' || Number(dr.deductionAmount) > 0)
      .reduce((sum, dr) => sum + Number(dr.deductionAmount || 0), 0);
    if (damageComp === 0 && Number(p.amount) > (listerBase + extShare + walletInc)) {
      damageComp = Number(p.amount) - (listerBase + extShare + walletInc);
    }
    const isOnHold = p.status === 'PENDING' && p.booking.damageReports?.some(dr => dr.dispute?.status === 'OPEN');
    const clubbedWallet = p.status === 'PENDING' ? Number(p.lister.user.walletBalance || 0) : walletInc;
    const totalRequired = Number(p.amount) + (p.status === 'PENDING' ? clubbedWallet : 0);

    return {
      rentAmt,
      comm,
      extFee,
      extShare,
      listerBase,
      walletInc,
      damageComp,
      isOnHold,
      clubbedWallet,
      totalRequired,
      netPayable: Number(p.amount),
    };
  };

  const pendingCount = payouts.filter((p) => p.status === 'PENDING').length;
  const completedCount = payouts.filter((p) => p.status === 'COMPLETED').length;

  const pendingTotal = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const completedTotal = payouts
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const filteredPayouts = useMemo(() => {
    let list = payouts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.lister.user.name.toLowerCase().includes(q) ||
        (p.lister.shopName && p.lister.shopName.toLowerCase().includes(q)) ||
        (p.lister.user.phone && p.lister.user.phone.includes(q)) ||
        (p.lister.bankAccountNo && p.lister.bankAccountNo.includes(q)) ||
        p.booking.id.toLowerCase().includes(q) ||
        p.booking.listing.title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [payouts, searchQuery]);

  const paginatedPayouts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayouts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayouts, currentPage]);

  return (
    <div className="adm-payouts-page">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === 'success' ? '#10B981' : '#EF4444',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          {toast.message}
        </div>
      )}

      {/* Entity Separation Switcher Tabs */}
      <div className="adm-entity-nav-tabs">
        <Link href="/admin/refunds" className="adm-entity-tab">
          <span className="adm-entity-tab-icon">🧑‍💼</span>
          <div className="adm-entity-tab-info">
            <span className="adm-entity-tab-title">Renter Security Refunds</span>
            <span className="adm-entity-tab-sub">Customer security deposit returns (Razorpay / Wallet)</span>
          </div>
          <span className="adm-entity-tab-tag renter">Switch to Renter ↗</span>
        </Link>
        <Link href="/admin/payouts" className="adm-entity-tab active">
          <span className="adm-entity-tab-icon">👗</span>
          <div className="adm-entity-tab-info">
            <span className="adm-entity-tab-title">Lister Rental Payouts</span>
            <span className="adm-entity-tab-sub">Owner rental earnings & damage compensation (Bank / UPI)</span>
          </div>
          <span className="adm-entity-tab-tag lister">Lister Desk (Active)</span>
        </Link>
      </div>

      {/* Desk Clarification Banner */}
      <div className="adm-entity-desk-banner lister">
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <div>
          <strong>Lister Payout Desk:</strong> Yeh desk sirf garment owners (Listers) ko unka <strong>Rent Share</strong> aur <strong>Damage Compensation</strong> transfer karne ke liye hai (Bank/UPI manual transfer). Renters ki security deposit wapas return karne ke liye upar <strong>Renter Security Refunds</strong> tab par click karein.
        </div>
      </div>

      {/* Header */}
      <div className="adm-payouts-header">
        <div className="adm-payouts-title-group">
          <h1>
            <span>Lister Payouts & Settlement</span>
          </h1>
          <p>
            Manual settlement queue: Transfer net rent to lister via Bank/UPI and mark as complete.
          </p>
        </div>
        <button
          onClick={fetchPayouts}
          className="adm-refresh-btn"
        >
          <span style={{ display: 'inline-block', transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }}>🔄</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="adm-metrics-grid">
        <div className="adm-metric-card pending">
          <div className="adm-metric-top">
            <span className="adm-metric-label">
              <span>⏳</span> Pending Settlement
            </span>
            <div className="adm-metric-icon-badge">₹</div>
          </div>
          <div className="adm-metric-value">
            ₹{pendingTotal.toLocaleString('en-IN')}
          </div>
          <div className="adm-metric-footer">
            <strong style={{ color: '#D97706' }}>{pendingCount} payouts</strong> awaiting manual transfer
          </div>
        </div>

        <div className="adm-metric-card completed">
          <div className="adm-metric-top">
            <span className="adm-metric-label">
              <span>✅</span> Completed Payouts
            </span>
            <div className="adm-metric-icon-badge">✓</div>
          </div>
          <div className="adm-metric-value">
            ₹{completedTotal.toLocaleString('en-IN')}
          </div>
          <div className="adm-metric-footer">
            <strong style={{ color: '#059669' }}>{completedCount} settled</strong> to listers
          </div>
        </div>

        <div className="adm-metric-card total">
          <div className="adm-metric-top">
            <span className="adm-metric-label">
              <span>💼</span> Total Settled Volume
            </span>
            <div className="adm-metric-icon-badge">∑</div>
          </div>
          <div className="adm-metric-value">
            ₹{(pendingTotal + completedTotal).toLocaleString('en-IN')}
          </div>
          <div className="adm-metric-footer">
            <span>{payouts.length} total transactions logged</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter Tabs & Search */}
      <div className="adm-control-bar">
        <div className="adm-filter-tabs">
          <button
            onClick={() => { setFilter('ALL'); setCurrentPage(1); }}
            className={`adm-tab-pill ${filter === 'ALL' ? 'active' : ''}`}
          >
            All Payouts
            <span className="adm-tab-pill-badge">{payouts.length}</span>
          </button>
          <button
            onClick={() => { setFilter('PENDING'); setCurrentPage(1); }}
            className={`adm-tab-pill ${filter === 'PENDING' ? 'active' : ''}`}
          >
            ⏳ Pending Manual Action
            <span className="adm-tab-pill-badge">{pendingCount}</span>
          </button>
          <button
            onClick={() => { setFilter('COMPLETED'); setCurrentPage(1); }}
            className={`adm-tab-pill ${filter === 'COMPLETED' ? 'active' : ''}`}
          >
            ✅ Completed
            <span className="adm-tab-pill-badge">{completedCount}</span>
          </button>
        </div>

        <div className="adm-search-input-wrap">
          <span className="adm-search-icon">🔍</span>
          <input
            type="text"
            className="adm-search-input"
            placeholder="Search lister, phone, booking..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Content Container: Desktop Table & Mobile Cards */}
      <div className="adm-table-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B', fontSize: 14, fontWeight: 500 }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: '3px solid #E2E8F0',
                borderTopColor: '#0F172A',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
                marginRight: 10,
                verticalAlign: 'middle',
              }}
            />
            Loading payouts...
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontSize: 15, fontWeight: 500 }}>
            No payouts found {searchQuery ? 'matching your search' : 'in this view'}.
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW (> 960px) */}
            <div className="adm-desktop-table-container">
              <table className="adm-payouts-table">
                <thead>
                  <tr>
                    <th style={{ width: '18%' }}>Lister Details</th>
                    <th style={{ width: '18%' }}>Bank Account / IFSC</th>
                    <th style={{ width: '18%' }}>Rental Item</th>
                    <th style={{ width: '10%' }}>Gross Rent</th>
                    <th style={{ width: '10%' }}>Commission</th>
                    <th style={{ width: '14%' }}>Net Payable</th>
                    <th style={{ width: '12%' }}>Status</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayouts.map((p) => {
                    const b = getPayoutBreakdown(p);
                    return (
                      <tr key={p.id} className={b.isOnHold ? 'on-hold' : ''}>
                        {/* Lister Details */}
                        <td className="adm-lister-cell">
                          <div className="adm-lister-name">{p.lister.user.name}</div>
                          <div className="adm-lister-shop">
                            {p.lister.shopName ? `Shop: ${p.lister.shopName}` : p.lister.user.email}
                          </div>
                          {p.lister.user.phone && (
                            <div className="adm-lister-phone">
                              <span>📞 {p.lister.user.phone}</span>
                              <button
                                className="adm-copy-btn"
                                onClick={() => copyToClipboard(p.lister.user.phone || '', `ph-${p.id}`)}
                                title="Copy Phone / UPI"
                              >
                                {copiedId === `ph-${p.id}` ? '✓' : '⧉'}
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Bank Account / IFSC */}
                        <td>
                          {p.lister.bankAccountNo ? (
                            <div className="adm-bank-box">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <div className="adm-bank-ac">A/C: {p.lister.bankAccountNo}</div>
                                <button
                                  className="adm-copy-btn"
                                  onClick={() => copyToClipboard(p.lister.bankAccountNo || '', `ac-${p.id}`)}
                                  title="Copy Account Number"
                                >
                                  {copiedId === `ac-${p.id}` ? '✓' : '⧉'}
                                </button>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
                                <div className="adm-bank-ifsc">IFSC: {p.lister.bankIfsc}</div>
                                <button
                                  className="adm-copy-btn"
                                  onClick={() => copyToClipboard(p.lister.bankIfsc || '', `ifsc-${p.id}`)}
                                  title="Copy IFSC"
                                >
                                  {copiedId === `ifsc-${p.id}` ? '✓' : '⧉'}
                                </button>
                              </div>
                              {p.lister.panNumber && (
                                <div className="adm-bank-pan">PAN: {p.lister.panNumber}</div>
                              )}
                            </div>
                          ) : (
                            <span className="adm-bank-missing">
                              ⚠️ Bank details missing
                            </span>
                          )}
                        </td>

                        {/* Rental Item */}
                        <td className="adm-garment-cell">
                          <div className="adm-garment-title">{p.booking.listing.title}</div>
                          <div className="adm-booking-id-pill">
                            ID: {p.booking.id.slice(0, 8)}...
                          </div>
                        </td>

                        {/* Gross Rent */}
                        <td>
                          <span className="adm-gross-val">
                            ₹{b.rentAmt.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Commission */}
                        <td>
                          <span className="adm-comm-val">
                            -₹{b.comm.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Net Payable */}
                        <td>
                          <div className="adm-net-val">
                            ₹{b.netPayable.toLocaleString('en-IN')}
                          </div>
                          {b.damageComp > 0 && (
                            <div className="adm-comp-badge">
                              🛡️ +₹{b.damageComp.toLocaleString('en-IN')} Damage
                            </div>
                          )}
                          {b.extShare > 0 && (
                            <div className="adm-ext-badge">
                              ⏱️ +₹{b.extShare.toLocaleString('en-IN')} Ext.
                            </div>
                          )}
                          {b.walletInc > 0 && (
                            <div className="adm-wallet-badge">
                              👛 +₹{b.walletInc.toLocaleString('en-IN')} Wallet
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          {p.status === 'PENDING' ? (
                            <span className={`adm-status-badge ${b.isOnHold ? 'on-hold' : 'pending'}`}>
                              {b.isOnHold ? '⚠️ ON HOLD' : '⏳ PENDING'}
                            </span>
                          ) : (
                            <div>
                              <span className="adm-status-badge paid">
                                ✅ PAID
                              </span>
                              {p.batchRef && (
                                <div className="adm-batch-ref">
                                  Ref: {p.batchRef}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          {p.status === 'PENDING' ? (
                            b.isOnHold ? (
                              <div className="adm-hold-alert-tag">
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#991B1B' }}>DISPUTE ACTIVE</span>
                                <span style={{ fontSize: 10, color: '#DC2626' }}>Inspection review</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveModal(p);
                                  setBatchRefInput('');
                                }}
                                className="adm-action-btn"
                              >
                                Mark as Paid
                              </button>
                            )
                          ) : (
                            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                              ✓ Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE & TABLET CARDS VIEW (<= 960px) */}
            <div className="adm-mobile-cards-view">
              {paginatedPayouts.map((p) => {
                const b = getPayoutBreakdown(p);
                return (
                  <div
                    key={`mob-${p.id}`}
                    className={`adm-payout-card-mobile ${b.isOnHold ? 'on-hold' : ''}`}
                  >
                    {/* Header: Lister & Status */}
                    <div className="adm-mob-header">
                      <div>
                        <div className="adm-mob-lister-title">{p.lister.user.name}</div>
                        <div className="adm-mob-shop-tag">
                          {p.lister.shopName ? `Shop: ${p.lister.shopName}` : p.lister.user.email}
                        </div>
                        {p.lister.user.phone && (
                          <div className="adm-mob-phone-tag">
                            <span>📞 {p.lister.user.phone}</span>
                            <button
                              className="adm-copy-btn"
                              onClick={() => copyToClipboard(p.lister.user.phone || '', `mob-ph-${p.id}`)}
                            >
                              {copiedId === `mob-ph-${p.id}` ? '✓ Copied' : '⧉ Copy'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        {p.status === 'PENDING' ? (
                          <span className={`adm-status-badge ${b.isOnHold ? 'on-hold' : 'pending'}`}>
                            {b.isOnHold ? '⚠️ ON HOLD' : '⏳ PENDING'}
                          </span>
                        ) : (
                          <span className="adm-status-badge paid">
                            ✅ PAID
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Garment Title & Booking ID */}
                    <div className="adm-mob-garment-box">
                      <div className="adm-mob-garment-title">{p.booking.listing.title}</div>
                      <div className="adm-mob-booking-id">#{p.booking.id.slice(0, 8)}</div>
                    </div>

                    {/* Bank / UPI Box */}
                    {p.lister.bankAccountNo ? (
                      <div className="adm-mob-bank-box">
                        <div className="adm-mob-bank-row">
                          <span className="adm-mob-bank-lbl">Account No:</span>
                          <span className="adm-mob-bank-val">
                            {p.lister.bankAccountNo}
                            <button
                              className="adm-copy-btn"
                              onClick={() => copyToClipboard(p.lister.bankAccountNo || '', `mob-ac-${p.id}`)}
                            >
                              {copiedId === `mob-ac-${p.id}` ? '✓' : '⧉'}
                            </button>
                          </span>
                        </div>
                        <div className="adm-mob-bank-row">
                          <span className="adm-mob-bank-lbl">IFSC Code:</span>
                          <span className="adm-mob-bank-val">
                            {p.lister.bankIfsc}
                            <button
                              className="adm-copy-btn"
                              onClick={() => copyToClipboard(p.lister.bankIfsc || '', `mob-ifsc-${p.id}`)}
                            >
                              {copiedId === `mob-ifsc-${p.id}` ? '✓' : '⧉'}
                            </button>
                          </span>
                        </div>
                        {p.lister.panNumber && (
                          <div className="adm-mob-bank-row">
                            <span className="adm-mob-bank-lbl">PAN:</span>
                            <span className="adm-mob-bank-val">{p.lister.panNumber}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="adm-bank-missing" style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}>
                        ⚠️ Bank details missing — request details before payout
                      </div>
                    )}

                    {/* 3-Column Financial Breakdown */}
                    <div className="adm-mob-fin-grid">
                      <div className="adm-mob-fin-item">
                        <span className="adm-mob-fin-lbl">Gross Rent</span>
                        <span className="adm-mob-fin-val gross">₹{b.rentAmt.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="adm-mob-fin-item">
                        <span className="adm-mob-fin-lbl">Commission</span>
                        <span className="adm-mob-fin-val comm">-₹{b.comm.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="adm-mob-fin-item">
                        <span className="adm-mob-fin-lbl">Net Payable</span>
                        <span className="adm-mob-fin-val net">₹{b.netPayable.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Adjustments Badges */}
                    {(b.damageComp > 0 || b.extShare > 0 || b.walletInc > 0) && (
                      <div className="adm-mob-badges-row">
                        {b.damageComp > 0 && (
                          <div className="adm-comp-badge">
                            🛡️ +₹{b.damageComp.toLocaleString('en-IN')} Damage Compensation
                          </div>
                        )}
                        {b.extShare > 0 && (
                          <div className="adm-ext-badge">
                            ⏱️ +₹{b.extShare.toLocaleString('en-IN')} Extension (50%)
                          </div>
                        )}
                        {b.walletInc > 0 && (
                          <div className="adm-wallet-badge">
                            👛 +₹{b.walletInc.toLocaleString('en-IN')} Wallet Credit
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mobile Card Action */}
                    <div className="adm-mob-action-wrap">
                      {p.status === 'PENDING' ? (
                        b.isOnHold ? (
                          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                            ⚠️ Settlement On Hold — Dispute Active in Hub
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveModal(p);
                              setBatchRefInput('');
                            }}
                            className="adm-mob-pay-btn"
                          >
                            <span>Mark as Paid</span>
                            <span>→</span>
                          </button>
                        )
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#166534' }}>
                          <span style={{ fontWeight: 700 }}>✓ Settled to Lister</span>
                          {p.batchRef && <span style={{ fontFamily: 'monospace' }}>Ref: {p.batchRef}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredPayouts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal for Mark as Paid (Responsive) */}
      {activeModal && (
        <div
          className="adm-modal-overlay"
          onClick={() => !submitting && setActiveModal(null)}
        >
          <div
            className="adm-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adm-modal-header">
              <h3 className="adm-modal-title">Confirm Manual Transfer</h3>
              <button
                type="button"
                className="adm-modal-close-btn"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
              >
                ✕
              </button>
            </div>

            {(() => {
              const b = getPayoutBreakdown(activeModal);

              return (
                <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#64748B' }}>
                    <span>Gross Rent:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>₹{b.rentAmt.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#DC2626' }}>
                    <span>Platform Commission (35% · min ₹2k):</span>
                    <span style={{ fontWeight: 600 }}>-₹{(b.comm - b.extShare).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#64748B', paddingLeft: 8, borderLeft: '2px solid #CBD5E1' }}>
                    <span>Base Rent Share (Lister 65%):</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>₹{b.listerBase.toLocaleString('en-IN')}</span>
                  </div>
                  {b.extShare > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#2563EB' }}>
                      <span>Extension Share (50%):</span>
                      <span style={{ fontWeight: 600 }}>+₹{b.extShare.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {b.damageComp > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#D97706', background: 'rgba(217, 119, 6, 0.08)', padding: '4px 8px', borderRadius: 4 }}>
                      <span>Damage Assessment Compensation (100%):</span>
                      <span style={{ fontWeight: 700 }}>+₹{b.damageComp.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {b.clubbedWallet > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#059669', background: 'rgba(5, 150, 105, 0.08)', padding: '4px 8px', borderRadius: 4 }}>
                      <span>Wallet Balance (Clubbed):</span>
                      <span style={{ fontWeight: 700 }}>+₹{b.clubbedWallet.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid #CBD5E1', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    <span>Total Transfer Required:</span>
                    <span style={{ color: '#059669' }}>₹{b.totalRequired.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })()}

            <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 14px' }}>
              Please verify you have transferred the <strong>Total Transfer Required</strong> amount to{' '}
              <strong style={{ color: '#0F172A' }}>{activeModal.lister.user.name}</strong> via Bank Transfer or UPI.
            </p>

            {/* Bank details card with click-to-copy */}
            <div
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: 14,
                marginBottom: 16,
                fontSize: 12.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>Account Number:</strong> {activeModal.lister.bankAccountNo || 'N/A'}</div>
                {activeModal.lister.bankAccountNo && (
                  <button
                    type="button"
                    className="adm-copy-btn"
                    onClick={() => copyToClipboard(activeModal.lister.bankAccountNo || '', 'modal-ac')}
                  >
                    {copiedId === 'modal-ac' ? '✓ Copied' : '⧉ Copy'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div><strong>IFSC Code:</strong> {activeModal.lister.bankIfsc || 'N/A'}</div>
                {activeModal.lister.bankIfsc && (
                  <button
                    type="button"
                    className="adm-copy-btn"
                    onClick={() => copyToClipboard(activeModal.lister.bankIfsc || '', 'modal-ifsc')}
                  >
                    {copiedId === 'modal-ifsc' ? '✓ Copied' : '⧉ Copy'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <div><strong>Lister Phone / UPI:</strong> {activeModal.lister.user.phone || 'N/A'}</div>
                {activeModal.lister.user.phone && (
                  <button
                    type="button"
                    className="adm-copy-btn"
                    onClick={() => copyToClipboard(activeModal.lister.user.phone || '', 'modal-ph')}
                  >
                    {copiedId === 'modal-ph' ? '✓ Copied' : '⧉ Copy'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Transaction Ref / UPI UTR Number (Optional)
              </label>
              <input
                type="text"
                value={batchRefInput}
                onChange={(e) => setBatchRefInput(e.target.value)}
                placeholder="e.g. UPI/423187219837 or IMPS-129381"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
                style={{
                  padding: '10px 18px',
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkAsPaid}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  background: '#059669',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#FFF',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                }}
              >
                {submitting ? 'Updating...' : 'Confirm & Mark Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
