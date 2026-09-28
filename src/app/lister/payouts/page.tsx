'use client';

import { useState, useEffect } from 'react';
import './lister-payouts.css';

type BookingInfo = {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  extensionFee?: string;
  listing: {
    title: string;
    category: string;
    baselineImages: string[];
  };
  renter: {
    name: string;
  };
  damageReports?: {
    id?: string;
    inspectionType?: string;
    grade?: string;
    deductionAmount?: number | string;
    dispute?: { status: string } | null;
  }[];
};

type Payout = {
  id: string;
  amount: string;
  commissionPaid: string;
  status: 'PENDING' | 'COMPLETED';
  batchRef: string | null;
  walletBalanceIncluded?: string | number;
  createdAt: string;
  booking: BookingInfo;
};

type Stats = {
  totalSettled: number;
  totalPending: number;
  totalRevenue: number;
  escrowAmount: number;
};

type BankDetails = {
  bankAccountNo: string;
  bankIfsc: string;
};

export default function ListerPayoutsPage() {
  const [stats, setStats] = useState<Stats>({
    totalSettled: 0,
    totalPending: 0,
    totalRevenue: 0,
    escrowAmount: 0,
  });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankAccountNo: '',
    bankIfsc: '',
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchPayoutsData = async () => {
    try {
      const res = await fetch('/api/lister/payouts');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats({
          totalSettled: data.stats.totalSettled || 0,
          totalPending: data.stats.totalPending || 0,
          totalRevenue: (data.stats.totalSettled || 0) + (data.stats.totalPending || 0),
          escrowAmount: 0,
        });
        if (data.bankDetails) setBankDetails(data.bankDetails);
        setPayouts(data.payouts || []);
      } else {
        setError(data.error || 'Failed to load financial records.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  const totalPages = Math.ceil(payouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts = payouts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, payouts.length);

  return (
    <>
      {/* Header */}
      <div className="wl-header">
        <div>
          <h1 className="wl-h1">Bank Settlements</h1>
          <div className="wl-subtitle">Track your cleared and pending deposits</div>
        </div>
      </div>

      <div className="extension-note">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>Important note on Extension Fees:</strong> Whenever a renter pays to extend a booking, the extra extension fee is <strong>split equally (50%)</strong> between you and the Wardrob platform. This split rate is separate from your standard rental commission.
        </div>
      </div>

      {/* Alert banner */}
      {error && (
        <div style={{ padding: '0 0 20px 0', animation: 'payoutsFadeUp 0.3s ease both' }}>
          <div style={{ padding: '14px 18px', borderRadius: 12, background: '#FFF5F5', border: '1px solid #FEB2B2', color: '#C53030', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠</span>{error}
          </div>
        </div>
      )}

      {/* Top dashboard section */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #DDE4DF', borderTopColor: '#2C5E43', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="payouts-card">
              <div className="w-icon-circle" style={{ background: '#EEF2EF', color: '#2C5E43' }}>💼</div>
              <div>
                <div className="w-val">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
                <div className="w-lbl">Net Revenue Earned</div>
              </div>
            </div>

            <div className="payouts-card">
              <div className="w-icon-circle" style={{ background: '#ECFDF5', color: '#10B981' }}>✅</div>
              <div>
                <div className="w-val">₹{stats.totalSettled.toLocaleString('en-IN')}</div>
                <div className="w-lbl">Settled to Bank</div>
              </div>
            </div>

            <div className="payouts-card">
              <div className="w-icon-circle" style={{ background: '#FFFBEB', color: '#F59E0B' }}>⏳</div>
              <div>
                <div className="w-val">₹{stats.totalPending.toLocaleString('en-IN')}</div>
                <div className="w-lbl">Pending Manual Settlement</div>
              </div>
            </div>
          </div>

          {/* Settlements ledger */}
          <h2 className="ledger-section-title">Settlement Logs</h2>
          {payouts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">💸</div>
              <h3 className="empty-title">No settlements processed</h3>
              <p className="empty-desc">Payout receipts will appear here once payouts are initialized by WARDROB administrators.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <div className="ledger-head">
                <span>Batch Reference</span>
                <span>Date Init</span>
                <span>Net Transfer</span>
                <span>Platform Commission</span>
                <span>Payout Status</span>
                <span>Breakdown</span>
              </div>

              {paginatedPayouts.map((p) => {
                const isExpanded = expandedId === p.id;
                const isCompleted = p.status === 'COMPLETED';
                const hasOpenDispute = p.booking?.damageReports?.some(dr => dr.dispute?.status === 'OPEN');

                const statusPill = hasOpenDispute ? (
                  <span 
                    className="status-pill" 
                    style={{ background: '#FEF2F2', color: '#991B1B', borderColor: '#FCA5A5' }}
                  >
                    <span className="status-dot" style={{ background: '#EF4444' }} />
                    ON HOLD
                  </span>
                ) : (
                  <span 
                    className="status-pill" 
                    style={{
                      background: isCompleted ? '#ECFDF5' : '#FFFBEB',
                      color: isCompleted ? '#065F46' : '#92400E',
                      borderColor: isCompleted ? '#6EE7B7' : '#FCD34D',
                    }}
                  >
                    <span 
                      className="status-dot" 
                      style={{ background: isCompleted ? '#10B981' : '#F59E0B' }} 
                    />
                    {p.status}
                  </span>
                );

                return (
                  <div key={p.id} className="ledger-row-wrap">
                    <div className="ledger-row" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                      <div className="ledger-col-id">
                        <span className="ledger-id-txt" style={{ fontFamily: 'monospace' }}>
                          {p.batchRef || `BATCH-${p.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <div className="ledger-mobile-status">
                          {statusPill}
                        </div>
                      </div>

                      <div className="ledger-col-date">
                        <span className="ledger-mobile-lbl">Initiated On</span>
                        <span className="ledger-date-txt">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="ledger-col-amt">
                        <span className="ledger-mobile-lbl">Net Transfer</span>
                        <span className="ledger-amt-txt">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="ledger-col-com">
                        <span className="ledger-mobile-lbl">Commission</span>
                        <span className="ledger-com-txt" style={{ color: '#DC2626' }}>
                          -₹{Number(p.commissionPaid).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="ledger-col-status">
                        {statusPill}
                      </div>

                      <div className="ledger-col-toggle">
                        <span className="ledger-view-label">{isExpanded ? 'Hide Breakdown' : 'View Breakdown'}</span>
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#2C5E43" strokeWidth="2.5"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                        >
                          <path d="M6 9L12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && p.booking && (() => {
                      const grossRent = Number(p.booking.rentAmount || 0);
                      const totalComm = Number(p.commissionPaid || 0);
                      const extFeeTotal = Number(p.booking.extensionFee || 0);
                      const listerExtShare = Math.round(extFeeTotal * 0.50);
                      const adminExtComm = Math.round(extFeeTotal * 0.50);
                      const adminRentComm = Math.max(0, totalComm - adminExtComm);
                      const listerBaseRent = Math.max(0, grossRent - adminRentComm);
                      const walletBonus = Number(p.walletBalanceIncluded || 0);

                      // Calculate Damage Compensation
                      let damageComp = (p.booking.damageReports || [])
                        .filter(d => d.inspectionType === 'POST_RETURN' || Number(d.deductionAmount) > 0)
                        .reduce((sum, d) => sum + Number(d.deductionAmount || 0), 0);

                      // Fallback if compensation was directly credited into payout amount
                      const expectedBaseTotal = listerBaseRent + listerExtShare + walletBonus;
                      if (damageComp === 0 && Number(p.amount) > expectedBaseTotal) {
                        damageComp = Number(p.amount) - expectedBaseTotal;
                      }

                      return (
                        <div className="settlement-receipt-card">
                          <div className="receipt-header-row">
                            <h4 className="receipt-badge-title">
                              Boutique Settlement Receipt
                            </h4>
                            <span className="receipt-ref-code">
                              Ref: {p.batchRef || `SETTLE-${p.id.slice(0, 8).toUpperCase()}`}
                            </span>
                          </div>
                          
                          <div className="receipt-item-preview">
                            <div className="receipt-item-thumb">
                              <img src={p.booking.listing.baselineImages?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=150'} alt="" />
                            </div>
                            <div className="receipt-item-meta">
                              <strong className="receipt-item-name">{p.booking.listing.title}</strong>
                              <span className="receipt-renter-name">Rented by: {p.booking.renter.name}</span>
                              <div className="receipt-duration-txt">
                                Duration: {new Date(p.booking.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {new Date(p.booking.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          </div>

                          <div className="receipt-lines-wrap">
                            <div className="receipt-line-row">
                              <span className="lbl">Gross Rent Earned</span>
                              <span className="val" style={{ fontWeight: 600 }}>₹{grossRent.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="receipt-line-row" style={{ color: '#DC2626' }}>
                              <span className="lbl">Platform Commission (35% · min ₹2k floor)</span>
                              <span className="val">-₹{adminRentComm.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="receipt-base-share-row">
                              <span>Base Rent Share (Lister 65%)</span>
                              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>₹{listerBaseRent.toLocaleString('en-IN')}</span>
                            </div>

                            {extFeeTotal > 0 && (
                              <div className="receipt-line-row" style={{ color: '#059669' }}>
                                <span className="lbl">Rental Extension Share (50% of ₹{extFeeTotal.toLocaleString('en-IN')})</span>
                                <span className="val" style={{ fontWeight: 700 }}>+₹{listerExtShare.toLocaleString('en-IN')}</span>
                              </div>
                            )}

                            {damageComp > 0 && (
                              <div className="receipt-highlight-pill" style={{ color: '#D97706', background: 'rgba(217, 119, 6, 0.08)' }}>
                                <span>🛡️ Damage / Assessment Compensation (100% to Lister)</span>
                                <span style={{ fontWeight: 700 }}>+₹{damageComp.toLocaleString('en-IN')}</span>
                              </div>
                            )}

                            {walletBonus > 0 && (
                              <div className="receipt-highlight-pill" style={{ color: '#059669', background: 'rgba(5, 150, 105, 0.08)' }}>
                                <span>💰 Wallet Credit (Clubbed)</span>
                                <span style={{ fontWeight: 700 }}>+₹{walletBonus.toLocaleString('en-IN')}</span>
                              </div>
                            )}

                            <div className="receipt-deposit-total">
                              <span>Net Bank Deposit</span>
                              <span className="receipt-deposit-val">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="receipt-bank-footer">
                              Settled via IMPS to Account: *******{bankDetails.bankAccountNo.slice(-4) || 'XXXX'} | IFSC: {bankDetails.bankIfsc || 'N/A'}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-bar">
                  <div>
                    Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{payouts.length}</strong> settlements
                  </div>
                  <div className="pagination-buttons">
                    <button 
                      className="pagination-btn" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      ◀
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pNum = idx + 1;
                      return (
                        <button 
                          key={pNum} 
                          className={`pagination-btn${currentPage === pNum ? ' active' : ''}`}
                          onClick={() => setCurrentPage(pNum)}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                    <button 
                      className="pagination-btn" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
