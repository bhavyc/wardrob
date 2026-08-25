'use client';

import { useState, useEffect } from 'react';

type Shipment = {
  id: string;
  leg: string;
  trackingNumber: string | null;
  courierName: string | null;
  status: string;
};

type BookingItem = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  totalAmount: number;
  listing: {
    title: string;
    baselineImages: string[];
    category: string;
    status: string;
  };
  renter: {
    id: string;
    name: string;
    phone: string | null;
  };
  shipments: Shipment[];
  reviews?: { id: string; rating: number; comment: string; reviewerId: string }[];
};

const STATUS_MAP: Record<string, { bg: string; color: string; border: string; dot: string; icon: string }> = {
  PENDING:          { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D', dot: '#F59E0B', icon: '⏳' },
  CONFIRMED:        { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD', dot: '#3B82F6', icon: '✅' },
  AT_HUB_PRE:       { bg: '#F3E8FF', color: '#6B21A8', border: '#D8B4FE', dot: '#A855F7', icon: '🏢' },
  OUT_FOR_DELIVERY: { bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD', dot: '#8B5CF6', icon: '🚚' },
  IN_USE:           { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', dot: '#10B981', icon: '👗' },
  RETURNED_TO_HUB:  { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8', dot: '#EC4899', icon: '🏢' },
  COMPLETED:        { bg: '#F0FDF4', color: '#166534', border: '#86EFAC', dot: '#22C55E', icon: '🎉' },
  CANCELLED:        { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', dot: '#EF4444', icon: '❌' },
};

export default function ListerBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const [authUserId, setAuthUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(data => {
      if (data.success && data.user) setAuthUserId(data.user.id);
    }).catch(console.error);
  }, []);

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
        fetchBookings();
      } else {
        alert(data.error || 'Failed to submit review.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/lister/bookings');
      const data = await res.json();
      if (res.ok && data.success) {
        setBookings(data.bookings || []);
      } else {
        setError(data.error || 'Failed to load bookings.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const openUpdate = (booking: BookingItem) => {
    setSelectedBooking(booking);
    setTrackingNumber('');
    setCourierName('');
    setError(''); setSuccess('');
  };

  const handleDispatchToHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setUpdating(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/lister/bookings/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id, 
          status: selectedBooking.status, // We leave status as CONFIRMED, hub handles AT_HUB
          trackingNumber,
          courierName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Item successfully dispatched to Hub.');
        setSelectedBooking(null);
        await fetchBookings();
      } else {
        setError(data.error || 'Failed to dispatch.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setUpdating(false);
    }
  };

  const counts = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    in_use: bookings.filter(b => b.status === 'IN_USE').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
  };

  // Paginated order items
  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const paginatedItems = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, bookings.length);

  return (
    <>
      <style>{`
        @keyframes orderFadeUp { from { opacity:0;transform:translateY(16px); } to { opacity:1;transform:translateY(0); } }
        @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn { from { opacity:0;transform:scale(0.95) translateY(12px); } to { opacity:1;transform:scale(1) translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes expandIn { from { opacity:0;max-height:0; } to { opacity:1;max-height:300px; } }

        .ord-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; animation:orderFadeUp 0.4s ease both; }
        .ord-h1 { font-family:var(--font-cormorant),'Cormorant Garamond',Georgia,serif; font-size:32px; font-weight:400; color:#0D1A14; margin-bottom:4px; }
        .ord-sub { font-size:13px; color:#74897C; }

        .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; animation:orderFadeUp 0.4s ease 0.08s both; }
        @media (max-width: 768px) {
          .kpi-row { grid-template-columns: 1fr; }
        }
        .kpi-card {
          background:#FFFFFF; border-radius:14px; padding:18px 16px;
          border:1px solid rgba(44,94,67,0.08);
          box-shadow:0 1px 3px rgba(0,0,0,0.04);
          transition:transform 0.2s ease,box-shadow 0.2s ease;
        }
        .kpi-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(44,94,67,0.09); }
        .kpi-num { font-size:26px; font-weight:700; color:#0D1A14; line-height:1; }
        .kpi-lbl { font-size:11px; color:#74897C; margin-top:4px; font-weight:500; }
        .kpi-bar { height:3px; border-radius:2px; margin-top:12px; }

        .alert-banner { padding:14px 18px; border-radius:12px; margin-bottom:20px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:10px; animation:orderFadeUp 0.3s ease both; }
        .alert-error { background:#FFF5F5; border:1px solid #FEB2B2; color:#C53030; }
        .alert-success { background:#F0FFF4; border:1px solid #9AE6B4; color:#276749; }

        .bookings-list { display:flex; flex-direction:column; gap:12px; animation:orderFadeUp 0.4s ease 0.16s both; }
        .order-card {
          background:#FFFFFF; border-radius:16px;
          border:1px solid rgba(44,94,67,0.08);
          box-shadow:0 1px 3px rgba(0,0,0,0.03);
          overflow:hidden; transition:box-shadow 0.2s ease;
        }
        .order-card:hover { box-shadow:0 4px 20px rgba(44,94,67,0.08); }
        .order-card-top {
          display:grid; grid-template-columns:48px 1fr auto; gap:16px;
          padding:18px 20px; align-items:center; cursor:pointer;
        }
        @media (max-width: 768px) {
          .order-card-top { grid-template-columns:1fr; gap:12px; align-items:flex-start; }
          .order-thumb { width:100%; height:160px; margin-bottom:8px; }
          .order-right { width:100%; justify-content:flex-start; flex-wrap:wrap; }
        }
        .order-thumb {
          width:48px; height:58px; border-radius:10px;
          background:#F0F4F1; border:1px solid rgba(44,94,67,0.08);
          overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:18px;
        }
        .order-prod-title { font-size:14px; font-weight:600; color:#1C2E24; margin-bottom:4px; }
        .order-prod-meta { display:flex; gap:12px; font-size:11px; color:#74897C; flex-wrap:wrap; }
        .order-meta-chip { display:flex; align-items:center; gap:4px; }
        .order-right { display:flex; align-items:center; gap:12px; }
        .status-pill {
          display:inline-flex; align-items:center; gap:5px;
          padding:5px 11px; border-radius:100px; font-size:10px; font-weight:700;
          letter-spacing:0.04em; border:1px solid; white-space:nowrap;
        }
        .status-dot { width:5px; height:5px; border-radius:50%; }

        .update-btn {
          padding:8px 16px; border-radius:8px; font-size:11px; font-weight:700;
          letter-spacing:0.06em; cursor:pointer; border:1px solid #2C5E43;
          background:transparent; color:#2C5E43; transition:all 0.2s ease;
        }
        .update-btn:hover { background:#2C5E43; color:#FFFFFF; }

        .order-expanded {
          border-top:1px solid rgba(44,94,67,0.07);
          display:grid; grid-template-columns:1fr 1fr;
          gap:0; overflow:hidden;
          animation:expandIn 0.25s ease both;
        }
        @media (max-width: 768px) {
          .order-expanded { grid-template-columns:1fr; }
          .exp-section:first-child { border-right:none; border-bottom:1px solid rgba(44,94,67,0.07); }
        }
        .exp-section { padding:16px 20px; }
        .exp-section:first-child { border-right:1px solid rgba(44,94,67,0.07); }
        .exp-label { font-size:9px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#AEC0B4; margin-bottom:8px; display:block; }
        .exp-value { font-size:13px; color:#1C2E24; line-height:1.6; }
        .exp-price { font-size:20px; font-weight:700; color:#2C5E43; }

        .tracking-bar {
          display:flex; gap:20px; padding:12px 20px;
          background:#F8FAF8; border-top:1px solid rgba(44,94,67,0.07);
          font-size:12px; color:#3D5347;
        }
        .tracking-label { font-weight:700; color:#74897C; }

        .empty-state { padding:80px 40px; text-align:center; background:#FFFFFF; border-radius:20px; border:2px dashed rgba(44,94,67,0.15); animation:orderFadeUp 0.4s ease 0.16s both; }

        /* Modal */
        .modal-overlay { position:fixed; inset:0; z-index:500; background:rgba(6,14,9,0.6); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:24px; animation:overlayIn 0.25s ease both; }
        .modal-box {
          background:#FFFFFF; border-radius:20px; width:100%; max-width:440px;
          box-shadow:0 24px 80px rgba(0,0,0,0.25); overflow:hidden;
          animation:modalIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        .modal-top { padding:28px 32px 0; }
        .modal-title { font-family:var(--font-cormorant),'Cormorant Garamond',Georgia,serif; font-size:26px; font-weight:400; color:#163625; margin-bottom:6px; }
        .modal-desc { font-size:13px; color:#74897C; padding-bottom:24px; border-bottom:1px solid rgba(44,94,67,0.08); }
        .modal-body { padding:24px 32px 32px; display:flex; flex-direction:column; gap:18px; }
        .field-lbl { display:block; font-size:10px; font-weight:700; color:#3D5347; margin-bottom:7px; letter-spacing:0.07em; text-transform:uppercase; }
        .field-inp { width:100%; height:44px; padding:0 14px; border:1.5px solid #DDE4DF; border-radius:10px; outline:none; font-size:13px; color:#1C2E24; background:#FAFBFA; transition:all 0.2s ease; }
        .field-inp:focus { border-color:#2C5E43; background:#FFFFFF; box-shadow:0 0 0 3px rgba(44,94,67,0.07); }
        .modal-actions { display:flex; gap:12px; margin-top:8px; }
        .cancel-btn { flex:1; height:48px; border:1.5px solid #DDE4DF; border-radius:12px; background:transparent; color:#74897C; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s ease; }
        .cancel-btn:hover { border-color:#AEC0B4; color:#3D5347; }
        .confirm-btn { flex:1; height:48px; border:none; border-radius:12px; background:linear-gradient(135deg,#2C5E43,#1E4D33); color:#FFFFFF; font-size:13px; font-weight:700; letter-spacing:0.06em; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.25s ease; }
        .confirm-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 20px rgba(44,94,67,0.28); }
        .confirm-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .mini-spin { width:15px; height:15px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#FFF; animation:spin 0.65s linear infinite; }

        /* Pagination Bar */
        .pagination-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px; background: #FAFBFA;
          border-top: 1px solid rgba(44,94,67,0.07); border-radius: 16px;
          margin-top: 18px; font-size: 13px; color: #74897C; font-weight: 500;
          border: 1px solid rgba(44,94,67,0.08); box-shadow: 0 1px 3px rgba(0,0,0,0.02);
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
      <div className="ord-header">
        <div>
          <h1 className="ord-h1">Rental Bookings</h1>
          <p className="ord-sub">Track incoming rental bookings and dispatch items to the WARDROB Hub</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchBookings(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(44,94,67,0.15)', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', color: '#3D5347', fontSize: 12, fontWeight: 600 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-3" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-row">
        {[
          { num: counts.total, label: 'Total Bookings', color: '#2C5E43', barBg: 'linear-gradient(90deg,#2C5E43,#4A7A5D)' },
          { num: counts.confirmed, label: 'To Dispatch', color: '#3B82F6', barBg: '#93C5FD' },
          { num: counts.in_use, label: 'In Use (Rented)', color: '#10B981', barBg: '#6EE7B7' },
          { num: counts.completed, label: 'Completed', color: '#166534', barBg: '#86EFAC' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-num" style={{ color: k.color }}>{loading ? '—' : k.num}</div>
            <div className="kpi-lbl">{k.label}</div>
            <div className="kpi-bar" style={{ background: k.barBg, opacity: 0.6 }} />
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && <div className="alert-banner alert-error"><span>⚠</span>{error}</div>}
      {success && <div className="alert-banner alert-success"><span>✓</span>{success}</div>}

      {/* bookings */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #DDE4DF', borderTopColor: '#2C5E43', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 24, fontWeight: 400, color: '#163625', marginBottom: 8 }}>No bookings yet</h3>
          <p style={{ fontSize: 13, color: '#74897C' }}>Customer rental bookings will appear here.</p>
        </div>
      ) : (
        <>
          <div className="bookings-list">
            {paginatedItems.map(item => {
              const cfg = STATUS_MAP[item.status] || STATUS_MAP.PENDING;
              const isExpanded = expandedId === item.id;
              const listerToHubShipment = item.shipments?.find(s => s.leg === 'LISTER_TO_HUB');
              const isAtHub = item.listing?.status === 'AT_HUB';
              const needsDispatch = item.status === 'CONFIRMED' && !listerToHubShipment && !isAtHub;
              
              return (
                <div key={item.id} className="order-card">
                  <div className="order-card-top" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    {/* Thumbnail */}
                    <div className="order-thumb">
                      {item.listing?.baselineImages?.[0]
                        ? <img src={item.listing.baselineImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '👗'
                      }
                    </div>
                    {/* Info */}
                    <div>
                      <div className="order-prod-title">{item.listing?.title || 'Unknown Listing'}</div>
                      <div className="order-prod-meta">
                        <span className="order-meta-chip">Renter: <strong>{item.renter?.name}</strong></span>
                        <span className="order-meta-chip" style={{ color: '#2C5E43', fontWeight: 700 }}>
                          Rent: ₹{(item.rentAmount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    {/* Right */}
                    <div className="order-right">
                      <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                        <span className="status-dot" style={{ background: cfg.dot }} />
                        {item.status}
                      </span>
                      {needsDispatch && (
                        <button
                          className="update-btn"
                          onClick={e => { e.stopPropagation(); openUpdate(item); }}
                        >
                          Dispatch to Hub →
                        </button>
                      )}
                      {item.status === 'CONFIRMED' && isAtHub && (
                        <div style={{ background: '#F8FAF8', padding: '6px 10px', borderRadius: 6, fontSize: 10, color: '#2C5E43', border: '1px solid #DDE4DF' }}>
                          🏢 Hub dispatching
                        </div>
                      )}
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="#AEC0B4" strokeWidth="2"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                      >
                        <path d="M6 9L12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="order-expanded">
                      <div className="exp-section">
                        <span className="exp-label">Event Details</span>
                        <div className="exp-value">
                          Expected Hub Delivery: <strong>{new Date(item.startDate).toLocaleDateString()}</strong><br />
                          Return Pickup: <strong>{new Date(item.endDate).toLocaleDateString()}</strong><br />
                          Renter Phone: {item.renter?.phone || 'N/A'}
                        </div>
                      </div>
                      <div className="exp-section">
                        <span className="exp-label">Financials</span>
                        <div className="exp-value">
                          <div className="exp-price">₹{item.rentAmount.toLocaleString('en-IN')} (Gross Rent)</div>
                          <div style={{ fontSize: 11, color: '#74897C', marginTop: 4 }}>Security Deposit: ₹{item.securityDeposit}</div>
                          <div style={{ fontSize: 10, color: '#AEC0B4', marginTop: 2, fontFamily: 'monospace' }}>
                            Booking ID: {item.id.slice(0, 16)}…
                          </div>
                        </div>
                      </div>
                      
                      {item.status === 'COMPLETED' && (
                        <div className="exp-section" style={{ width: '100%', borderTop: '1px solid #EBEBEB', marginTop: '16px', paddingTop: '16px' }}>
                          {(() => {
                            const submittedReview = item.reviews?.find(r => r.reviewerId === authUserId);
                            if (submittedReview) {
                              return (
                                <div>
                                  <span className="exp-label">Your Rating for Renter</span>
                                  <div style={{ color: '#059669', fontWeight: 600, fontSize: '16px' }}>
                                    {Array(submittedReview.rating).fill('★').join('')}
                                  </div>
                                  {submittedReview.comment && <p style={{ fontSize: '13px', color: '#74897C', marginTop: '4px' }}>"{submittedReview.comment}"</p>}
                                </div>
                              );
                            }

                            const isRating = ratingBookingId === item.id;
                            if (isRating) {
                              return (
                                <div>
                                  <span className="exp-label">Rate Renter</span>
                                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    {[1,2,3,4,5].map(star => (
                                      <button 
                                        key={star} 
                                        onClick={() => setRatingValue(star)} 
                                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: star <= ratingValue ? '#F59E0B' : '#E5E7EB' }}
                                      >
                                        ★
                                      </button>
                                    ))}
                                  </div>
                                  <textarea 
                                    placeholder="Add an optional comment..." 
                                    value={ratingComment} 
                                    onChange={e => setRatingComment(e.target.value)} 
                                    style={{ width: '100%', padding: '8px', border: '1px solid #DDE4DF', borderRadius: '4px', fontSize: '12px', marginBottom: '8px', minHeight: '60px' }}
                                  />
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleRatingSubmit(item.id)} style={{ background: '#2C5E43', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Submit</button>
                                    <button onClick={() => { setRatingBookingId(null); setRatingValue(5); setRatingComment(''); }} style={{ background: '#fff', color: '#163625', border: '1px solid #DDE4DF', padding: '6px 16px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <button 
                                onClick={() => setRatingBookingId(item.id)} 
                                style={{ background: '#2C5E43', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                              >
                                Rate Renter
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tracking bar if dispatched to Hub */}
                  {listerToHubShipment && (
                    <div className="tracking-bar">
                      <span><span className="tracking-label">Dispatched to Hub via:</span> {listerToHubShipment.courierName}</span>
                      <span><span className="tracking-label">Tracking:</span> <code style={{ fontFamily: 'monospace', fontWeight: 700 }}>{listerToHubShipment.trackingNumber}</code></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <div>
                Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of <strong>{bookings.length}</strong> bookings
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
        </>
      )}

      {/* Dispatch to Hub Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedBooking(null); }}>
          <div className="modal-box">
            <div className="modal-top">
              <h2 className="modal-title">Dispatch to WARDROB Hub</h2>
              <p className="modal-desc">
                Log the tracking details for <strong>{selectedBooking.listing?.title}</strong> so the Hub expects it.
              </p>
            </div>
            <div className="modal-body">
              {error && <div className="alert-banner alert-error" style={{ margin: 0 }}><span>⚠</span>{error}</div>}
              <form onSubmit={handleDispatchToHub} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="field-lbl">Courier / Carrier Name *</label>
                  <input className="field-inp" type="text" required value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="e.g. Delhivery, DHL, BlueDart" />
                </div>
                <div>
                  <label className="field-lbl">Tracking Number *</label>
                  <input className="field-inp" type="text" required value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="e.g. DEL123456789IN" style={{ fontFamily: 'monospace' }} />
                </div>
                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setSelectedBooking(null)}>Cancel</button>
                  <button
                    type="submit"
                    className="confirm-btn"
                    disabled={updating || !trackingNumber || !courierName}
                  >
                    {updating ? <><div className="mini-spin" />Saving…</> : 'Confirm Dispatch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}