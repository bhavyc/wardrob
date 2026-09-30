'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  totalListings: number;
  activeListings: number;
  totalListers: number;
  pendingListers: number;
  hubPartnersCount: number;
  pendingPayoutCount: number;
  totalPendingPayoutAmount: number;
  openDisputes: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);
  const [chronicOverdue, setChronicOverdue] = useState<any[]>([]);
  const [dispatchRiskBookings, setDispatchRiskBookings] = useState<any[]>([]);
  const [stuckIntakeBookings, setStuckIntakeBookings] = useState<any[]>([]);
  const [stuckReturnBookings, setStuckReturnBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecentBookings(data.recentBookings || []);
          setRecentPayouts(data.recentPayouts || []);
          setChronicOverdue(data.chronicOverdueBookings || []);
          setDispatchRiskBookings(data.dispatchRiskBookings || []);
          setStuckIntakeBookings(data.stuckIntakeBookings || []);
          setStuckReturnBookings(data.stuckReturnBookings || []);
        } else {
          console.error('Failed to load stats:', data.error);
        }
      } else {
        const text = await res.text();
        console.error('Expected JSON but got HTML/text. This usually means a redirect to login occurred.', text.substring(0, 100));
        // Optionally redirect to login here if it's an unauthorized page redirect
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #090D16 0%, #1E293B 100%)',
          borderRadius: 14,
          padding: '28px 32px',
          color: '#FFF',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#C5A880',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            P2P Fashion Rental Marketplace
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Welcome to WARDROB Operations
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '6px 0 0' }}>
            Zero-inventory peer-to-peer fashion rental network. Monitored through central cleaning & inspection hubs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/admin/payouts"
            style={{
              background: '#C5A880',
              color: '#090D16',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            💳 Review Payouts ({stats?.pendingPayoutCount || 0})
          </Link>
          <Link
            href="/admin/bookings"
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#FFF',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '10px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            📦 Active Bookings
          </Link>
        </div>
      </div>

      {/* 🚨 LEG 2 CRITICAL: Dispatch at Risk (Customer Event Within 36 Hours) */}
      {dispatchRiskBookings.length > 0 && (
        <div
          style={{
            background: '#FEF2F2',
            borderRadius: 14,
            border: '2px solid #EF4444',
            padding: '20px 24px',
            marginBottom: 28,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚨</span> CRITICAL: Dispatch at Risk — Event Within 36 Hours ({dispatchRiskBookings.length})
              </h2>
              <p style={{ margin: 0, fontSize: 12.5, color: '#B91C1C' }}>
                Customer event/rental starts imminently! Garment is not yet out for delivery. Pre-dispatch QC and courier handoff required immediately to avoid missed deliveries.
              </p>
            </div>
            <Link
              href="/admin/shipments"
              style={{
                background: '#DC2626',
                color: '#FFF',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
              }}
            >
              Expedite in Shipments &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dispatchRiskBookings.map((b) => {
              const hoursUntilEvent = Math.max(1, Math.round((new Date(b.startDate).getTime() - Date.now()) / (1000 * 60 * 60)));
              const hasPreDispatchQc = b.damageReports && b.damageReports.length > 0;
              const leg2Shipment = b.shipments?.[0];

              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    background: '#FFFFFF',
                    border: '1px solid #FCA5A5',
                    borderRadius: 10,
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{b.listing?.title}</span>
                      {b.listing?.sku && (
                        <span style={{ fontSize: 11, background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                          SKU: {b.listing.sku}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#4B5563', marginTop: 4 }}>
                      Renter: <strong>{b.renter?.name}</strong> ({b.renter?.phone || 'No phone'}) • Event starts: <strong>{new Date(b.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      Hub Pre-Dispatch QC: {hasPreDispatchQc ? '✅ Certified' : '⚠️ Pending QC'} • Courier: {leg2Shipment?.courierName || 'Not Assigned'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          background: '#DC2626',
                          color: '#FFFFFF',
                          padding: '5px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                        }}
                      >
                        ⚡ Event in ~{hoursUntilEvent}h
                      </span>
                      <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, marginTop: 4 }}>
                        Customer Experience Risk
                      </div>
                    </div>

                    <Link
                      href="/admin/shipments"
                      style={{
                        background: '#991B1B',
                        color: '#FFF',
                        padding: '8px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Dispatch Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Rentals
            </span>
            <span style={{ fontSize: 18 }}>👗</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginTop: 8 }}>
            {loading ? '...' : stats?.activeBookings || 0}
          </div>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            {stats?.totalBookings || 0} total bookings recorded
          </span>
        </div>

        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Pending Payouts
            </span>
            <span style={{ fontSize: 18 }}>💰</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#D97706', marginTop: 8 }}>
            ₹{loading ? '...' : (stats?.totalPendingPayoutAmount || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            {stats?.pendingPayoutCount || 0} payouts awaiting manual transfer
          </span>
        </div>

        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Available Items
            </span>
            <span style={{ fontSize: 18 }}>✨</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#059669', marginTop: 8 }}>
            {loading ? '...' : stats?.activeListings || 0}
          </div>
          <span style={{ fontSize: 11, color: '#64748B' }}>
            {stats?.totalListings || 0} total wardrobe listings
          </span>
        </div>

        <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Hub Partners
            </span>
            <span style={{ fontSize: 18 }}>🧼</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563EB', marginTop: 8 }}>
            {loading ? '...' : stats?.hubPartnersCount || 0}
          </div>
          <span style={{ fontSize: 11, color: '#64748B' }}>Cleaning & inspection hubs</span>
        </div>
      </div>

      {/* Two Column Layout for Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Recent Bookings */}
        <div
          style={{
            background: '#FFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Recent Rental Orders
            </h3>
            <Link href="/admin/bookings" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              View all &rarr;
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No recent bookings found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{b.listing?.title}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Renter: {b.renter?.name} • ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: '#DBEAFE',
                      color: '#1E40AF',
                      padding: '3px 8px',
                      borderRadius: 10,
                    }}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Payouts Queue */}
        <div
          style={{
            background: '#FFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Lister Payout Queue
            </h3>
            <Link href="/admin/payouts" style={{ fontSize: 12, color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
              Open queue &rarr;
            </Link>
          </div>

          {recentPayouts.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No pending payouts in queue.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentPayouts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px solid #F1F5F9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                      {p.lister?.user?.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Item: {p.booking?.listing?.title}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#059669' }}>
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: p.status === 'PENDING' ? '#D97706' : '#059669',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📦 LEG 1: Lister Intake QC Overdue (>24h at Hub) */}
        {stuckIntakeBookings.length > 0 && (
          <div
            style={{
              background: '#F0F9FF',
              borderRadius: 12,
              border: '1px solid #BAE6FD',
              padding: 20,
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
              gridColumn: '1 / -1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0369A1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📦</span> Leg 1: Lister Intake QC Overdue ({stuckIntakeBookings.length})
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: '#0284C7' }}>
                  Lister parcel arrived at Hub over 24 hours ago. Baseline intake inspection &amp; barcode tag generation pending.
                </p>
              </div>
              <Link
                href="/admin/shipments"
                style={{
                  background: '#0284C7',
                  color: '#FFF',
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Track Intake &rarr;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stuckIntakeBookings.map((b) => {
                const leg1 = b.shipments?.[0];
                const arrivedAt = leg1?.deliveredAt ? new Date(leg1.deliveredAt) : new Date(b.updatedAt);
                const hoursWaiting = Math.max(24, Math.floor((Date.now() - arrivedAt.getTime()) / (1000 * 60 * 60)));

                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #BAE6FD',
                      borderRadius: 8,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A' }}>
                        {b.listing?.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        Lister: <strong>{b.listing?.lister?.shopName || b.listing?.lister?.user?.name}</strong> ({b.listing?.lister?.user?.phone || 'No phone'})
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                        Courier: {leg1?.courierName || 'Logistics Partner'} • Tracking: {leg1?.trackingNumber || 'N/A'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          background: '#E0F2FE',
                          color: '#0369A1',
                          border: '1px solid #7DD3FC',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ⏳ {hoursWaiting}h at Hub
                      </span>
                      <Link
                        href="/admin/shipments"
                        style={{
                          background: '#F8FAFC',
                          color: '#334155',
                          border: '1px solid #CBD5E1',
                          padding: '7px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Review Intake
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 💸 LEG 3: Return QC Overdue (>24h at Hub without post-return QC) */}
        {stuckReturnBookings.length > 0 && (
          <div
            style={{
              background: '#FFFBEB',
              borderRadius: 12,
              border: '1px solid #FCD34D',
              padding: 20,
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)',
              gridColumn: '1 / -1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>💸</span> Leg 3: Return QC Overdue — Action Required ({stuckReturnBookings.length})
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: '#B45309' }}>
                  Courier delivered parcel over 24h ago with NO inspection filed. <strong>Admin Action Required:</strong> Nudge Hub staff to upload 3 photos or manually complete inspection to unblock renter deposit &amp; lister payout.
                </p>
              </div>
              <Link
                href="/admin/shipments"
                style={{
                  background: '#B45309',
                  color: '#FFF',
                  padding: '7px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(180, 83, 9, 0.2)',
                }}
              >
                Manage Queue &rarr;
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stuckReturnBookings.map((b) => {
                const leg3 = b.shipments?.[0];
                const arrivedAt = leg3?.deliveredAt ? new Date(leg3.deliveredAt) : new Date(b.updatedAt);
                const hoursWaiting = Math.max(24, Math.floor((Date.now() - arrivedAt.getTime()) / (1000 * 60 * 60)));
                const isCritical = hoursWaiting >= 48;

                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      border: `1px solid ${isCritical ? '#FCA5A5' : '#FDE68A'}`,
                      borderRadius: 8,
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{b.listing?.title}</span>
                        {b.listing?.sku && (
                          <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>
                            {b.listing.sku}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        Renter: <strong>{b.renter?.name}</strong> ({b.renter?.phone || 'No phone'}) • Lister: <strong>{b.listing?.lister?.shopName || b.listing?.lister?.user?.name}</strong>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                        Courier: {leg3?.courierName || 'Partner Logistics'} • Tracking: {leg3?.trackingNumber || 'N/A'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: isCritical ? '#FEE2E2' : '#FEF3C7',
                            color: isCritical ? '#991B1B' : '#92400E',
                            border: `1px solid ${isCritical ? '#F87171' : '#FCD34D'}`,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ⏳ {hoursWaiting}h Overdue
                        </span>
                        <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600, marginTop: 4 }}>
                          ⚠️ Deposit Refund Blocked
                        </div>
                      </div>

                      <Link
                        href={`/admin/shipments`}
                        style={{
                          background: '#92400E',
                          color: '#FFFFFF',
                          padding: '8px 14px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                          boxShadow: '0 2px 4px rgba(146, 64, 14, 0.15)',
                        }}
                      >
                        Complete Inspection &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chronic Overdue (Non-Returns) */}
        {chronicOverdue.length > 0 && (
          <div
            style={{
              background: '#FFF5F5',
              borderRadius: 12,
              border: '1px solid #FEB2B2',
              padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              gridColumn: '1 / -1',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#C53030' }}>
              🚨 Chronic Non-Returns (Action Required)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chronicOverdue.map((b) => {
                const diffTime = Date.now() - new Date(b.endDate).getTime();
                const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const shipment = b.shipments?.[0];
                const canForceSettle = daysOverdue >= 15;

                return (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#FFF',
                      border: '1px solid #FEB2B2',
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{b.listing.title}</div>
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                        Renter: {b.renter.name} ({b.renter.phone})
                      </div>
                      <div style={{ fontSize: 12, color: '#C53030', marginTop: 4, fontWeight: 600 }}>
                        {daysOverdue} Days Overdue
                        {shipment?.status === 'PICKUP_FAILED' && ' • (Pickup Failed)'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {shipment && shipment.status !== 'PICKUP_FAILED' && (
                        <button
                          onClick={async () => {
                            if (!confirm('Mark pickup as failed?')) return;
                            await fetch(`/api/admin/shipments/${shipment.id}/fail`, { method: 'POST' });
                            fetchDashboardData();
                          }}
                          style={{
                            background: '#FFF',
                            color: '#4A5568',
                            border: '1px solid #CBD5E0',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Mark Pickup Failed
                        </button>
                      )}
                      {!canForceSettle ? (
                        <div style={{
                          background: '#FED7D7',
                          color: '#C53030',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          border: '1px solid #FEB2B2'
                        }}>
                          🔒 Unlocks at 15 Days
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to forcefully settle this booking?\nThis will forfeit the renter's deposit, pay the lister, and write off the item.`)) return;
                            const res = await fetch(`/api/admin/bookings/${b.id}/force-settle`, { method: 'POST' });
                            const data = await res.json();
                            if (data.success) {
                              alert('Force settled successfully.');
                              fetchDashboardData();
                            } else {
                              alert(`Error: ${data.error}`);
                            }
                          }}
                          style={{
                            background: '#E53E3E',
                            color: '#FFF',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Force Settle (Forfeit)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
