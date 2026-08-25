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
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentBookings(data.recentBookings || []);
        setRecentPayouts(data.recentPayouts || []);
        setChronicOverdue(data.chronicOverdueBookings || []);
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
                      <button
                        disabled={!canForceSettle}
                        title={!canForceSettle ? 'Must be 15+ days overdue' : ''}
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
                          background: canForceSettle ? '#E53E3E' : '#FC8181',
                          color: '#FFF',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: canForceSettle ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Force Settle (Forfeit)
                      </button>
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
