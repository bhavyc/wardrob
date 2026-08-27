'use client';

import { useState, useEffect } from 'react';

import Pagination from '@/components/Pagination';

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
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
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
  const [activeModal, setActiveModal] = useState<PayoutItem | null>(null);
  const [batchRefInput, setBatchRefInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    } catch (err) {
      setToast({ message: 'Network error occurred', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const pendingTotal = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const completedTotal = payouts
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div style={{ paddingBottom: 40 }}>
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
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Lister Payouts & Settlement
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Manual settlement queue: Transfer net rent to lister via Bank/UPI and mark as complete.
          </p>
        </div>
        <button
          onClick={fetchPayouts}
          style={{
            background: '#fff',
            border: '1px solid #CBD5E1',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
          padding: 24, 
          borderRadius: 16, 
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(217,119,6,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Pending Settlement
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px' }}>
            ₹{pendingTotal.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, fontWeight: 500 }}>
            <strong style={{ color: '#D97706' }}>{payouts.filter((p) => p.status === 'PENDING').length} payouts</strong> awaiting manual transfer
          </div>
        </div>

        <div style={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
          padding: 24, 
          borderRadius: 16, 
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(5,150,105,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Completed Payouts
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-1px' }}>
            ₹{completedTotal.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8, fontWeight: 500 }}>
            <strong style={{ color: '#059669' }}>{payouts.filter((p) => p.status === 'COMPLETED').length} settled</strong> to listers
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 18px',
              borderRadius: 24,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: filter === f ? 'linear-gradient(135deg, #0F172A 0%, #334155 100%)' : '#F1F5F9',
              color: filter === f ? '#FFF' : '#64748B',
              boxShadow: filter === f ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: filter === f ? 'translateY(-1px)' : 'none',
            }}
          >
            {f === 'ALL' ? 'All Payouts' : f === 'PENDING' ? '⏳ Pending Manual Action' : '✅ Completed'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: '#FFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.025)',
        }}
      >
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B', fontSize: 14, fontWeight: 500 }}>
            <div className="mini-spin" style={{ display: 'inline-block', marginRight: 12, border: '3px solid #E2E8F0', borderTopColor: '#0F172A' }} />
            Loading payouts...
          </div>
        ) : payouts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontSize: 15, fontWeight: 500 }}>No payouts found in this view.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Lister Details</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Bank Account / IFSC</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Rental Item</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Gross Rent</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Commission</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Net Payable</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((p) => {
                  const isOnHold = p.status === 'PENDING' && p.booking.damageReports?.some(dr => dr.dispute?.status === 'OPEN');
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.1s',
                        background: isOnHold ? '#FFF5F5' : 'transparent',
                        borderLeft: isOnHold ? '4px solid #EF4444' : 'none'
                      }}
                    >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
                        {p.lister.user.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        {p.lister.shopName ? `Shop: ${p.lister.shopName}` : p.lister.user.email}
                      </div>
                      {p.lister.user.phone && (
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>📞 {p.lister.user.phone}</div>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {p.lister.bankAccountNo ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
                            A/C: {p.lister.bankAccountNo}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                            IFSC: {p.lister.bankIfsc}
                          </div>
                          {p.lister.panNumber && (
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>PAN: {p.lister.panNumber}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#B91C1C', fontWeight: 600, background: '#FEE2E2', padding: '4px 8px', borderRadius: 4 }}>
                          ⚠️ Bank details missing
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 13, lineHeight: 1.4 }}>
                        {p.booking.listing.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                        ID: {p.booking.id.slice(0, 8)}...
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 500, fontSize: 14 }}>
                      ₹{Number(p.booking.rentAmount).toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '16px 20px', color: '#EF4444', fontWeight: 500, fontSize: 14 }}>
                      -₹{Number(p.commissionPaid).toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {p.status === 'PENDING' ? (
                        <span
                          style={{
                            display: 'inline-block',
                            background: isOnHold ? '#FEE2E2' : '#FEF3C7',
                            color: isOnHold ? '#991B1B' : '#92400E',
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {isOnHold ? 'ON HOLD' : 'PENDING'}
                        </span>
                      ) : (
                        <div>
                          <span
                            style={{
                              display: 'inline-block',
                              background: '#D1FAE5',
                              color: '#065F46',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            ✅ PAID
                          </span>
                          {p.batchRef && (
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 6 }}>
                              Ref: {p.batchRef}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      {p.status === 'PENDING' ? (
                        p.booking.damageReports?.some(dr => dr.dispute?.status === 'OPEN') ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>⚠️ ON HOLD</span>
                            <span style={{ fontSize: 10, color: '#991B1B', fontWeight: 600 }}>DISPUTE ACTIVE</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveModal(p);
                              setBatchRefInput('');
                            }}
                            style={{
                              background: '#0F172A',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 6,
                              padding: '8px 14px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#1E293B'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#0F172A'}
                          >
                            Mark as Paid
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>Settled</span>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Mark as Paid */}
      {activeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>
              Confirm Manual Transfer
            </h3>
            <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#64748B' }}>
                <span>Rental Payout:</span>
                <span style={{ color: '#0F172A', fontWeight: 600 }}>₹{Number(activeModal.amount).toLocaleString('en-IN')}</span>
              </div>
              {Number(activeModal.lister.user.walletBalance) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#64748B' }}>
                  <span>Referral Wallet Balance (Clubbed):</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>+ ₹{Number(activeModal.lister.user.walletBalance).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #E2E8F0', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                <span>Total Transfer Required:</span>
                <span>₹{(Number(activeModal.amount) + (activeModal.status === 'PENDING' ? Number(activeModal.lister.user.walletBalance || 0) : 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
              Please ensure you have transferred the <strong>Total Transfer Required</strong> amount to{' '}
              <strong>{activeModal.lister.user.name}</strong> via Bank Transfer or UPI.
            </p>

            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 14,
                marginBottom: 16,
                fontSize: 12,
              }}
            >
              <div><strong>Account Number:</strong> {activeModal.lister.bankAccountNo || 'N/A'}</div>
              <div style={{ marginTop: 4 }}><strong>IFSC Code:</strong> {activeModal.lister.bankIfsc || 'N/A'}</div>
              <div style={{ marginTop: 4 }}><strong>Lister Phone / UPI:</strong> {activeModal.lister.user.phone || 'N/A'}</div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Transaction Ref / UPI UTR Number (Optional)
              </label>
              <input
                type="text"
                value={batchRefInput}
                onChange={(e) => setBatchRefInput(e.target.value)}
                placeholder="e.g. UPI/423187219837 or IMPS-129381"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: 6,
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
                  padding: '8px 16px',
                  background: '#059669',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFF',
                  cursor: 'pointer',
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
