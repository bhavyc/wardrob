'use client';

import { useState, useEffect } from 'react';

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
    dispute?: { status: string } | null;
  }[];
};

type Payout = {
  id: string;
  amount: string;
  commissionPaid: string;
  status: 'PENDING' | 'COMPLETED';
  batchRef: string | null;
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

  const [referralInfo, setReferralInfo] = useState<{
    code: string;
    count: number;
    walletBalance: number;
  }>({ code: '', count: 0, walletBalance: 0 });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchPayoutsData = async () => {
    try {
      const [res, profRes] = await Promise.all([
        fetch('/api/lister/payouts'),
        fetch('/api/lister/profile')
      ]);

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

      if (profRes.ok) {
        const pData = await profRes.json();
        if (pData.success && pData.profile) {
          setReferralInfo({
            code: pData.profile.referralCode || 'N/A',
            count: pData.profile._count?.referralsMade || 0,
            walletBalance: Number(pData.profile.user?.walletBalance || 0),
          });
        }
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
      <style>{`
        @keyframes payoutsFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes expandPayout {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }

        .wl-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
          animation: payoutsFadeUp 0.4s ease both;
        }
        .wl-h1 {
          font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-size: 32px; font-weight: 400; color: #0D1A14; line-height: 1.1; margin-bottom: 4px;
        }
        .wl-subtitle { font-size: 13px; color: #74897C; }
        
        .extension-note {
          background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;
          font-size: 13px; color: #166534; display: flex; align-items: flex-start; gap: 12px;
        }

        /* Stats Grid Layout */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
          animation: payoutsFadeUp 0.4s ease 0.08s both;
        }
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 580px) {
          .stats-grid { grid-template-columns: 1fr; }
        }

        .payouts-card {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 22px;
          border: 1px solid rgba(44,94,67,0.08);
          box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(44,94,67,0.03);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .payouts-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(44,94,67,0.07);
        }
        .w-icon-circle {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .w-val { font-size: 26px; font-weight: 700; color: #1C2E24; line-height: 1.1; }
        .w-lbl { font-size: 11.5px; color: #74897C; margin-top: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

        /* Ledger Table Styling */
        .ledger-section-title {
          font-family: var(--font-cormorant), serif;
          font-size: 22px; font-weight: 400; color: #264f39ff; margin-bottom: 16px;
        }
        .table-wrap {
          background: #FFFFFF; border-radius: 20px;
          border: 1px solid rgba(44, 94, 67, 0.08);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(44,94,67,0.04);
          overflow: hidden;
          animation: payoutsFadeUp 0.4s ease 0.16s both;
        }
        .ledger-head {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr auto;
          gap: 16px; padding: 14px 24px;
          background: #F8FAF8; border-bottom: 1px solid rgba(44,94,67,0.07);
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #74897C; align-items: center;
        }
        @media (max-width: 768px) {
          .ledger-head { display: none; }
        }

        .ledger-row-wrap {
          border-bottom: 1px solid rgba(44,94,67,0.05);
        }
        .ledger-row-wrap:last-child { border-bottom: none; }

        .ledger-row {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr auto;
          gap: 16px; padding: 18px 24px;
          align-items: center; cursor: pointer;
          transition: background 0.15s ease;
        }
        .ledger-row:hover { background: #FAFBFA; }
        @media (max-width: 768px) {
          .ledger-row { grid-template-columns: 1fr; gap: 10px; padding: 20px; }
          .ledger-id-txt, .ledger-date-txt, .ledger-amt-txt, .ledger-com-txt, .status-pill { justify-self: flex-start; }
        }

        .ledger-id-txt { font-size: 13.5px; font-weight: 600; color: #1C2E24; }
        .ledger-date-txt { font-size: 12.5px; color: #74897C; }
        .ledger-amt-txt { font-size: 14px; font-weight: 700; color: #2C5E43; }
        .ledger-com-txt { font-size: 13px; color: #475569; font-weight: 500; }
        
        .status-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; border-radius: 100px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.04em; border: 1px solid; width: fit-content;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }

        /* Expand Panel for Booking */
        .payout-expand-panel {
          background: #FAFDFB; border-top: 1px solid rgba(44,94,67,0.04);
          padding: 20px 24px; animation: expandPayout 0.25s ease both;
        }
        .expanded-items-grid {
          display: flex; flex-direction: column; gap: 12px;
        }
        .expanded-item-card {
          display: flex; align-items: center; gap: 14px;
          padding: 10px 14px; background: #FFFFFF; border-radius: 10px;
          border: 1px solid rgba(44,94,67,0.06);
        }
        .item-thumb {
          width: 38px; height: 46px; border-radius: 6px;
          background: #F0F4F1; border: 1px solid rgba(44,94,67,0.08);
          overflow: hidden; display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }
        .item-details { flex-grow: 1; }
        .item-title-txt { font-size: 13px; font-weight: 600; color: #1C2E24; }
        .item-meta-txt { font-size: 11px; color: #74897C; margin-top: 2px; }

        .empty-state {
          padding: 80px 40px; text-align: center;
          background: #FFFFFF; border-radius: 20px;
          border: 2px dashed rgba(44,94,67,0.15);
          animation: payoutsFadeUp 0.4s ease both;
        }
        .empty-emoji { font-size: 48px; margin-bottom: 16px; }
        .empty-title {
          font-family: var(--font-cormorant), serif;
          font-size: 24px; font-weight: 400; color: #163625; margin-bottom: 8px;
        }
        .empty-desc { font-size: 13px; color: #74897C; }

        /* Pagination Bar */
        .pagination-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; background: #FAFBFA;
          border-top: 1px solid rgba(44,94,67,0.07);
          font-size: 12.5px; color: #74897C; font-weight: 500;
        }
        @media (max-width: 768px) {
          .pagination-bar { flex-direction: column; gap: 16px; align-items: flex-start; }
        }
        .pagination-buttons { display: flex; gap: 6px; }
        .pagination-btn {
          border: 1px solid rgba(44,94,67,0.12); background: #FFFFFF;
          color: #3D5347; min-width: 32px; height: 32px; border-radius: 8px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .pagination-btn:hover:not(:disabled) { border-color: #2C5E43; color: #2C5E43; background: rgba(44,94,67,0.02); }
        .pagination-btn.active { background: #2C5E43; color: #FFFFFF; border-color: #2C5E43; }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

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
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(44,94,67,0.12)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                🎁
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#74897C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Lister Referral Code</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#166534', fontFamily: 'monospace', letterSpacing: '0.08em', marginTop: '2px' }}>
                  {referralInfo.code}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#74897C', textTransform: 'uppercase', fontWeight: 600 }}>Successful Referrals</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0D1A14', marginTop: '2px' }}>{referralInfo.count} Listers</div>
              </div>
              <div style={{ height: '32px', width: '1px', background: 'rgba(44,94,67,0.1)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#74897C', textTransform: 'uppercase', fontWeight: 600 }}>Wallet Credit Balance</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#2C5E43', marginTop: '2px' }}>₹{referralInfo.walletBalance.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

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
                <span>Rental Detail</span>
              </div>

              {paginatedPayouts.map((p) => {
                const isExpanded = expandedId === p.id;
                const isCompleted = p.status === 'COMPLETED';
                return (
                  <div key={p.id} className="ledger-row-wrap">
                    <div className="ledger-row" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                      <div className="ledger-id-txt" style={{ fontFamily: 'monospace' }}>
                        {p.batchRef || `BATCH-${p.id.slice(0, 8).toUpperCase()}`}
                      </div>
                      <div className="ledger-date-txt">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="ledger-amt-txt">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </div>
                      <div className="ledger-com-txt" style={{ color: '#EF4444' }}>
                        -₹{Number(p.commissionPaid).toLocaleString('en-IN')}
                      </div>
                      <div>
                        {(() => {
                          const hasOpenDispute = p.booking?.damageReports?.some(dr => dr.dispute?.status === 'OPEN');
                          
                          if (hasOpenDispute) {
                            return (
                              <span 
                                className="status-pill" 
                                style={{
                                  background: '#FEF2F2',
                                  color: '#991B1B',
                                  borderColor: '#FCA5A5',
                                }}
                              >
                                <span className="status-dot" style={{ background: '#EF4444' }} />
                                ON HOLD - UNDER REVIEW
                              </span>
                            );
                          }

                          return (
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
                        })()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#AEC0B4" strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                        >
                          <path d="M6 9L12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && p.booking && (
                      <div style={{
                        marginTop: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        padding: '24px', fontFamily: 'var(--font-sans)', fontSize: '13px', animation: 'riseReveal 0.3s ease both'
                      }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', color: 'var(--accent)' }}>
                          Boutique Settlement Receipt
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ width: '60px', height: '80px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <img src={p.booking.listing.baselineImages?.[0] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=150'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{p.booking.listing.title}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rented by: {p.booking.renter.name}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Gross Rent Earned</span>
                            <span>₹{Number(p.booking.rentAmount).toLocaleString('en-IN')}</span>
                          </div>
                          {Number(p.booking.extensionFee) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Extension Fee Added</span>
                              <span>₹{Number(p.booking.extensionFee).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--alert)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Platform Commission (35%)</span>
                            <span>-₹{Number(p.commissionPaid).toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px dashed var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                            <span>Net Bank Deposit</span>
                            <span style={{ color: 'var(--accent)' }}>₹{Number(p.amount).toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                            Settled via IMPS to Account: *******{bankDetails.bankAccountNo.slice(-4) || 'XXXX'} | IFSC: {bankDetails.bankIfsc || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
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
