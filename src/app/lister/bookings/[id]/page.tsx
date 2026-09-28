'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../lister-bookings.css';

type Shipment = {
  id: string;
  leg: string;
  trackingNumber: string | null;
  courierName: string | null;
  status: string;
  createdAt: string;
};

type BookingDetail = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  extensionFee?: number;
  totalAmount: number;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    baselineImages: string[];
    category: string;
    size: string;
    condition: string;
    sku?: string;
    rentalPrice: number;
    securityDeposit: number;
    status: string;
  };
  renter: {
    id: string;
    name: string;
    phone: string | null;
  };
  shipments: Shipment[];
  reviews?: { id: string; rating: number; comment: string }[];
};

const STATUS_MAP: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  PENDING:          { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D', dot: '#F59E0B', label: 'PENDING VERIFICATION' },
  CONFIRMED:        { bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD', dot: '#3B82F6', label: 'CONFIRMED · TO DISPATCH' },
  AT_HUB_PRE:       { bg: '#F3E8FF', color: '#6B21A8', border: '#D8B4FE', dot: '#A855F7', label: 'PICKED UP · AT HUB PRE-DISPATCH' },
  OUT_FOR_DELIVERY: { bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD', dot: '#8B5CF6', label: 'OUT FOR DELIVERY TO RENTER' },
  IN_USE:           { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', dot: '#10B981', label: 'IN USE BY RENTER' },
  RETURNED_TO_HUB:  { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8', dot: '#EC4899', label: 'RETURNED TO HUB · INSPECTING' },
  COMPLETED:        { bg: '#F0FDF4', color: '#166534', border: '#86EFAC', dot: '#22C55E', label: 'COMPLETED & SETTLED' },
  CANCELLED:        { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', dot: '#EF4444', label: 'CANCELLED' },
};

export default function ListerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/lister/bookings/${bookingId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Failed to load booking details.');
      }
    } catch {
      setError('Connection error while fetching order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleMarkPacked = async () => {
    setUpdating(true);
    try {
      const res = await fetch('/api/shipments/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchBooking();
      } else {
        alert(data.error || 'Failed to request pickup.');
      }
    } catch {
      alert('Connection error.');
    } finally {
      setUpdating(false);
    }
  };

  const copyId = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #DDE4DF', borderTopColor: '#2C5E43', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ padding: '32px 0', maxWidth: 640 }}>
        <Link href="/lister/bookings" style={{ color: '#2C5E43', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          ← Back to Bookings
        </Link>
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 20, color: '#991B1B' }}>
          <strong>Error:</strong> {error || 'Booking could not be found.'}
        </div>
      </div>
    );
  }

  const cfg = STATUS_MAP[booking.status] || STATUS_MAP.PENDING;
  const listerToHubShipment = booking.shipments?.find(s => s.leg === 'LISTER_TO_HUB');
  const isAtHub = booking.listing?.status === 'AT_HUB';
  const hasTracking = !!(listerToHubShipment?.trackingNumber || listerToHubShipment?.courierName);
  const needsDispatch = booking.status === 'CONFIRMED' && !hasTracking && !isAtHub;

  // Dates
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const eventDate = new Date(startDate);
  eventDate.setDate(eventDate.getDate() + 2);
  const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Financials
  const rent = booking.rentAmount;
  const commission = Math.max(2000, rent * 0.35);
  const estimatedPayout = Math.max(0, rent - commission);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Breadcrumb & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Link
          href="/lister/bookings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#2C5E43',
            background: 'rgba(44,94,67,0.06)',
            padding: '8px 14px',
            borderRadius: 8,
          }}
        >
          ← Back to All Orders
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={copyId}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#4A4A5A',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            📋 {copied ? 'Copied ID!' : `Copy ID: #${booking.id.slice(0, 8).toUpperCase()}`}
          </button>
          <button
            onClick={() => { setLoading(true); fetchBooking(); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#2C5E43',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Order Title Banner */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 26, fontWeight: 600, color: '#1E1E2D', margin: 0 }}>
              Order #{booking.id.slice(0, 8).toUpperCase()}
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                padding: '4px 10px',
                borderRadius: 20,
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
              {cfg.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#8E8E9E' }}>
            Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {needsDispatch && (
          <button
            onClick={handleMarkPacked}
            disabled={updating}
            style={{
              background: '#2C5E43',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              padding: '12px 22px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(44,94,67,0.2)',
            }}
          >
            {updating ? 'Scheduling Courier...' : '📦 Mark Packed for Pickup'}
          </button>
        )}
      </div>

      {/* 2-Column Responsive Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1.1fr)', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Outfit Hero Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#8E8E9E', textTransform: 'uppercase', marginBottom: 16 }}>
              Reserved Designer Outfit
            </h3>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
              <div style={{ width: 100, height: 120, borderRadius: 12, overflow: 'hidden', background: '#F8F6F2', flexShrink: 0, border: '1px solid #F0EBE4' }}>
                {booking.listing?.baselineImages?.[0] ? (
                  <img src={booking.listing.baselineImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👗</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 700, color: '#D4567A', background: '#FFF2F5', padding: '3px 8px', borderRadius: 6, marginBottom: 6 }}>
                  {booking.listing?.category?.toUpperCase()}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1E1E2D', margin: '0 0 8px 0' }}>
                  {booking.listing?.title}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#4A4A5A', background: '#F8F9FA', padding: '4px 10px', borderRadius: 6, border: '1px solid #EBECEF' }}>
                    Size: <strong>{booking.listing?.size}</strong>
                  </span>
                  <span style={{ fontSize: 12, color: '#0D9488', background: '#F0FDFA', padding: '4px 10px', borderRadius: 6, border: '1px solid #CCFBF1' }}>
                    Condition: <strong>{booking.listing?.condition?.replace('_', ' ')}</strong>
                  </span>
                  {booking.listing?.sku && (
                    <span style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '4px 10px', borderRadius: 6 }}>
                      SKU: {booking.listing.sku}
                    </span>
                  )}
                </div>
                <Link
                  href={`/lister/listings`}
                  style={{ fontSize: 12, fontWeight: 600, color: '#D4567A', textDecoration: 'none' }}
                >
                  Manage in Wardrobe Listings →
                </Link>
              </div>
            </div>
          </div>

          {/* Rental Timeline Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#8E8E9E', textTransform: 'uppercase', marginBottom: 16 }}>
              Rental Schedule & Dates
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#F8FAF9', border: '1px solid #E8EFEA', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#74897C', fontWeight: 600, marginBottom: 4 }}>HUB DISPATCH</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1E2D' }}>
                  {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Lister dispatch date</div>
              </div>

              <div style={{ background: '#FFF5F7', border: '1px solid #FED7E2', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#D4567A', fontWeight: 700, marginBottom: 4 }}>EVENT OCCASION</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#D4567A' }}>
                  {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 10.5, color: '#E57399' }}>Renter wear date</div>
              </div>

              <div style={{ background: '#F8FAF9', border: '1px solid #E8EFEA', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#74897C', fontWeight: 600, marginBottom: 4 }}>RETURN PICKUP</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1E2D' }}>
                  {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: 10.5, color: '#94A3B8' }}>End of rental period</div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              <span>Total Rental Duration: <strong>{durationDays} Days</strong></span>
              <span style={{ color: '#0D9488', fontWeight: 600 }}>✓ Covered by Hub Sanitization SLA</span>
            </div>
          </div>

          {/* Logistics & Tracking Steps */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#8E8E9E', textTransform: 'uppercase', marginBottom: 16 }}>
              Hub Logistics & Courier Journey
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  title: '1. Booking Confirmed',
                  desc: 'Rental reserved and payment confirmed via Razorpay Escrow.',
                  done: true,
                },
                {
                  title: '2. Lister Packing & Hub Pickup',
                  desc: hasTracking
                    ? `Courier: ${listerToHubShipment?.courierName || 'Wardrob Hub Courier'} (AWB: ${listerToHubShipment?.trackingNumber || 'Assigned'})`
                    : 'Awaiting lister to mark outfit packed and request courier.',
                  done: booking.status !== 'CONFIRMED' && booking.status !== 'PENDING',
                },
                {
                  title: '3. Hub Intake & Quality Inspection',
                  desc: 'Quality and authenticity checked against original baseline photos.',
                  done: ['OUT_FOR_DELIVERY', 'IN_USE', 'RETURNED_TO_HUB', 'COMPLETED'].includes(booking.status),
                },
                {
                  title: '4. Delivered to Renter',
                  desc: 'Handed over in protective garment bag for customer event.',
                  done: ['IN_USE', 'RETURNED_TO_HUB', 'COMPLETED'].includes(booking.status),
                },
                {
                  title: '5. Hub Return Check & Payout Settle',
                  desc: 'Post-rental return inspection, deposit reconciliation, and lister payout.',
                  done: booking.status === 'COMPLETED',
                },
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: step.done ? '#2C5E43' : '#F1F5F9',
                      color: step.done ? '#FFFFFF' : '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: step.done ? 700 : 600, color: step.done ? '#1E1E2D' : '#64748B' }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#8E8E9E', marginTop: 2 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Financial Breakdown Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#8E8E9E', textTransform: 'uppercase', marginBottom: 16 }}>
              Lister Earnings & Payout
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4A4A5A' }}>
                <span>Customer Rent Paid</span>
                <span style={{ fontWeight: 700, color: '#1E1E2D' }}>₹{booking.rentAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4A4A5A' }}>
                <span>Security Deposit (Escrow)</span>
                <span style={{ fontWeight: 600, color: '#64748B' }}>₹{booking.securityDeposit.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8E8E9E' }}>
                <span>Platform Commission (35% or min ₹2,000)</span>
                <span>-₹{commission.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                padding: '16px 18px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 4 }}>
                Estimated Lister Payout
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#15803D' }}>
                ₹{estimatedPayout.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>
                Transferred to your bank account after quality clearance at the Wardrob Hub.
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: '#74897C', lineHeight: 1.5 }}>
              🔒 <strong>Lister Guarantee:</strong> In case of major damages or non-return, 100% of assessed damage charges up to the security deposit are credited directly to you.
            </div>
          </div>

          {/* Renter Details Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: '#8E8E9E', textTransform: 'uppercase', marginBottom: 16 }}>
              Customer Details
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F8FAF9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                👤
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1E2D' }}>
                  {booking.renter?.name || 'Verified Renter'}
                </div>
                <div style={{ fontSize: 12, color: '#0D9488', fontWeight: 600 }}>
                  ✓ ID Verified Customer
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '10px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              📞 Contact: {booking.renter?.phone || 'Securely routed via Wardrob Hub Support'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
