'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import './admin-refunds.css';

interface RefundItem {
  id: string;
  amount: string;
  status: 'PENDING' | 'COMPLETED';
  gateway: string | null;
  gatewayRefundId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    walletBalance: string | number;
  };
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    securityDeposit: string;
    lateReturnPenalty?: string;
    razorpayPaymentId?: string;
    listing: {
      id: string;
      title: string;
      category: string;
      rentalPrice: string;
      securityDeposit: string;
      baselineImages: string[];
    };
    renter: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
    damageReports?: {
      id: string;
      inspectionType: string;
      grade: string;
      deductionAmount: string;
      isDisputed: boolean;
      dispute?: {
        id: string;
        status: string;
        adminNotes?: string | null;
      } | null;
    }[];
  };
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<RefundItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [manualApprovalRequired, setManualApprovalRequired] = useState(true);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const url = filter === 'ALL' ? '/api/admin/refunds' : `/api/admin/refunds?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRefunds(data.refunds || []);
        if (typeof data.manualApprovalRequired === 'boolean') {
          setManualApprovalRequired(data.manualApprovalRequired);
        }
      }
    } catch (err) {
      console.error('Error fetching refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [filter]);

  const handleApproveRefund = async () => {
    if (!activeModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/refunds/${activeModal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setToast({
          message: data.message || 'Refund approved and executed successfully!',
          type: 'success',
        });
        setActiveModal(null);
        fetchRefunds();
      } else {
        setToast({
          message: data.error || 'Failed to approve refund',
          type: 'error',
        });
      }
    } catch (err) {
      setToast({ message: 'Network error occurred while approving refund', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Metrics
  const pendingRefunds = useMemo(
    () => refunds.filter((r) => r.status === 'PENDING'),
    [refunds]
  );
  const completedRefunds = useMemo(
    () => refunds.filter((r) => r.status === 'COMPLETED'),
    [refunds]
  );
  const pendingTotal = useMemo(
    () => pendingRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [pendingRefunds]
  );
  const completedTotal = useMemo(
    () => completedRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [completedRefunds]
  );

  const activeDisputesCount = useMemo(() => {
    return refunds.filter((r) =>
      r.booking.damageReports?.some((dr) => dr.dispute?.status === 'OPEN')
    ).length;
  }, [refunds]);

  // Filter & Search
  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const renterName = r.user.name.toLowerCase();
      const renterEmail = r.user.email.toLowerCase();
      const bookingId = r.booking.id.toLowerCase();
      const itemTitle = r.booking.listing?.title?.toLowerCase() || '';
      return (
        renterName.includes(q) ||
        renterEmail.includes(q) ||
        bookingId.includes(q) ||
        itemTitle.includes(q)
      );
    });
  }, [refunds, searchQuery]);

  return (
    <div className="adm-refunds-page">
      {/* Toast */}
      {toast && (
        <div className={`adm-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Entity Separation Switcher Tabs */}
      <div className="adm-entity-nav-tabs">
        <Link href="/admin/refunds" className="adm-entity-tab active">
          <span className="adm-entity-tab-icon">🧑‍💼</span>
          <div className="adm-entity-tab-info">
            <span className="adm-entity-tab-title">Renter Security Refunds</span>
            <span className="adm-entity-tab-sub">Customer security deposit returns (Razorpay / Wallet)</span>
          </div>
          <span className="adm-entity-tab-tag renter">Renter Desk (Active)</span>
        </Link>
        <Link href="/admin/payouts" className="adm-entity-tab">
          <span className="adm-entity-tab-icon">👗</span>
          <div className="adm-entity-tab-info">
            <span className="adm-entity-tab-title">Lister Rental Payouts</span>
            <span className="adm-entity-tab-sub">Owner rental earnings & damage compensation (Bank / UPI)</span>
          </div>
          <span className="adm-entity-tab-tag lister">Switch to Lister ↗</span>
        </Link>
      </div>

      {/* Desk Clarification Banner */}
      <div className="adm-entity-desk-banner renter">
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <div>
          <strong>Renter Refund Desk:</strong> Yeh desk sirf renters ki <strong>Security Deposit</strong> wapas return karne ke liye hai (Post-Return inspection ke baad). Kapde ke maalik (Lister) ki rental kamai aur damage payout ke liye upar <strong>Lister Rental Payouts</strong> tab par click karein.
        </div>
      </div>

      {/* Header */}
      <div className="adm-refunds-header">
        <div className="adm-refunds-title-group">
          <h1>
            Renter Security Deposit Refunds
            <span
              className={`adm-toggle-badge ${
                manualApprovalRequired ? 'active' : 'inactive'
              }`}
            >
              {manualApprovalRequired
                ? 'Manual Approval Gate: ON'
                : 'Manual Approval Gate: OFF (Auto-Refunds)'}
            </span>
          </h1>
          <p>
            Review and approve security deposit refunds post-return inspection before funds are dispatched via Razorpay.
          </p>
        </div>

        <button className="adm-refresh-btn" onClick={fetchRefunds}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Refresh Ledger
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="adm-metrics-grid">
        <div className="adm-metric-card pending">
          <div className="adm-metric-top">
            <span className="adm-metric-label">Pending Approval</span>
            <div className="adm-metric-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="adm-metric-value">₹{pendingTotal.toLocaleString('en-IN')}</div>
          <div className="adm-metric-subtext">
            {pendingRefunds.length} {pendingRefunds.length === 1 ? 'request' : 'requests'} waiting for admin review
          </div>
        </div>

        <div className="adm-metric-card completed">
          <div className="adm-metric-top">
            <span className="adm-metric-label">Total Refunded</span>
            <div className="adm-metric-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="adm-metric-value">₹{completedTotal.toLocaleString('en-IN')}</div>
          <div className="adm-metric-subtext">
            {completedRefunds.length} {completedRefunds.length === 1 ? 'refund' : 'refunds'} settled back to patrons
          </div>
        </div>

        <div className="adm-metric-card disputes">
          <div className="adm-metric-top">
            <span className="adm-metric-label">Damage Disputes</span>
            <div className="adm-metric-icon-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <div className="adm-metric-value">{activeDisputesCount}</div>
          <div className="adm-metric-subtext">
            Orders flagged for excessive damage or deposit shortfall
          </div>
        </div>
      </div>

      {/* Controls Bar: Filter Tabs & Search */}
      <div className="adm-controls-card">
        <div className="adm-filter-pills">
          <button
            className={`adm-filter-pill ${filter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending Approval
            <span className="adm-pill-count">{pendingRefunds.length}</span>
          </button>
          <button
            className={`adm-filter-pill ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed
            <span className="adm-pill-count">{completedRefunds.length}</span>
          </button>
          <button
            className={`adm-filter-pill ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Refunds
            <span className="adm-pill-count">{refunds.length}</span>
          </button>
        </div>

        <div className="adm-search-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by patron name, email, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="adm-table-card">
        <div className="adm-table-responsive">
          <table className="adm-refunds-table">
            <thead>
              <tr>
                <th>Renter Patron</th>
                <th>Booking & Garment</th>
                <th>Inspection Grade</th>
                <th>Security Deposit & Deductions</th>
                <th>Net Refund</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '2px solid #CBD5E1',
                          borderTopColor: '#0F172A',
                          animation: 'spin 0.7s linear infinite',
                        }}
                      />
                      <span>Loading refunds ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#64748B' }}>
                    No refund records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((r) => {
                  const damageReport = r.booking.damageReports?.[0];
                  const hasDispute = damageReport?.dispute?.status === 'OPEN';
                  const depositAmt = Number(r.booking.securityDeposit || 0);
                  const deductionAmt = Number(damageReport?.deductionAmount || 0);
                  const lateFee = Number(r.booking.lateReturnPenalty || 0);
                  const refundAmt = Number(r.amount);

                  return (
                    <tr key={r.id}>
                      {/* Renter Cell */}
                      <td>
                        <div className="adm-renter-cell">
                          <span className="adm-renter-name">{r.user.name}</span>
                          <span className="adm-renter-sub">{r.user.email}</span>
                          {r.user.phone && <span className="adm-renter-sub">{r.user.phone}</span>}
                        </div>
                      </td>

                      {/* Booking Cell */}
                      <td>
                        <div className="adm-booking-cell">
                          <span className="adm-booking-code">
                            #{r.booking.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="adm-item-title" title={r.booking.listing?.title}>
                            {r.booking.listing?.title || 'Garment Rental'}
                          </span>
                        </div>
                      </td>

                      {/* Grade Cell */}
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color:
                              damageReport?.grade === 'A_NO_ISSUE'
                                ? '#059669'
                                : damageReport?.grade === 'B_MINOR'
                                ? '#D97706'
                                : '#DC2626',
                          }}
                        >
                          {damageReport?.grade
                            ? damageReport.grade.replace(/_/g, ' ')
                            : 'GRADE A (NO DAMAGE)'}
                        </span>
                        {hasDispute && (
                          <div>
                            <span className="adm-badge dispute">
                              ⚠ DISPUTE OPEN
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Deductions Cell */}
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#334155' }}>
                          <div>Original: ₹{depositAmt.toLocaleString('en-IN')}</div>
                          {deductionAmt > 0 && (
                            <div style={{ color: '#DC2626', fontSize: '11.5px' }}>
                              - ₹{deductionAmt.toLocaleString('en-IN')} (Damage)
                            </div>
                          )}
                          {lateFee > 0 && (
                            <div style={{ color: '#D97706', fontSize: '11.5px' }}>
                              - ₹{lateFee.toLocaleString('en-IN')} (Late Return)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Net Refund Amount Cell */}
                      <td>
                        <div className="adm-amount-cell">
                          <span className="adm-refund-amount">
                            ₹{refundAmt.toLocaleString('en-IN')}
                          </span>
                          {r.gateway && (
                            <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                              via {r.gateway}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Cell */}
                      <td>
                        <span className={`adm-badge ${r.status.toLowerCase()}`}>
                          {r.status === 'PENDING' ? 'PENDING APPROVAL' : 'REFUNDED'}
                        </span>
                      </td>

                      {/* Action Cell */}
                      <td>
                        {r.status === 'PENDING' ? (
                          <button
                            className="adm-action-btn"
                            onClick={() => setActiveModal(r)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Approve & Refund
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                            ✓ Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {activeModal && (
        <div className="adm-modal-backdrop" onClick={() => !submitting && setActiveModal(null)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Approve Renter Deposit Refund</h3>
              <button
                className="adm-modal-close-btn"
                onClick={() => !submitting && setActiveModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="adm-modal-body">
              <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                You are authorizing the security deposit refund for booking{' '}
                <strong>#{activeModal.booking.id.slice(0, 8).toUpperCase()}</strong> to{' '}
                <strong>{activeModal.user.name}</strong>.
              </p>

              {activeModal.booking.damageReports?.some((dr) => dr.dispute?.status === 'OPEN') && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#991B1B',
                  }}
                >
                  <strong>⚠️ Note:</strong> An active dispute is currently open for this booking. Approving this refund will release the remaining deposit balance to the patron.
                </div>
              )}

              <div className="adm-modal-breakdown">
                <div className="adm-breakdown-row">
                  <span>Renter Patron</span>
                  <strong>{activeModal.user.name}</strong>
                </div>
                <div className="adm-breakdown-row">
                  <span>Garment Item</span>
                  <strong>{activeModal.booking.listing?.title}</strong>
                </div>
                <div className="adm-breakdown-row">
                  <span>Original Security Deposit</span>
                  <span>₹{Number(activeModal.booking.securityDeposit).toLocaleString('en-IN')}</span>
                </div>

                {Number(activeModal.booking.damageReports?.[0]?.deductionAmount || 0) > 0 && (
                  <div className="adm-breakdown-row" style={{ color: '#DC2626' }}>
                    <span>Damage Deductions</span>
                    <span>- ₹{Number(activeModal.booking.damageReports![0].deductionAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {Number(activeModal.booking.lateReturnPenalty || 0) > 0 && (
                  <div className="adm-breakdown-row" style={{ color: '#D97706' }}>
                    <span>Late Return Penalty</span>
                    <span>- ₹{Number(activeModal.booking.lateReturnPenalty).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="adm-breakdown-row total">
                  <span>Net Refund to Dispatch</span>
                  <span className="highlight">₹{Number(activeModal.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>
                  Funds will be credited via Razorpay directly to the patron&apos;s source account.
                </span>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                className="adm-btn-cancel"
                onClick={() => setActiveModal(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="adm-btn-confirm"
                onClick={handleApproveRefund}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#FFFFFF',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    <span>Executing Refund...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Confirm & Execute Refund</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
