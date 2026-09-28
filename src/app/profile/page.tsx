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
  refund?: { id: string; amount: number; status: string; gateway: string; gatewayRefundId: string | null } | null;
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
          <div className="prof-user-strip">
            <div className="prof-avatar">
              {initials}
            </div>
            <div className="prof-user-details">
              <h2 className="prof-user-name">
                {profile.name}
              </h2>
              <p className="prof-user-email">
                {profile.email}
              </p>
            </div>
          </div>

          {/* Quick Stat Tiles */}
          <div className="prof-quick-stats">
            <div className="prof-stat-tile">
              <span className="prof-stat-label">Reservations</span>
              <strong className="prof-stat-val">{counts.all}</strong>
            </div>
            <div className="prof-stat-tile prof-stat-tile-active">
              <span className="prof-stat-label">Active</span>
              <strong className="prof-stat-val prof-stat-val-accent">{counts.active}</strong>
            </div>
          </div>
            
          {/* Navigation Tabs */}
          <nav className="prof-nav-tabs">
            <button 
              onClick={() => setActiveTab('rentals')}
              className={`prof-nav-btn ${activeTab === 'rentals' ? 'active' : ''}`}
            >
              <span className="prof-nav-btn-left">
                <span>👗</span>
                <span>Rentals Archive</span>
              </span>
              <span className="prof-nav-badge">
                {counts.all}
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`prof-nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
            >
              <span className="prof-nav-btn-left">
                <span>💳</span>
                <span>Vault Guarantee</span>
              </span>
              <span className="prof-nav-badge">
                ₹{Number(profile.walletBalance).toLocaleString('en-IN')}
              </span>
            </button>
          </nav>
        </aside>

        {/* ━━━ RIGHT CONTENT AREA ━━━ */}
        <div className="prof-content-area">
          {activeTab === 'rentals' ? (
            <div>
              {/* Header Luxury Banner */}
              <div className="prof-header-card">
                <div className="prof-header-top">
                  <div className="prof-header-title-wrap">
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

                              {(() => {
                                const deliveryDate = new Date(b.startDate);
                                const returnDate = new Date(b.endDate);
                                const eventDate = new Date(returnDate);
                                eventDate.setDate(eventDate.getDate() - 2);

                                return (
                                  <>
                                    <div className="prof-meta-chip">
                                      <span className="prof-meta-label">Event</span>
                                      <strong className="prof-meta-val">
                                        {eventDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                      </strong>
                                    </div>
                                    <div className="prof-meta-chip">
                                      <span className="prof-meta-label">Delivery By</span>
                                      <strong className="prof-meta-val">
                                        {deliveryDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                      </strong>
                                    </div>
                                    <div className="prof-meta-chip">
                                      <span className="prof-meta-label">Return</span>
                                      <strong className="prof-meta-val">
                                        {returnDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                      </strong>
                                    </div>
                                  </>
                                );
                              })()}

                              <div className="prof-meta-chip" style={{ background: 'rgba(212, 86, 122, 0.06)', borderColor: 'rgba(212, 86, 122, 0.2)' }}>
                                <span className="prof-meta-label" style={{ color: '#D4567A' }}>Package</span>
                                <strong className="prof-meta-val" style={{ color: '#D4567A' }}>₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Tracking Banner (Dynamic Active Stage Shipment) */}
                        {(() => {
                          const activeShipment = (() => {
                            if (!b.shipments || b.shipments.length === 0) return null;
                            if (b.status === 'OUT_FOR_DELIVERY') {
                              return b.shipments.find((s: any) => s.leg === 'HUB_TO_RENTER') || b.shipments[b.shipments.length - 1];
                            }
                            if (b.status === 'RETURNED_TO_HUB') {
                              return b.shipments.find((s: any) => s.leg === 'RENTER_TO_HUB') || b.shipments[b.shipments.length - 1];
                            }
                            if (b.status === 'IN_USE') {
                              return b.shipments.find((s: any) => s.leg === 'HUB_TO_RENTER') || b.shipments[b.shipments.length - 1];
                            }
                            if (b.status === 'CONFIRMED' || b.status === 'AT_HUB_PRE') {
                              return b.shipments.find((s: any) => s.leg === 'LISTER_TO_HUB') || b.shipments[0];
                            }
                            return b.shipments.find((s: any) => s.status !== 'DELIVERED') || b.shipments[b.shipments.length - 1];
                          })();

                          if (!activeShipment) return null;

                          const legLabel = (() => {
                            switch (activeShipment.leg) {
                              case 'LISTER_TO_HUB': return 'Lister ➔ Central Hub (QC Intake)';
                              case 'HUB_TO_RENTER': return 'Central Hub ➔ Delivering to You';
                              case 'RENTER_TO_HUB': return 'Return Pickup ➔ Central Hub';
                              case 'HUB_TO_LISTER': return 'Central Hub ➔ Return to Lister';
                              default: return 'Courier Logistics';
                            }
                          })();

                          const statusTheme = (() => {
                            switch (activeShipment.status) {
                              case 'DELIVERED':
                                return { color: '#059669', bg: '#ECFDF5', border: 'rgba(16, 185, 129, 0.25)' };
                              case 'IN_TRANSIT':
                              case 'PICKED_UP':
                                return { color: '#2563EB', bg: '#EFF6FF', border: 'rgba(37, 99, 235, 0.25)' };
                              case 'PENDING':
                                return { color: '#D97706', bg: '#FEF3C7', border: 'rgba(217, 119, 6, 0.25)' };
                              default:
                                return { color: '#DC2626', bg: '#FEF2F2', border: 'rgba(220, 38, 38, 0.25)' };
                            }
                          })();

                          return (
                            <div className="prof-tracking-banner" style={{ background: statusTheme.bg, borderColor: statusTheme.border }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '15px' }}>🚚</span>
                                <div>
                                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {legLabel}
                                  </div>
                                  <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                                    {activeShipment.courierName || 'Courier Partner'} {activeShipment.trackingNumber ? `#${activeShipment.trackingNumber}` : '(Handover in Progress)'}
                                  </span>
                                </div>
                              </div>
                              <span style={{ fontSize: '9.5px', fontWeight: 800, color: statusTheme.color, background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', border: `1px solid ${statusTheme.border}` }}>
                                {activeShipment.status?.replace('_', ' ')}
                              </span>
                            </div>
                          );
                        })()}

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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontWeight: 700, color: 'var(--ink)', borderTop: '1px solid rgba(226, 214, 206, 0.8)', paddingTop: '6px', marginTop: '3px' }}>
                                <div>
                                  <span>
                                    {b.refund?.gateway === 'RAZORPAY'
                                      ? 'Refunded via Razorpay (Original Source)'
                                      : 'Refunded to Vault Wallet'}
                                  </span>
                                  {b.refund?.gatewayRefundId && (
                                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 500, marginTop: '2px', fontFamily: 'monospace' }}>
                                      Refund ID: {b.refund.gatewayRefundId}
                                    </div>
                                  )}
                                </div>
                                <span style={{ color: '#059669', fontSize: '13px' }}>
                                  ₹{(b.refund ? Number(b.refund.amount) : Math.max(0, b.securityDeposit - b.lateReturnPenalty - (b.damageReports?.reduce((sum, dr) => sum + Number(dr.deductionAmount), 0) || 0))).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                            
                            
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
            <div className="prof-vault-card">
              <h2 className="prof-vault-title">
                Vault Guarantee Ledger
              </h2>
              <p className="prof-vault-subtitle">
                Transparent balance management for rental security deposit returns and platform credits.
              </p>
              
              <div className="prof-vault-metrics-row">
                <div className="prof-vault-metric">
                  <span className="prof-vault-metric-label">
                    Available Vault Capital
                  </span>
                  <div className="prof-vault-metric-val">
                    ₹{Number(profile.walletBalance).toLocaleString('en-IN')}
                  </div>
                </div>
                
                <div className="prof-vault-divider" />
                
                <div className="prof-vault-metric">
                  <span className="prof-vault-metric-label">
                    Linked Registered Phone
                  </span>
                  <div className="prof-vault-phone-val">
                    {profile.phone}
                  </div>
                </div>
              </div>

              <div className="prof-vault-rules">
                <h4 className="prof-vault-rules-title">
                  Platform Usage & Guarantee Rules
                </h4>
                <p className="prof-vault-rules-desc">
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
