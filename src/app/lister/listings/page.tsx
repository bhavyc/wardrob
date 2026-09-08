'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';
import './lister-listings.css';

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
  const [isOnboarded, setIsOnboarded] = useState(true);
  const [registrationFeePaid, setRegistrationFeePaid] = useState(true);
  const [listerStatus, setListerStatus] = useState('APPROVED');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchlistings = async () => {
    try {
      const res = await fetch('/api/lister/listings');
      const data = await res.json();
      if (res.ok && data.success) {
        setlistings(data.listings || []);
        setIsOnboarded(Boolean(data.isOnboarded));
        setRegistrationFeePaid(Boolean(data.registrationFeePaid));
        if (data.listerStatus) setListerStatus(data.listerStatus);
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
      {/* Header */}
      <div className="prod-header">
        <div>
          <h1 className="prod-h1">Your Listed Items</h1>
          <p className="prod-subtitle">Manage your wardrobe items available for rent</p>
        </div>
        {!loading && (
          !registrationFeePaid ? (
            <Link href="/lister/kyc" className="add-btn-link" style={{ background: '#D97706', borderColor: '#D97706', boxShadow: '0 2px 10px rgba(217,119,6,0.2)' }}>
              <span>💳</span> Pay ₹500 Fee to Unlock Listing
            </Link>
          ) : listerStatus !== 'APPROVED' ? (
            <Link href="/lister/kyc" className="add-btn-link" style={{ background: '#2563EB', borderColor: '#2563EB' }}>
              <span>⏳</span> KYC Verification Required
            </Link>
          ) : (
            <Link href="/lister/listings/add" className="add-btn-link">
              <span style={{ fontSize: 16 }}>+</span> List New Item
            </Link>
          )
        )}
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

      {/* Onboarding Notice Banner when fee is not paid */}
      {!loading && !registrationFeePaid && (
        <div style={{
          background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
          boxShadow: '0 4px 16px rgba(217,119,6,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px', background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0
            }}>💳</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', marginBottom: '2px' }}>
                One-Time Onboarding Fee Required (₹500)
              </div>
              <div style={{ fontSize: '12px', color: '#B45309', lineHeight: 1.4 }}>
                To maintain standard quality, trust, and verified couture on Wardrob, please complete your ₹500 registration payment and KYC.
              </div>
            </div>
          </div>
          <Link href="/lister/kyc" style={{
            background: '#D97706', color: '#FFFFFF', padding: '10px 20px', borderRadius: '10px',
            fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(217,119,6,0.25)',
          }}>
            Pay ₹500 & Verify KYC →
          </Link>
        </div>
      )}

      {/* Product List Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #DDE4DF', borderTopColor: '#2C5E43', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : listings.length === 0 ? (
        !registrationFeePaid ? (
          <div className="empty-state" style={{ borderColor: 'rgba(217,119,6,0.35)', background: '#FFFDF9' }}>
            <div className="empty-emoji">🔒</div>
            <h3 className="empty-title" style={{ color: '#92400E' }}>Registration Fee Required</h3>
            <p className="empty-desc" style={{ maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              A mandatory one-time registration fee of <strong>₹500</strong> is required before listing wardrobe pieces. Complete payment and submit KYC to unlock your boutique workspace.
            </p>
            <Link href="/lister/kyc" className="add-btn-link" style={{ margin: '0 auto', maxWidth: 'fit-content', background: '#D97706', borderColor: '#D97706' }}>
              Pay ₹500 & Proceed to KYC →
            </Link>
          </div>
        ) : listerStatus !== 'APPROVED' ? (
          <div className="empty-state" style={{ borderColor: 'rgba(37,99,235,0.3)', background: '#F8FAFF' }}>
            <div className="empty-emoji">⏳</div>
            <h3 className="empty-title" style={{ color: '#1E40AF' }}>
              {listerStatus === 'REJECTED' ? 'KYC Verification Rejected' : 'KYC Under Review'}
            </h3>
            <p className="empty-desc" style={{ maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              {listerStatus === 'REJECTED'
                ? 'Your verification documents were rejected. Please re-submit valid government ID in KYC settings.'
                : 'Your ₹500 registration fee is confirmed. Once our compliance team approves your identity documents, item listing will be activated.'}
            </p>
            <Link href="/lister/kyc" className="add-btn-link" style={{ margin: '0 auto', maxWidth: 'fit-content', background: '#2563EB', borderColor: '#2563EB' }}>
              Check KYC Status →
            </Link>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-emoji">👕</div>
            <h3 className="empty-title">No items listed yet</h3>
            <p className="empty-desc">Earn money by renting out your premium wardrobe pieces.</p>
            <Link href="/lister/listings/add" className="add-btn-link" style={{ margin: '0 auto', maxWidth: 'fit-content' }}>
              + List Your First Item
            </Link>
          </div>
        )
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
