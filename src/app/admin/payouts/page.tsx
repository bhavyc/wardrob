'use client';

import { useState, useEffect } from 'react';

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

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const url = filter === 'ALL' ? '/api/admin/payouts' : `/api/admin/payouts?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts);
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ background: '#FFF', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Settlement
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#D97706', marginTop: 6 }}>
            ₹{pendingTotal.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            {payouts.filter((p) => p.status === 'PENDING').length} payouts awaiting manual bank transfer
          </span>
        </div>

        <div style={{ background: '#FFF', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
            Completed Payouts
          </span>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#059669', marginTop: 6 }}>
            ₹{completedTotal.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>
            {payouts.filter((p) => p.status === 'COMPLETED').length} settled to listers
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: filter === f ? '#0F172A' : '#E2E8F0',
              color: filter === f ? '#FFF' : '#475569',
              transition: 'all 0.15s',
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
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No payouts found in this view.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Lister Details</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Bank Account / IFSC</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Rental Item</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Gross Rent</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Commission</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Net Payable</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => {
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
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>
                        {p.lister.user.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {p.lister.shopName ? `Shop: ${p.lister.shopName}` : p.lister.user.email}
                      </div>
                      {p.lister.user.phone && (
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>📞 {p.lister.user.phone}</div>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {p.lister.bankAccountNo ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
                            A/C: {p.lister.bankAccountNo}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                            IFSC: {p.lister.bankIfsc}
                          </div>
                          {p.lister.panNumber && (
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>PAN: {p.lister.panNumber}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
                          ⚠️ Bank details not provided
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {p.booking.listing.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Booking ID: {p.booking.id.slice(0, 8)}...
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      ₹{Number(p.booking.rentAmount).toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#EF4444' }}>
                      -₹{Number(p.commissionPaid).toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {p.status === 'PENDING' ? (
                        <span
                          style={{
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          ⏳ PENDING
                        </span>
                      ) : (
                        <div>
                          <span
                            style={{
                              background: '#D1FAE5',
                              color: '#065F46',
                              padding: '4px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            ✅ PAID
                          </span>
                          {p.batchRef && (
                            <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontFamily: 'monospace' }}>
                              Ref: {p.batchRef}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {p.status === 'PENDING' ? (
                        p.booking.damageReports?.some(dr => dr.dispute?.status === 'OPEN') ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>⚠️ LOCKED ON HOLD</span>
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
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
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
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
              Please ensure you have transferred <strong>₹{Number(activeModal.amount).toLocaleString('en-IN')}</strong> to{' '}
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
