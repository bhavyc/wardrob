'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import './profile.css';

type Shipment = { id: string; leg: string; trackingNumber: string | null; courierName: string | null; status: string; };
type DamageReport = { id: string; inspectionType: string; grade: string; deductionAmount: number; isDisputed: boolean; dispute?: { status: string } | null; };
type Booking = {
  id: string; createdAt: string; startDate: string; endDate: string; status: string; rentAmount: number; securityDeposit: number; totalAmount: number; lateReturnPenalty: number;
  product?: { title: string; images: string[]; Lister?: { shopName: string; }; };
  listing?: { title: string; baselineImages: string[]; lister?: { shopName: string; }; };
  shipments: Shipment[]; damageReports: DamageReport[];
  reviews?: { id: string; rating: number; comment: string; reviewerId: string }[];
};

type UserProfile = { id: string; name: string; email: string; phone: string; role: string; walletBalance: number; };

export default function CustomerProfile() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rentals' | 'wallet'>('rentals');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED' | 'DISPUTED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;
  
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualReturn = async (bookingId: string) => {
    if (!confirm('Are you sure you want to schedule an early return pickup? A concierge courier will be dispatched.')) return;
    try {
      const res = await fetch('/api/orders/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Return scheduled successfully. Our concierge courier will contact you for doorstep pickup.');
        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } else {
        alert(data.error || 'Failed to schedule return.');
      }
    } catch (e) {
      alert('An error occurred while scheduling return.');
    }
  };

  const handleRatingSubmit = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating: ratingValue, comment: ratingComment })
      });
      const data = await res.json();
      if (data.success) {
        alert('Review submitted successfully.');
        setRatingBookingId(null);
        setRatingValue(5);
        setRatingComment('');
        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } else {
        if (data.error?.includes('already submitted')) {
          setRatingBookingId(null);
          const bRes = await fetch('/api/user/bookings');
          if (bRes.ok) {
            const bData = await bRes.json();
            if (bData.success) setBookings(bData.bookings);
          }
        }
        alert(data.error || 'Failed to submit review.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  const handleDisputeSubmit = async (bookingId: string) => {
    if (!disputeReason.trim()) return alert('Please enter a reason for the dispute.');
    try {
      const res = await fetch(`/api/user/bookings/${bookingId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Dispute submitted successfully. Our trust & safety team will review this within 24 hours.');
        setDisputeBookingId(null);
        setDisputeReason('');
        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } else {
        alert(data.error || 'Failed to submit dispute.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const sRes = await fetch('/api/auth/session');
        const sData = await sRes.json();
        if (sData.success && sData.user) {
          setProfile(sData.user);
        } else {
          router.push('/login');
          return;
        }

        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } catch (err) {
        console.error('Data loading error', err);
      } finally {
        setLoading(false);
      }
    };
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    loadData();
    return () => { document.body.removeChild(script); };
  }, [router]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const item: any = b.product || b.listing;
      const title = (item?.title || '').toLowerCase();
      const lister = (item?.Lister?.shopName || item?.lister?.shopName || '').toLowerCase();
      const regId = (b.id || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesQuery = !q || title.includes(q) || lister.includes(q) || regId.includes(q);
      if (!matchesQuery) return false;

      if (statusFilter === 'ACTIVE') {
        return ['IN_USE', 'DISPATCHED', 'SHIPPED', 'HUB_DELIVERED', 'PICKUP_SCHEDULED'].includes(b.status);
      }
      if (statusFilter === 'CONFIRMED') {
        return ['CONFIRMED', 'PENDING_DISPATCH', 'PENDING', 'ORDERED'].includes(b.status);
      }
      if (statusFilter === 'COMPLETED') {
        return b.status === 'COMPLETED';
      }
      if (statusFilter === 'DISPUTED') {
        return b.damageReports?.some(dr => dr.isDisputed || dr.dispute);
      }
      return true;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Paginated Sliced Bookings
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      active: bookings.filter(b => ['IN_USE', 'DISPATCHED', 'SHIPPED', 'HUB_DELIVERED', 'PICKUP_SCHEDULED'].includes(b.status)).length,
      confirmed: bookings.filter(b => ['CONFIRMED', 'PENDING_DISPATCH', 'PENDING', 'ORDERED'].includes(b.status)).length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      disputed: bookings.filter(b => b.damageReports?.some(dr => dr.isDisputed || dr.dispute)).length,
    };
  }, [bookings]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAF7F2' }}>
      <RenterNavbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s infinite' }} />
          <span>Accessing Luxury Dossier…</span>
        </div>
      </main>
      <RenterFooter />
    </div>
  );
  if (!profile) return null;

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAF7F2', color: 'var(--ink)' }}>
      <RenterNavbar />

      <main className="prof-main">
        
        {/* ━━━ LEFT PROFILE DOSSIER SIDEBAR ━━━ */}
        <aside className="prof-sidebar-card">
          {/* Avatar & User Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1E1E2D 0%, #3B3B4F 100%)',
              color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700,
              boxShadow: '0 4px 12px rgba(30, 30, 45, 0.12)', flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.name}
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile.email}
              </p>
            </div>
          </div>

          {/* Quick Stat Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '16px', background: '#FAF7F2', padding: '8px 10px', borderRadius: '12px', border: '1px solid rgba(226, 214, 206, 0.7)' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Reservations</span>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--ink)' }}>{counts.all}</strong>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(226, 214, 206, 0.8)' }}>
              <span style={{ fontSize: '8.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Active</span>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--accent)' }}>{counts.active}</strong>
            </div>
          </div>
            
          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', borderTop: '1px solid rgba(226, 214, 206, 0.8)', paddingTop: '14px' }}>
            <button 
              onClick={() => setActiveTab('rentals')}
              className={`prof-nav-btn ${activeTab === 'rentals' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👗</span>
                <span>Rentals Archive</span>
              </span>
              <span style={{
                background: activeTab === 'rentals' ? 'rgba(255,255,255,0.2)' : 'rgba(30, 30, 45, 0.06)',
                padding: '2px 7px', borderRadius: '999px', fontSize: '10px'
              }}>
                {counts.all}
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`prof-nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💳</span>
                <span>Vault Guarantee</span>
              </span>
              <span style={{
                background: activeTab === 'wallet' ? 'rgba(255,255,255,0.2)' : 'rgba(30, 30, 45, 0.06)',
                padding: '2px 7px', borderRadius: '999px', fontSize: '10px'
              }}>
                ₹{Number(profile.walletBalance).toLocaleString('en-IN')}
              </span>
            </button>
          </nav>
        </aside>

        {/* ━━━ RIGHT CONTENT AREA ━━━ */}
        <div style={{ width: '100%', minWidth: 0 }}>
          {activeTab === 'rentals' ? (
            <div>
              {/* Header Luxury Banner */}
              <div className="prof-header-card">
                <div className="prof-header-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 className="prof-page-title">Rentals Archive</h1>
                    <span className="prof-res-badge">{counts.all} {counts.all === 1 ? 'Dossier' : 'Dossiers'}</span>
                  </div>
                  <Link href="/catalog" className="prof-cta-btn">
                    <span>+ Reserve New Couture</span>
                    <span style={{ fontSize: '13px' }}>→</span>
                  </Link>
                </div>
                <p className="prof-page-subtitle">
                  Track ongoing designer reservations, courier logistics & security deposit settlements.
                </p>
              </div>
              
              {/* ── SEARCH & FILTER TOOLBAR ── */}
              <div className="prof-toolbar">
                {/* Search Bar */}
                <div className="prof-search-wrapper">
                  <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: 'var(--text-muted)' }}>
                    🔍
                  </span>
                  <input
                    type="text"
                    className="prof-search-input"
                    placeholder="Search outfit, designer, ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(30, 30, 45, 0.08)', border: 'none', borderRadius: '50%',
                        width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', cursor: 'pointer', color: 'var(--ink)'
                      }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status Filter Pills (Horizontal Touch Carousel) */}
                <div className="prof-filter-pills">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`prof-filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                  >
                    All <span>({counts.all})</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`prof-filter-pill ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                  >
                    Active <span>({counts.active})</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('CONFIRMED')}
                    className={`prof-filter-pill ${statusFilter === 'CONFIRMED' ? 'active' : ''}`}
                  >
                    Confirmed <span>({counts.confirmed})</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('COMPLETED')}
                    className={`prof-filter-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
                  >
                    Completed <span>({counts.completed})</span>
                  </button>
                  {counts.disputed > 0 && (
                    <button
                      onClick={() => setStatusFilter('DISPUTED')}
                      className={`prof-filter-pill ${statusFilter === 'DISPUTED' ? 'active' : ''}`}
                    >
                      Disputed <span>({counts.disputed})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── BOOKING CARDS LIST ── */}
              {filteredBookings.length === 0 ? (
                <div style={{
                  background: '#FFFFFF', borderRadius: '18px', padding: '48px 20px',
                  textAlign: 'center', border: '1px solid rgba(226, 214, 206, 0.85)',
                  boxShadow: '0 4px 16px rgba(30, 30, 45, 0.02)'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👗</div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                    {searchQuery ? 'No matching reservations found' : 'No active rentals archive'}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px' }}>
                    {searchQuery
                      ? `No bookings match "${searchQuery}". Try a different keyword or reset filters.`
                      : 'You do not have any active or past designer reservations in this category.'}
                  </p>
                  {searchQuery ? (
                    <button
                      onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                      style={{
                        background: '#1E1E2D', color: '#FFFFFF', padding: '8px 20px',
                        borderRadius: '999px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer'
                      }}
                    >
                      Clear Search & Filters
                    </button>
                  ) : (
                    <Link
                      href="/catalog"
                      style={{
                        background: '#1E1E2D', color: '#FFFFFF', padding: '10px 24px', borderRadius: '999px',
                        fontSize: '11.5px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex'
                      }}
                    >
                      Browse Haute Couture Collection →
                    </Link>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {paginatedBookings.map(b => {
                    const item: any = b.product || b.listing;
                    const img = item?.images?.[0] || item?.baselineImages?.[0] || '/images/hero-bg.png';
                    const title = item?.title || 'Luxury Designer Archive';
                    const lister = item?.Lister?.shopName || item?.lister?.shopName || 'Certified Atelier';
                    const shortId = b.id.substring(0, 8).toUpperCase();
                    
                    return (
                      <div key={b.id} className="prof-booking-card">
                        {/* 1. Card Top Bar */}
                        <div className="prof-card-top-bar">
                          <span className="prof-atelier-tag">
                            ✨ {lister}
                          </span>
                          <StatusBadge status={b.status} size="sm" />
                        </div>

                        {/* 2. Main Row: Thumbnail + Details */}
                        <div className="prof-card-main-row">
                          <div className="prof-card-thumb-wrap">
                            <img
                              src={img}
                              alt={title}
                              className="prof-card-thumb"
                              onError={(e: any) => { e.target.src = '/images/hero-bg.png'; }}
                            />
                            <span className="prof-duration-badge">4-DAY</span>
                          </div>

                          <div className="prof-card-details">
                            <h3 className="prof-card-title">{title}</h3>
                            
                            <div className="prof-meta-grid">
                              <div className="prof-meta-chip">
                                <span className="prof-meta-label">ID</span>
                                <strong className="prof-meta-val">#{shortId}</strong>
                                <button
                                  onClick={() => handleCopyId(b.id)}
                                  className="prof-copy-btn"
                                  title="Copy Booking ID"
                                >
                                  {copiedId === b.id ? '✓' : '📋'}
                                </button>
                              </div>

                              <div className="prof-meta-chip">
                                <span className="prof-meta-label">Event</span>
                                <strong className="prof-meta-val">
                                  {new Date(b.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </strong>
                              </div>

                              <div className="prof-meta-chip" style={{ background: 'rgba(212, 86, 122, 0.06)', borderColor: 'rgba(212, 86, 122, 0.2)' }}>
                                <span className="prof-meta-label" style={{ color: '#D4567A' }}>Package</span>
                                <strong className="prof-meta-val" style={{ color: '#D4567A' }}>₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Tracking Banner (if active) */}
                        {b.shipments && b.shipments.length > 0 && (
                          <div className="prof-tracking-banner">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🚚</span>
                              <span>
                                <strong>{b.shipments[0].courierName || 'Courier'}</strong> #{b.shipments[0].trackingNumber || 'Assigned'}
                              </span>
                            </div>
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                              {b.shipments[0].status}
                            </span>
                          </div>
                        )}

                        {/* 4. Action Button for Early Return */}
                        {b.status === 'IN_USE' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleManualReturn(b.id)}
                              style={{
                                background: '#1E1E2D', color: '#FFFFFF', padding: '8px 18px',
                                borderRadius: '999px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.04em',
                                textTransform: 'uppercase', cursor: 'pointer', border: 'none'
                              }}
                            >
                              Schedule Early Return Pickup →
                            </button>
                          </div>
                        )}

                        {/* 5. Completed Settlement / Rating Flow */}
                        {b.status === 'COMPLETED' && (
                          <div className="prof-refund-box">
                            <h4 style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', color: 'var(--ink)' }}>
                              Deposit Refund Settlement
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)' }}>
                                <span>Initial Security Deposit</span>
                                <span>₹{b.securityDeposit.toLocaleString('en-IN')}</span>
                              </div>
                              {b.damageReports?.map(dr => dr.deductionAmount > 0 && (
                                <div key={dr.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                                  <span>Damage Deduction ({dr.grade})</span>
                                  <span>-₹{Number(dr.deductionAmount).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                              {b.lateReturnPenalty > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#DC2626' }}>
                                  <span>Late Fee Deductions</span>
                                  <span>-₹{b.lateReturnPenalty.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--ink)', borderTop: '1px solid rgba(226, 214, 206, 0.8)', paddingTop: '6px', marginTop: '3px' }}>
                                <span>Refunded to Vault Wallet</span>
                                <span style={{ color: '#059669', fontSize: '12.5px' }}>
                                  ₹{(b.securityDeposit - b.lateReturnPenalty - (b.damageReports?.reduce((sum, dr) => sum + Number(dr.deductionAmount), 0) || 0)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                            
                            {/* Renter Rating Flow */}
                            {(() => {
                              const submittedReview = b.reviews?.find(r => r.reviewerId === profile?.id) || (b.reviews && b.reviews.length > 0 ? b.reviews[0] : null);
                              if (submittedReview) {
                                return (
                                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(226, 214, 206, 0.8)' }}>
                                    <h4 style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px', color: 'var(--text-muted)' }}>Your Experience Rating</h4>
                                    <div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '12px' }}>
                                      {Array(submittedReview.rating).fill('★').join('')}
                                    </div>
                                    {submittedReview.comment && <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', marginTop: '2px', fontStyle: 'italic' }}>"{submittedReview.comment}"</p>}
                                  </div>
                                );
                              }

                              const isRating = ratingBookingId === b.id;
                              if (isRating) {
                                return (
                                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(226, 214, 206, 0.8)' }}>
                                    <h4 style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', color: 'var(--ink)' }}>Rate Atelier & Outfit</h4>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                      {[1,2,3,4,5].map(star => (
                                        <button 
                                          key={star} 
                                          onClick={() => setRatingValue(star)} 
                                          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: star <= ratingValue ? '#F59E0B' : '#E2D6CE', padding: 0 }}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                    <textarea 
                                      placeholder="Add an optional review for the atelier..." 
                                      value={ratingComment} 
                                      onChange={e => setRatingComment(e.target.value)} 
                                      style={{ width: '100%', padding: '6px 8px', border: '1px solid rgba(226, 214, 206, 0.9)', borderRadius: '6px', fontSize: '11.5px', marginBottom: '6px', minHeight: '44px', outline: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      <button onClick={() => handleRatingSubmit(b.id)} style={{ background: '#1E1E2D', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '999px', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}>Submit</button>
                                      <button onClick={() => { setRatingBookingId(null); setRatingValue(5); setRatingComment(''); }} style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid rgba(226, 214, 206, 0.9)', padding: '6px 12px', borderRadius: '999px', fontSize: '9.5px', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(226, 214, 206, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>How was the fit?</span>
                                  <button 
                                    onClick={() => setRatingBookingId(b.id)} 
                                    style={{ background: '#1E1E2D', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '999px', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}
                                  >
                                    ★ Rate Atelier
                                  </button>
                                </div>
                              );
                            })()}
                            
                            {/* Renter Dispute Flow */}
                            {(() => {
                              const deductibleReport = b.damageReports?.find(dr => dr.deductionAmount > 0);
                              if (!deductibleReport) return null;
                              
                              if (deductibleReport.dispute) {
                                return (
                                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(226, 214, 206, 0.8)', fontSize: '10px', color: '#DC2626', fontWeight: 700 }}>
                                    DISPUTE: {deductibleReport.dispute.status}
                                  </div>
                                );
                              }
                              const isDisputing = disputeBookingId === b.id;

                              return (
                                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed rgba(226, 214, 206, 0.8)' }}>
                                  {!isDisputing ? (
                                    <button 
                                      onClick={() => setDisputeBookingId(b.id)}
                                      style={{ background: 'transparent', border: '1px solid rgba(220, 38, 38, 0.3)', padding: '4px 8px', borderRadius: '999px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: '#DC2626' }}
                                    >
                                      Dispute Deduction
                                    </button>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                      <textarea 
                                        value={disputeReason}
                                        onChange={e => setDisputeReason(e.target.value)}
                                        placeholder="Explain dispute reason..."
                                        style={{ width: '100%', padding: '6px', border: '1px solid rgba(226, 214, 206, 0.9)', borderRadius: '6px', background: '#FFF', fontSize: '11px', minHeight: '44px', outline: 'none' }}
                                      />
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                          onClick={() => handleDisputeSubmit(b.id)}
                                          style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '5px 12px', borderRadius: '999px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                                        >
                                          Submit
                                        </button>
                                        <button 
                                          onClick={() => { setDisputeBookingId(null); setDisputeReason(''); }}
                                          style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '5px 8px', fontSize: '9px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── PAGINATION CONTROLS ── */}
              {filteredBookings.length > ITEMS_PER_PAGE && (
                <div style={{ marginTop: '24px' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredBookings.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          ) : (
            /* ━━━ PLATFORM WALLET TAB ━━━ */
            <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '30px 24px', border: '1px solid rgba(226, 214, 206, 0.85)', boxShadow: '0 8px 24px rgba(30, 30, 45, 0.03)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                Vault Guarantee Ledger
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', marginBottom: '24px' }}>
                Transparent balance management for rental security deposit returns and platform credits.
              </p>
              
              <div style={{ borderTop: '1px solid rgba(226, 214, 206, 0.8)', borderBottom: '1px solid rgba(226, 214, 206, 0.8)', padding: '24px 0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Available Vault Capital
                    </span>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 700, color: '#059669', lineHeight: 1 }}>
                      ₹{Number(profile.walletBalance).toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <div style={{ width: '1px', height: '44px', background: 'rgba(226, 214, 206, 0.8)' }} />
                  
                  <div>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Linked Registered Phone
                    </span>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                      {profile.phone}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', color: 'var(--ink)' }}>
                  Platform Usage & Guarantee Rules
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: '580px', margin: 0 }}>
                  This vault wallet securely holds your security deposit refunds and cancellation credits. 
                  Balances are automatically applied toward your next haute couture rental checkout without any manual transfer steps.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

      <RenterFooter />
    </div>
  );
}
