'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import Pagination from '@/components/Pagination';
import './lister-bookings.css';

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

const STATUS_MAP: Record<string, { bg: string; color: string; border: string; dot: string; icon: string; label: string }> = {
  PENDING:          { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D', dot: '#F59E0B', icon: '⏳', label: 'PENDING' },
  CONFIRMED:        { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD', dot: '#3B82F6', icon: '✅', label: 'CONFIRMED' },
  AT_HUB_PRE:       { bg: '#F3E8FF', color: '#6B21A8', border: '#D8B4FE', dot: '#A855F7', icon: '🏢', label: 'PICKUP PENDING' },
  OUT_FOR_DELIVERY: { bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD', dot: '#8B5CF6', icon: '🚚', label: 'OUT FOR DELIVERY' },
  IN_USE:           { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', dot: '#10B981', icon: '👗', label: 'IN USE' },
  RETURNED_TO_HUB:  { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8', dot: '#EC4899', icon: '🏢', label: 'RETURNED TO HUB' },
  COMPLETED:        { bg: '#F0FDF4', color: '#166534', border: '#86EFAC', dot: '#22C55E', icon: '🎉', label: 'COMPLETED' },
  CANCELLED:        { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', dot: '#EF4444', icon: '❌', label: 'CANCELLED' },
};

export default function ListerBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [updating, setUpdating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
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

  const handleMarkPacked = async (bookingId: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/shipments/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBookings();
      } else {
        alert(data.error || 'Failed to request pickup.');
      }
    } catch {
      alert('Connection error.');
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
              const hasTracking = !!(listerToHubShipment?.trackingNumber || listerToHubShipment?.courierName);
              const needsDispatch = item.status === 'CONFIRMED' && !hasTracking && !isAtHub;
              
              return (
                <div key={item.id} className="order-card">
                  <div className="order-card-top">
                    {/* Main Thumbnail + Info - Click to open dedicated page */}
                    <Link
                      href={`/lister/bookings/${item.id}`}
                      className="order-card-main"
                      style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                      <div className="order-thumb">
                        {item.listing?.baselineImages?.[0]
                          ? <img src={item.listing.baselineImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '👗'
                        }
                      </div>
                      <div className="order-prod-info">
                        <div className="order-prod-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{item.listing?.title || 'Unknown Listing'}</span>
                          <span style={{ fontSize: 11, color: '#D4567A', fontWeight: 600 }}>#{item.id.slice(0, 6).toUpperCase()}</span>
                        </div>
                        <div className="order-prod-meta">
                          <span className="order-meta-chip">Renter: <strong>{item.renter?.name}</strong></span>
                          <span className="order-meta-chip" style={{ color: '#2C5E43', fontWeight: 700 }}>
                            Rent: ₹{(item.rentAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Right / Bottom Action Bar */}
                    <div className="order-right">
                      <span className="status-pill" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                        <span className="status-dot" style={{ background: cfg.dot }} />
                        {cfg.label || item.status}
                      </span>

                      <Link
                        href={`/lister/bookings/${item.id}`}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#2C5E43',
                          background: 'rgba(44,94,67,0.08)',
                          padding: '7px 12px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View Details →
                      </Link>

                      {needsDispatch && (
                        <button
                          className="update-btn"
                          onClick={e => { e.stopPropagation(); handleMarkPacked(item.id); }}
                          disabled={updating}
                          style={{ background: '#2C5E43', color: '#FFF' }}
                        >
                          📦 Mark Packed for Pickup
                        </button>
                      )}
                      {item.status === 'AT_HUB_PRE' && !isAtHub && (
                        <div style={{ background: '#F3E8FF', padding: '6px 12px', borderRadius: 8, fontSize: 11, color: '#6B21A8', fontWeight: 600, border: '1px solid #D8B4FE' }}>
                          ✓ Packed • Awaiting Hub Courier
                        </div>
                      )}
                      {isAtHub && item.status !== 'COMPLETED' && (
                        <div style={{ background: '#F0FDF4', padding: '6px 12px', borderRadius: 8, fontSize: 11, color: '#166534', fontWeight: 600, border: '1px solid #86EFAC' }}>
                          🏢 Received & Inspected at Hub
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        title="Toggle quick preview"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                      >
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#AEC0B4" strokeWidth="2"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                        >
                          <path d="M6 9L12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="order-expanded">
                      <div className="exp-section">
                        <span className="exp-label">Schedule & Rental Period</span>
                        <div className="exp-value">
                          {(() => {
                            const delDate = new Date(item.startDate);
                            const evDate = new Date(delDate);
                            evDate.setDate(evDate.getDate() + 2);
                            return (
                              <>
                                Customer Event Date: <strong>{evDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong><br />
                                Hub Delivery to Renter: <strong>{delDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong><br />
                                Return Pickup Date: <strong>{new Date(item.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong><br />
                              </>
                            );
                          })()}
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
                      

                    </div>
                  )}

                  {/* Tracking bar if dispatched to Hub */}
                  {listerToHubShipment && (
                    <div className="tracking-bar">
                      {listerToHubShipment.trackingNumber ? (
                        <>
                          <span><span className="tracking-label">Dispatched to Hub via:</span> {listerToHubShipment.courierName || 'Carrier'}</span>
                          <span><span className="tracking-label">Tracking:</span> <code style={{ fontFamily: 'monospace', fontWeight: 700 }}>{listerToHubShipment.trackingNumber}</code></span>
                        </>
                      ) : (
                        <span><span className="tracking-label">Hub Pickup Pending:</span> Hub operations team is coordinating courier collection from your address.</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination bar */}
          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalItems={bookings.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </>
  );
}