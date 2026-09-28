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

  const [filterStatus, setFilterStatus] = useState<string>('ALL');

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

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    if (currentStatus === 'RENTED' || currentStatus === 'AT_HUB') {
      alert(`Cannot change status of an outfit that is currently ${currentStatus === 'RENTED' ? 'rented' : 'at the hub'}.`);
      return;
    }
    const newStatus = currentStatus === 'UNLISTED' ? 'AVAILABLE' : 'UNLISTED';
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    try {
      const res = await fetch(`/api/lister/listings/${id}/status`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchlistings();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (e) {
      alert('Network error while updating status.');
    }
  };

  const filteredListings = listings.filter(item => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
  const paginatedlistings = filteredListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      {/* Header */}
      <div className="prod-header">
        <div className="prod-header-text">
          <h1 className="prod-h1">Wardrobe Listings</h1>
          <p className="prod-subtitle">Manage pieces available for rental</p>
        </div>
        {!loading && (
          !registrationFeePaid ? (
            <Link href="/lister/kyc" className="add-btn-link add-btn-warning">
              <span>💳</span> Pay ₹500
            </Link>
          ) : listerStatus !== 'APPROVED' ? (
            <Link href="/lister/kyc" className="add-btn-link add-btn-pending">
              <span>⏳</span> KYC Required
            </Link>
          ) : (
            <Link href="/lister/listings/add" className="add-btn-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add Outfit</span>
            </Link>
          )
        )}
      </div>

      {/* Interactive Luxury Filter Pills */}
      <div className="stats-pills-row">
        <button 
          className={`stat-pill-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => { setFilterStatus('ALL'); setCurrentPage(1); }}
        >
          All <span className="stat-pill-count">{listings.length}</span>
        </button>
        <button 
          className={`stat-pill-btn ${filterStatus === 'AVAILABLE' ? 'active' : ''}`}
          onClick={() => { setFilterStatus('AVAILABLE'); setCurrentPage(1); }}
        >
          Available <span className="stat-pill-count">{listings.filter(l => l.status === 'AVAILABLE').length}</span>
        </button>
        <button 
          className={`stat-pill-btn ${filterStatus === 'RENTED' ? 'active' : ''}`}
          onClick={() => { setFilterStatus('RENTED'); setCurrentPage(1); }}
        >
          Rented <span className="stat-pill-count">{listings.filter(l => l.status === 'RENTED').length}</span>
        </button>
        <button 
          className={`stat-pill-btn ${filterStatus === 'AT_HUB' ? 'active' : ''}`}
          onClick={() => { setFilterStatus('AT_HUB'); setCurrentPage(1); }}
        >
          At Hub <span className="stat-pill-count">{listings.filter(l => l.status === 'AT_HUB').length}</span>
        </button>
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

      {/* Product List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #DDE4DF', borderTopColor: '#2C5E43', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">👗</div>
          <h3 className="empty-title">
            {filterStatus === 'ALL' ? 'No items listed yet' : `No items ${filterStatus.toLowerCase()}`}
          </h3>
          <p className="empty-desc">
            {filterStatus === 'ALL' 
              ? 'Earn revenue by listing your luxury wardrobe pieces for rent.'
              : 'Try selecting a different filter above.'}
          </p>
          {filterStatus === 'ALL' && (
            <Link href="/lister/listings/add" className="add-btn-link" style={{ margin: '0 auto', maxWidth: 'fit-content' }}>
              + List Your First Item
            </Link>
          )}
        </div>
      ) : (
        <div className="listings-container">
          {paginatedlistings.map(listing => {
            const cfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.UNLISTED;
            const isExpanded = expandedId === listing.id;
            return (
              <div key={listing.id} className="listing-card">
                {/* Main Card */}
                <div className="listing-card-body" onClick={() => setExpandedId(isExpanded ? null : listing.id)}>
                  {/* Left: Thumbnail Media */}
                  <div className="listing-card-media">
                    {listing.baselineImages?.[0] ? (
                      <img 
                        src={listing.baselineImages[0]} 
                        alt={listing.title}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.listing-card-media-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="listing-card-media-fallback"
                      style={{ display: listing.baselineImages?.[0] ? 'none' : 'flex' }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                        <path d="M12 2a3 3 0 0 0-3 3c0 .8.3 1.5.8 2.1L3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6l-6.8-5.9c.5-.6.8-1.3.8-2.1a3 3 0 0 0-3-3z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Right: Info Column */}
                  <div className="listing-card-content">
                    {/* Top: Status Badge & Chevron */}
                    <div className="listing-card-header-row">
                      <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                        <span className="status-dot" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                      <div className="listing-card-chevron">
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#94A3B8" strokeWidth="2.5"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
                        >
                          <path d="M6 9L12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="listing-card-title">{listing.title}</h3>

                    {/* Meta: Category • Size • Condition */}
                    <div className="listing-card-meta">
                      <span className="meta-category">{listing.category}</span>
                      <span className="meta-dot">•</span>
                      <span>Size {listing.size}</span>
                      <span className="meta-dot">•</span>
                      <span>{listing.condition}</span>
                    </div>

                    {/* Price Row */}
                    <div className="listing-card-price-row">
                      <div className="listing-price-main">
                        <span className="listing-price-val">₹{Number(listing.rentalPrice).toLocaleString('en-IN')}</span>
                        <span className="listing-price-sub">/ 4 days</span>
                      </div>
                      <div className="listing-deposit-tag">
                        Dep: ₹{Number(listing.securityDeposit).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="listing-card-expanded">
                    <div className="exp-section">
                      <span className="exp-label">Description & Details</span>
                      <p className="exp-value">{listing.description || 'No description provided.'}</p>
                    </div>
                    <div className="exp-stats-row">
                      <div className="exp-stat-box">
                        <span className="exp-label">Total Bookings</span>
                        <span className="exp-stat-num">{listing._count?.bookings || 0} Bookings</span>
                      </div>
                      <div className="exp-stat-box">
                        <span className="exp-label">Security Deposit</span>
                        <span className="exp-stat-num">₹{Number(listing.securityDeposit).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="exp-actions">
                      {listing.status === 'AVAILABLE' || listing.status === 'UNLISTED' ? (
                        <button 
                          onClick={() => handleToggleStatus(listing.id, listing.status)}
                          className="btn-status-toggle"
                          style={{
                            background: listing.status === 'AVAILABLE' ? '#FEF2F2' : '#ECFDF5', 
                            color: listing.status === 'AVAILABLE' ? '#991B1B' : '#065F46',
                            borderColor: listing.status === 'AVAILABLE' ? '#FCA5A5' : '#6EE7B7', 
                          }}
                        >
                          {listing.status === 'AVAILABLE' ? '🔒 Unlist Item' : '✨ Publish Item'}
                        </button>
                      ) : (
                        <div className="exp-status-hint">
                          Status cannot be toggled while item is {listing.status.toLowerCase()}.
                        </div>
                      )}
                      {listing.status === 'AT_HUB' && (
                        <button 
                          onClick={() => handleWithdraw(listing.id)}
                          className="btn-withdraw"
                        >
                          Withdraw Item from Hub
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredListings.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
