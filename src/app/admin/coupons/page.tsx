'use client';

import { useState, useEffect } from 'react';

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
      <style>{`
        @keyframes cpFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cpModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cpOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cpSpin { to { transform: rotate(360deg); } }

        .cp-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
          animation: cpFadeUp 0.4s ease both;
        }
        .cp-h1 {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 32px; font-weight: 300; color: #0F172A; margin-bottom: 4px;
        }
        .cp-subtitle { font-size: 13.5px; color: #64748B; }

        .create-btn {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #0F172A, #1E293B);
          color: #FFFFFF; border: none; border-radius: 10px;
          padding: 10px 20px; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(15,23,42,0.12);
        }
        .create-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(15,23,42,0.22); }

        /* KPI Row */
        .metrics-row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
          margin-bottom: 28px;
          animation: cpFadeUp 0.4s ease 0.04s both;
        }
        .metric-card {
          background: #FFFFFF; border-radius: 16px;
          padding: 20px 24px; border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 6px 20px rgba(15,23,42,0.02);
          display: flex; align-items: center; gap: 16px;
        }
        .metric-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .metric-num { font-size: 28px; font-weight: 700; color: #0F172A; line-height: 1; }
        .metric-label { font-size: 12px; color: #64748B; margin-top: 4px; font-weight: 500; }

        .alert-banner {
          padding: 14px 18px; border-radius: 12px; margin-bottom: 20px;
          font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 10px;
          animation: cpFadeUp 0.3s ease both;
        }
        .alert-error { background: #FFF5F5; border: 1px solid #FEB2B2; color: #C53030; }
        .alert-success { background: #F0FFF4; border: 1px solid #9AE6B4; color: #276749; }

        /* Table */
        .table-wrap {
          background: #FFFFFF; border-radius: 20px;
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 4px 24px rgba(15,23,42,0.02);
          overflow: hidden;
          animation: cpFadeUp 0.4s ease 0.08s both;
        }
        .table-head {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.2fr 1fr 1fr auto;
          gap: 16px; padding: 14px 24px;
          background: #F8FAFC; border-bottom: 1px solid rgba(15,23,42,0.06);
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #64748B; align-items: center;
        }
        @media (max-width: 800px) {
          .table-head { display: none; }
        }

        .table-row-wrap {
          border-bottom: 1px solid rgba(15,23,42,0.05);
          background: #FFFFFF;
        }
        .table-row-wrap:last-child { border-bottom: none; }

        .table-row {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.2fr 1fr 1fr auto;
          gap: 16px; padding: 16px 24px;
          align-items: center;
        }
        @media (max-width: 800px) {
          .table-row { grid-template-columns: 1fr; gap: 10px; padding: 20px; }
        }

        .code-txt { font-family: monospace; font-size: 14px; font-weight: 700; color: #0F172A; letter-spacing: 0.05em; }
        .type-badge {
          display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 100px;
          font-size: 9.5px; font-weight: 700; background: #F1F5F9; color: #475569;
        }
        .val-txt { font-size: 14px; font-weight: 700; color: #0F172A; }
        .limit-txt { font-size: 13px; color: #64748B; }
        
        .status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 100px; font-size: 10.5px; font-weight: 700;
          border: 1px solid; white-space: nowrap; width: fit-content;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }

        /* Switches / Actions */
        .toggle-switch {
          position: relative; display: inline-block; width: 38px; height: 22px;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer; inset: 0; background-color: #E2E8F0;
          border-radius: 34px; transition: .3s;
        }
        .slider:before {
          position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px;
          background-color: white; border-radius: 50%; transition: .3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        input:checked + .slider { background-color: #10B981; }
        input:checked + .slider:before { transform: translateX(16px); }

        .delete-btn {
          background: transparent; border: none; color: #EF4444; font-size: 11px; font-weight: 700;
          cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 4px;
        }
        .delete-btn:hover:not(:disabled) { background: #FFF5F5; }
        .delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Modal styling */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 500; background: rgba(15,23,42,0.4);
          backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
          padding: 24px; animation: cpOverlayIn 0.25s ease both;
        }
        .modal-box {
          background: #FFFFFF; border-radius: 20px; width: 100%; max-width: 440px;
          box-shadow: 0 20px 60px rgba(15,23,42,0.18); overflow: hidden;
          animation: cpModalIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        .modal-header { padding: 24px 28px 0; }
        .modal-title { font-family: var(--font-serif), Georgia, serif; font-size: 24px; font-weight: 400; color: #0F172A; }
        .modal-body { padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 16px; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-lbl { font-size: 10.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
        .field-inp {
          width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid #E2E8F0;
          border-radius: 10px; outline: none; font-size: 13.5px; color: #0F172A;
          background: #FAFCFE; transition: all 0.2s ease;
        }
        .field-inp:focus { border-color: #0F172A; background: #FFFFFF; box-shadow: 0 0 0 3px rgba(15,23,42,0.06); }
        .field-inp.code-inp { font-family: monospace; letter-spacing: 0.08em; text-transform: uppercase; }

        .modal-actions { display: flex; gap: 12px; margin-top: 8px; }
        .cancel-btn {
          flex: 1; height: 46px; border: 1.5px solid #E2E8F0; border-radius: 10px;
          background: transparent; color: #64748B; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
        }
        .cancel-btn:hover { border-color: #CBD5E1; color: #334155; }
        
        .confirm-btn {
          flex: 1; height: 46px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, #0F172A, #1E293B); color: #FFFFFF;
          font-size: 13px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .confirm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,23,42,0.18); }
        .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Pagination Bar */
        .pagination-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; background: #FAFCFE;
          border-top: 1px solid rgba(15,23,42,0.06);
          font-size: 12.5px; color: #64748B; font-weight: 500;
        }
        .pagination-buttons { display: flex; gap: 6px; }
        .pagination-btn {
          border: 1px solid rgba(15,23,42,0.1); background: #FFFFFF;
          color: #334155; min-width: 32px; height: 32px; border-radius: 8px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .pagination-btn:hover:not(:disabled) { border-color: #0F172A; color: #0F172A; background: rgba(15,23,42,0.02); }
        .pagination-btn.active { background: #0F172A; color: #FFFFFF; border-color: #0F172A; }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

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
