'use client';

import { useState, useEffect } from 'react';

interface ListerItem {
  id: string;
  shopName: string | null;
  bio: string | null;
  aadhaarNumber: string | null;
  panNumber: string | null;
  bankAccountNo: string | null;
  bankIfsc: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  commissionOverride: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    idVerified: boolean;
    rating: string | null;
  };
  _count: {
    listings: number;
    payouts: number;
  };
}

export default function AdminListersPage() {
  const [listers, setListers] = useState<ListerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchListers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/listers');
      const data = await res.json();
      if (data.success) {
        setListers(data.listers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListers();
  }, []);

  const updateStatus = async (listerProfileId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/admin/listers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listerProfileId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setToast(`Lister profile ${status.toLowerCase()}!`);
        fetchListers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: '#10B981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Lister Profiles & KYC Verification
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Verify bank accounts, Aadhaar, and PAN cards for wardrobe owners listing items for rent.
          </p>
        </div>
        <button
          onClick={fetchListers}
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
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading listers...</div>
        ) : listers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No lister profiles registered.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Lister Details</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>KYC (Aadhaar & PAN)</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Payout Bank Account</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Wardrobe Listings</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>KYC Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listers.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{l.user.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{l.user.email}</div>
                      {l.user.phone && <div style={{ fontSize: 11, color: '#94A3B8' }}>📞 {l.user.phone}</div>}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: 12 }}>
                        <strong>Aadhaar:</strong>{' '}
                        {l.aadhaarNumber ? (
                          <span style={{ fontFamily: 'monospace' }}>{l.aadhaarNumber}</span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>Not provided</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>
                        <strong>PAN:</strong>{' '}
                        {l.panNumber ? (
                          <span style={{ fontFamily: 'monospace' }}>{l.panNumber}</span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>Not provided</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {l.bankAccountNo ? (
                        <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          <div>A/C: {l.bankAccountNo}</div>
                          <div style={{ color: '#64748B' }}>IFSC: {l.bankIfsc}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>No Bank Info</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      <strong>{l._count.listings}</strong> items listed
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background:
                            l.status === 'APPROVED' ? '#D1FAE5' : l.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                          color:
                            l.status === 'APPROVED' ? '#065F46' : l.status === 'PENDING' ? '#92400E' : '#991B1B',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {l.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      {l.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => updateStatus(l.id, 'APPROVED')}
                            style={{
                              background: '#059669',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(l.id, 'REJECTED')}
                            style={{
                              background: '#EF4444',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>Verified</span>
                      )}
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
