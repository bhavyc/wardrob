'use client';

import { useState, useEffect } from 'react';

interface BookingItem {
  id: string;
  startDate: string;
  endDate: string;
  actualReturnDate: string | null;
  rentAmount: string;

  securityDeposit: string;
  lateReturnPenalty: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  renter: {
    name: string;
    email: string;
    phone: string | null;
    aadhaarNumber?: string | null;
    panNumber?: string | null;
  };
  listing: {
    title: string;
    category: string;
    baselineImages: string[];
    lister: {
      user: {
        name: string;
        email: string;
        phone: string | null;
      };
    };
  };
  shipments: Array<{
    id: string;
    leg: string;
    status: string;
    courierName: string | null;
    trackingNumber: string | null;
  }>;
  damageReports: Array<{
    id: string;
    grade: string;
    deductionAmount: string;
    inspectionType: string;
  }>;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/api/admin/bookings' : `/api/admin/bookings?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: '#FEF3C7', color: '#92400E', label: '⏳ Payment Pending' };
      case 'CONFIRMED':
        return { bg: '#DBEAFE', color: '#1E40AF', label: '📦 Confirmed (Awaiting Pickup)' };
      case 'AT_HUB_PRE':
        return { bg: '#E0E7FF', color: '#3730A3', label: '🧼 At Hub (Cleaning/Sanitizing)' };
      case 'OUT_FOR_DELIVERY':
        return { bg: '#FCE7F3', color: '#9D174D', label: '🚚 Out for Delivery to Renter' };
      case 'IN_USE':
        return { bg: '#EDE9FE', color: '#5B21B6', label: '👗 In Use (With Renter)' };
      case 'RETURNED_TO_HUB':
        return { bg: '#FEF9C3', color: '#854D0E', label: '🔍 Returned to Hub (Inspecting)' };
      case 'COMPLETED':
        return { bg: '#D1FAE5', color: '#065F46', label: '✅ Rental Completed' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', color: '#991B1B', label: '❌ Cancelled' };
      default:
        return { bg: '#F1F5F9', color: '#475569', label: status };
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Rental Bookings & Logistics
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Monitor real-time rental cycles across the 4 physical legs and hub transitions.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          style={{
            background: '#fff',
            border: '1px solid #CBD5E1',
            borderRadius: 6,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'All Bookings' },
          { key: 'CONFIRMED', label: 'Confirmed' },
          { key: 'AT_HUB_PRE', label: 'At Hub (Pre)' },
          { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
          { key: 'IN_USE', label: 'In Use' },
          { key: 'RETURNED_TO_HUB', label: 'Returned to Hub' },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: statusFilter === f.key ? '#0F172A' : '#E2E8F0',
              color: statusFilter === f.key ? '#FFF' : '#475569',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: '#FFF',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No bookings found in this view.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Booking / Item</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Renter</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Lister</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Rental Dates</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Amount Breakdown</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const badge = getStatusBadge(b.status);
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>{b.listing.title}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          ID: <span style={{ fontFamily: 'monospace' }}>{b.id.slice(0, 8)}...</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{b.renter.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{b.renter.email}</div>
                        {b.renter.phone && <div style={{ fontSize: 11, color: '#94A3B8' }}>📞 {b.renter.phone}</div>}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{b.listing.lister.user.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{b.listing.lister.user.email}</div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: 12, color: '#0F172A' }}>
                          {new Date(b.startDate).toLocaleDateString()} &rarr; {new Date(b.endDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          ₹{Number(b.totalAmount).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Rent: ₹{Number(b.rentAmount)} | Deposit: ₹{Number(b.securityDeposit)}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-block',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Booking Details */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: 12,
              padding: 24,
              maxWidth: 520,
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Booking Details & Financials
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#334155' }}>
              <div style={{ marginBottom: 12 }}>
                <strong>Item:</strong> {selectedBooking.listing.title} ({selectedBooking.listing.category})
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Renter:</strong> {selectedBooking.renter.name} ({selectedBooking.renter.email})
                {selectedBooking.renter.aadhaarNumber && (
                  <div style={{ marginTop: 4, color: '#64748B', fontSize: 11 }}>
                    Aadhaar: <span style={{ fontFamily: 'monospace' }}>{selectedBooking.renter.aadhaarNumber}</span>
                  </div>
                )}
                {selectedBooking.renter.panNumber && (
                  <div style={{ marginTop: 2, color: '#64748B', fontSize: 11 }}>
                    PAN: <span style={{ fontFamily: 'monospace' }}>{selectedBooking.renter.panNumber}</span>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Lister:</strong> {selectedBooking.listing.lister.user.name} ({selectedBooking.listing.lister.user.email})
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: 14,
                  marginTop: 14,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#0F172A' }}>Cost Breakdown</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Rental Charge:</span>
                  <span>₹{Number(selectedBooking.rentAmount).toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Refundable Security Deposit:</span>
                  <span>₹{Number(selectedBooking.securityDeposit).toLocaleString('en-IN')}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid #CBD5E1',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#0F172A',
                  }}
                >
                  <span>Total Collected from Renter:</span>
                  <span>₹{Number(selectedBooking.totalAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{
                  padding: '8px 16px',
                  background: '#0F172A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
