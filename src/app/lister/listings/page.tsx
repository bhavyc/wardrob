'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  size: string;
  condition: string;
  rentalPrice: number;
  securityDeposit: number;
  baselineImages: string[];
  status: string;
  isFeatured: boolean;
  createdAt: string;
  _count?: {
    bookings: number;
  };
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  AVAILABLE: { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', dot: '#10B981', label: 'Available' },
  RENTED: { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD', dot: '#3B82F6', label: 'Rented Out' },
  AT_HUB: { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D', dot: '#F59E0B', label: 'At Hub (Cleaning)' },
  MAINTENANCE: { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5', dot: '#EF4444', label: 'Maintenance' },
  UNLISTED: { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', dot: '#6B7280', label: 'Unlisted' },
};

export default function ListerlistingsPage() {
  const [listings, setlistings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchlistings = async () => {
    try {
      const res = await fetch('/api/lister/listings');
      const data = await res.json();
      if (res.ok && data.success) {
        setlistings(data.listings || []);
      } else {
        setError(data.error || 'Failed to load listings.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchlistings(); }, []);

  const handleWithdraw = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw this item? A courier will return it from the Hub to your address, and it will be Unlisted.')) return;
    
    try {
      const res = await fetch(`/api/lister/listings/${id}/withdraw`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchlistings();
      } else {
        alert(data.error || 'Failed to withdraw item');
      }
    } catch (e) {
      alert('Network error while requesting withdrawal.');
    }
  };

  const totalPages = Math.ceil(listings.length / ITEMS_PER_PAGE);
  const paginatedlistings = listings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, listings.length);

  return (
    <>
      <style>{`
        @keyframes prodFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes rowExpand {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 380px; }
        }

        .prod-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 28px; flex-wrap: wrap; gap: 16px;
          animation: prodFadeUp 0.4s ease both;
        }
        .prod-h1 {
          font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-size: 32px; font-weight: 400; color: #0D1A14; line-height: 1.1; margin-bottom: 4px;
        }
        .prod-subtitle { font-size: 13px; color: #74897C; }

        .add-btn-link {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #2C5E43, #1E4D33);
          color: #FFFFFF; border: none; border-radius: 12px;
          padding: 12px 22px; font-size: 13px; font-weight: 700;
          letter-spacing: 0.04em; cursor: pointer; text-decoration: none;
          transition: all 0.25s ease; white-space: nowrap;
          box-shadow: 0 4px 12px rgba(44,94,67,0.15);
        }
        .add-btn-link:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(44,94,67,0.28); }

        .stats-row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
          margin-bottom: 28px;
          animation: prodFadeUp 0.4s ease 0.08s both;
        }
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr; }
        }
        .stat-card {
          background: #FFFFFF; border-radius: 16px;
          padding: 20px 24px; border: 1px solid rgba(44,94,67,0.08);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(44,94,67,0.04);
          display: flex; align-items: center; gap: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(44,94,67,0.1);
        }
        .stat-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; font-size: 20px;
          flex-shrink: 0;
        }
        .stat-num { font-size: 28px; font-weight: 700; color: #0D1A14; line-height: 1; }
        .stat-lbl { font-size: 12px; color: #74897C; margin-top: 3px; font-weight: 500; }

        .alert-banner {
          padding: 14px 18px; border-radius: 12px; margin-bottom: 20px;
          font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 10px;
          animation: prodFadeUp 0.3s ease both;
        }
        .alert-error { background: #FFF5F5; border: 1px solid #FEB2B2; color: #C53030; }

        .prod-table-wrap {
          background: #FFFFFF; border-radius: 20px;
          border: 1px solid rgba(44,94,67,0.08);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(44,94,67,0.04);
          overflow: hidden;
          animation: prodFadeUp 0.4s ease 0.16s both;
        }
        .prod-table-head {
          display: grid; grid-template-columns: 60px 2fr 1fr 1fr 1.2fr auto;
          gap: 16px; padding: 14px 24px;
          background: #F8FAF8; border-bottom: 1px solid rgba(44,94,67,0.07);
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #74897C; align-items: center;
        }
        @media (max-width: 768px) {
          .prod-table-head { display: none; }
        }

        .prod-row-wrapper {
          border-bottom: 1px solid rgba(44,94,67,0.05);
        }
        .prod-row-wrapper:last-child { border-bottom: none; }

        .prod-row {
          display: grid; grid-template-columns: 60px 2fr 1fr 1fr 1.2fr auto;
          gap: 16px; padding: 16px 24px;
          align-items: center; cursor: pointer;
          transition: background 0.15s ease;
        }
        .prod-row:hover { background: #FAFBFA; }
        @media (max-width: 768px) {
          .prod-row { grid-template-columns: 1fr; gap: 10px; padding: 20px; }
          .prod-thumb { width: 100%; height: 160px; }
        }

        .prod-thumb {
          width: 44px; height: 54px; border-radius: 8px;
          background: #F0F4F1; border: 1px solid rgba(44,94,67,0.08);
          overflow: hidden; display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .prod-title-main { font-size: 14px; font-weight: 600; color: #1C2E24; margin-bottom: 4px; }
        .prod-title-sub { font-size: 11px; color: #74897C; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        
        .collection-badge {
          display: inline-flex; align-items: center;
          padding: 2px 8px; border-radius: 100px; font-size: 9.5px; font-weight: 700;
          background: #E8EDE9; color: #2C5E43; border: 1px solid rgba(44,94,67,0.08);
        }

        .size-chip {
          padding: 2px 7px; border-radius: 5px; font-size: 9px;
          font-weight: 700; background: #EEF2EF; color: #3D5347;
          border: 1px solid rgba(44,94,67,0.12);
        }
        .price-text { font-size: 14px; font-weight: 700; color: #2C5E43; }
        
        .status-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; border-radius: 100px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.04em; border: 1px solid;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }

        /* Expand Panel */
        .prod-expand-panel {
          background: #FAFDFB; border-top: 1px solid rgba(44,94,67,0.04);
          padding: 20px 24px; display: grid; grid-template-columns: 1fr 1fr;
          gap: 32px; animation: rowExpand 0.25s ease both;
        }
        @media (max-width: 768px) {
          .prod-expand-panel { grid-template-columns: 1fr; gap: 20px; }
        }
        .exp-section { display: flex; flex-direction: column; gap: 6px; }
        .exp-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #AEC0B4; margin-bottom: 2px; }
        .exp-value { font-size: 13px; color: #1C2E24; line-height: 1.6; }

        .empty-state {
          padding: 80px 40px; text-align: center;
          background: #FFFFFF; border-radius: 20px;
          border: 2px dashed rgba(44,94,67,0.15);
          animation: prodFadeUp 0.4s ease 0.16s both;
        }
        .empty-emoji { font-size: 48px; margin-bottom: 16px; }
        .empty-title {
          font-family: var(--font-cormorant), serif;
          font-size: 24px; font-weight: 400; color: #163625; margin-bottom: 8px;
        }
        .empty-desc { font-size: 13px; color: #74897C; margin-bottom: 24px; }

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
      <div className="prod-header">
        <div>
          <h1 className="prod-h1">Your Listed Items</h1>
          <p className="prod-subtitle">Manage your wardrobe items available for rent</p>
        </div>
        <Link href="/lister/listings/add" className="add-btn-link">
          <span style={{ fontSize: 16 }}>+</span> List New Item
        </Link>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(44,94,67,0.08)', color: '#2C5E43' }}>🧥</div>
          <div>
            <div className="stat-num">{loading ? '—' : listings.length}</div>
            <div className="stat-lbl">Total Items Listed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ECFDF5', color: '#059669' }}>💸</div>
          <div>
            <div className="stat-num">{loading ? '—' : listings.filter(l => l.status === 'RENTED').length}</div>
            <div className="stat-lbl">Currently Rented Out</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>📦</div>
          <div>
            <div className="stat-num">{loading ? '—' : listings.filter(l => l.status === 'AT_HUB').length}</div>
            <div className="stat-lbl">At Hub (Cleaning)</div>
          </div>
        </div>
      </div>

      {/* Alert info */}
      {error && <div className="alert-banner alert-error"><span>⚠</span>{error}</div>}

      {/* Product List Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #DDE4DF', borderTopColor: '#2C5E43', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">👕</div>
          <h3 className="empty-title">No items listed yet</h3>
          <p className="empty-desc">Earn money by renting out your premium wardrobe pieces.</p>
          <Link href="/lister/listings/add" className="add-btn-link" style={{ margin: '0 auto', maxWidth: 'fit-content' }}>
            + List Your First Item
          </Link>
        </div>
      ) : (
        <div className="prod-table-wrap">
          <div className="prod-table-head">
            <span>Photo</span>
            <span>Item Details</span>
            <span>Package Rent</span>
            <span>Security Dep.</span>
            <span>Status</span>
            <span>Toggle</span>
          </div>
          {paginatedlistings.map(listing => {
            const cfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.UNLISTED;
            const isExpanded = expandedId === listing.id;
            return (
              <div key={listing.id} className="prod-row-wrapper">
                {/* Row Summary */}
                <div className="prod-row" onClick={() => setExpandedId(isExpanded ? null : listing.id)}>
                  <div className="prod-thumb">
                    {listing.baselineImages?.[0]
                      ? <img src={listing.baselineImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '👗'
                    }
                  </div>
                  <div>
                    <div className="prod-title-main">{listing.title}</div>
                    <div className="prod-title-sub">
                      <span className="collection-badge">{listing.category}</span>
                      <span className="size-chip">{listing.size}</span>
                      <span style={{ fontSize: '10px', marginLeft: '6px' }}>• {listing.condition}</span>
                    </div>
                  </div>
                  <div className="price-text">₹{Number(listing.rentalPrice).toLocaleString('en-IN')}</div>
                  <div className="price-text" style={{ color: '#74897C', fontWeight: 500 }}>₹{Number(listing.securityDeposit).toLocaleString('en-IN')}</div>
                  <div>
                    <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                      <span className="status-dot" style={{ background: cfg.dot }} />
                      {cfg.label}
                    </span>
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

                {/* Row Expanded attributes */}
                {isExpanded && (
                  <div className="prod-expand-panel">
                    <div className="exp-section">
                      <span className="exp-label">Item Description & History</span>
                      <p className="exp-value">{listing.description || 'No description provided.'}</p>
                    </div>
                    <div className="exp-section">
                      <span className="exp-label">Total Rental Bookings</span>
                      <p className="exp-value" style={{ fontWeight: 700 }}>{listing._count?.bookings || 0} Bookings</p>
                    </div>
                    {listing.status === 'AT_HUB' && (
                      <div className="exp-section" style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '24px' }}>
                        <span className="exp-label" style={{ color: '#92400E' }}>Hub Storage Option</span>
                        <button 
                          onClick={() => handleWithdraw(listing.id)}
                          style={{
                            marginTop: '8px', padding: '10px 16px', background: '#FFFBEB', color: '#92400E',
                            border: '1px solid #FCD34D', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
                            letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#FEF3C7'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#FFFBEB'}
                        >
                          Withdraw Item (Leg 4)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={listings.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
