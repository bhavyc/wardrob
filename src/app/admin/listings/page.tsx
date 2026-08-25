'use client';

import { useState, useEffect } from 'react';

interface ListingItem {
  id: string;
  title: string;
  category: string;
  size: string;
  condition: string;
  rentalPricePerDay: string;
  securityDeposit: string;
  baselineImages: string[];
  status: string;
  isFeatured: boolean;
  createdAt: string;
  lister: {
    shopName: string | null;
    user: {
      name: string;
      email: string;
    };
  };
  _count: {
    bookings: number;
  };
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/listings');
      const data = await res.json();
      if (data.success) {
        setListings(data.listings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const toggleFeatured = async (listingId: string, current: boolean) => {
    try {
      await fetch('/api/admin/listings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, isFeatured: !current }),
      });
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Rental Listings Catalog
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Verify peer-to-peer wardrobe inventory, baseline photo submissions, and featured status.
          </p>
        </div>
        <button
          onClick={fetchListings}
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
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading listings...</div>
        ) : listings.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No listings found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Item</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Lister</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Rental Rate</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Security Deposit</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Total Rentals</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Featured</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {item.category} • Size: {item.size} • Condition: {item.condition}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{item.lister.user.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{item.lister.user.email}</div>
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0F172A' }}>
                      ₹{Number(item.rentalPricePerDay).toLocaleString('en-IN')}/day
                    </td>

                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      ₹{Number(item.securityDeposit).toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      {item._count.bookings} bookings
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: item.status === 'AVAILABLE' ? '#D1FAE5' : '#F1F5F9',
                          color: item.status === 'AVAILABLE' ? '#065F46' : '#475569',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => toggleFeatured(item.id, item.isFeatured)}
                        style={{
                          background: item.isFeatured ? '#FEF3C7' : '#F1F5F9',
                          color: item.isFeatured ? '#92400E' : '#64748B',
                          border: '1px solid #CBD5E1',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {item.isFeatured ? '★ Featured' : '☆ Standard'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
