'use client';

import { useState, useEffect } from 'react';
import './admin-coupons.css';

type Coupon = {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Coupon Form States
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons || []);
      } else {
        setError(data.error || 'Failed to load coupons catalog.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      setError('Discount value must be a positive number.');
      return;
    }
    if (discountType === 'PERCENTAGE' && val > 100) {
      setError('Percentage discount cannot exceed 100%.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: val,
          minOrderValue: minOrderValue ? Number(minOrderValue) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Coupon code created successfully.');
        setShowModal(false);
        // Reset states
        setCode(''); setDiscountType('PERCENTAGE'); setDiscountValue(''); setMinOrderValue(''); setExpiresAt('');
        await fetchCoupons();
      } else {
        setError(data.error || 'Failed to create coupon.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message);
        await fetchCoupons();
      } else {
        setError(data.error || 'Failed to update coupon status.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    setError(''); setSuccess('');
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Coupon permanently deleted.');
        // Adjust page index if item deletion makes the page empty
        const nextTotal = coupons.length - 1;
        const nextPages = Math.ceil(nextTotal / ITEMS_PER_PAGE);
        if (currentPage > nextPages && nextPages > 0) {
          setCurrentPage(nextPages);
        }
        await fetchCoupons();
      } else {
        setError(data.error || 'Failed to delete coupon.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Metrics
  const totalCount = coupons.length;
  const activeCount = coupons.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length;
  const inactiveCount = coupons.filter(c => !c.isActive || (c.expiresAt && new Date(c.expiresAt) <= new Date())).length;

  // Pagination calculation
  const totalPages = Math.ceil(coupons.length / ITEMS_PER_PAGE);
  const paginatedCoupons = coupons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, coupons.length);

  return (
    <>
      {/* Header */}
      <div className="cp-header">
        <div>
          <h1 className="cp-h1">Coupons & Discounts</h1>
          <p className="cp-subtitle">Manage system-wide promotional offers, discount codes, and order thresholds</p>
        </div>
        <button className="create-btn" onClick={() => setShowModal(true)}>
          <span style={{ fontSize: 16 }}>+</span> Create Coupon
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ background: '#F1F5F9', color: '#475569' }}>🏷️</div>
          <div>
            <div className="metric-num">{loading ? '—' : totalCount}</div>
            <div className="metric-label">Total Coupon Rules</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ background: '#D1FAE5', color: '#059669' }}>✔️</div>
          <div>
            <div className="metric-num">{loading ? '—' : activeCount}</div>
            <div className="metric-label">Active & Valid</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ background: '#FEE2E2', color: '#EF4444' }}>🚫</div>
          <div>
            <div className="metric-num">{loading ? '—' : inactiveCount}</div>
            <div className="metric-label">Expired / Suspended</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert-banner alert-error"><span>⚠</span>{error}</div>}
      {success && <div className="alert-banner alert-success"><span>✓</span>{success}</div>}

      {/* Table view */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #CBD5E1', borderTopColor: '#0F172A', animation: 'cpSpin 0.7s linear infinite' }} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">🏷️</div>
          <h3 className="empty-title">No coupons active</h3>
          <p className="empty-desc">Create your first promotional discount code to incentivize customer checkouts.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-head">
            <span>Coupon Code</span>
            <span>Discount Type</span>
            <span>Value</span>
            <span>Min Order Value</span>
            <span>Expiration Date</span>
            <span>Active Switch</span>
            <span>Operations</span>
          </div>

          {paginatedCoupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) <= new Date();
            const isValid = coupon.isActive && !isExpired;
            return (
              <div key={coupon.id} className="table-row-wrap">
                <div className="table-row">
                  <div className="code-txt">{coupon.code}</div>
                  <div>
                    <span className="type-badge">{coupon.discountType}</span>
                  </div>
                  <div className="val-txt">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </div>
                  <div className="limit-txt">
                    {coupon.minOrderValue ? `₹${coupon.minOrderValue.toLocaleString('en-IN')}` : 'None'}
                  </div>
                  <div className="limit-txt" style={{ fontStyle: coupon.expiresAt ? 'normal' : 'italic' }}>
                    {coupon.expiresAt 
                      ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Never Expires'
                    }
                  </div>
                  <div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={coupon.isActive} 
                        onChange={() => handleToggleActive(coupon.id, coupon.isActive)}
                      />
                      <span className="slider" />
                    </label>
                  </div>
                  <div>
                    <button 
                      className="delete-btn" 
                      disabled={deletingId === coupon.id}
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
                          handleDeleteCoupon(coupon.id);
                        }
                      }}
                    >
                      {deletingId === coupon.id ? <div className="mini-spin" style={{ borderColor: 'rgba(239,68,68,0.2)', borderTopColor: '#EF4444' }} /> : 'Delete ✕'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <div>
                Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{coupons.length}</strong> coupons
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

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Create Discount Coupon</h2>
            </div>
            <form onSubmit={handleCreateCoupon}>
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-lbl">Promo Code</label>
                  <input 
                    type="text" 
                    required 
                    className="field-inp code-inp"
                    placeholder="e.g. FESTIVE50"
                    maxLength={15}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                  />
                </div>

                <div className="two-col">
                  <div className="field-group">
                    <label className="field-lbl">Discount Type</label>
                    <select 
                      className="field-inp"
                      value={discountType}
                      onChange={e => setDiscountType(e.target.value as 'PERCENTAGE' | 'FLAT')}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="PERCENTAGE">Percentage %</option>
                      <option value="FLAT">Flat Rate ₹</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-lbl">Discount Value</label>
                    <input 
                      type="number" 
                      required 
                      min={1}
                      max={discountType === 'PERCENTAGE' ? 100 : undefined}
                      className="field-inp"
                      placeholder={discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 200'}
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>

                <div className="two-col">
                  <div className="field-group">
                    <label className="field-lbl">Min Purchase (₹)</label>
                    <input 
                      type="number" 
                      min={0}
                      className="field-inp"
                      placeholder="e.g. 1000"
                      value={minOrderValue}
                      onChange={e => setMinOrderValue(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-lbl">Expiry Date</label>
                    <input 
                      type="date" 
                      className="field-inp"
                      min={new Date().toISOString().split('T')[0]}
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="confirm-btn" disabled={submitting || !code || !discountValue}>
                    {submitting ? <div className="mini-spin" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#FFF' }} /> : 'Create Promo Code'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
