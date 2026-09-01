'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/Pagination';

interface PartnerItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  idVerified: boolean;
  createdAt: string;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json();
      if (data.success) {
        setPartners(data.partners);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToast('Hub Partner registered successfully!');
        setShowModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        fetchPartners();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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
            Hub & Cleaning Partners
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Manage local dry-cleaning and logistics inspection partners authorized to sanitize and grade rental items.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: '#0F172A',
            border: 'none',
            borderRadius: 6,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#FFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ➕ Onboard Hub Partner
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
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading hub partners...</div>
        ) : partners.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
            No hub partners registered yet. Click "Onboard Hub Partner" to add one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Partner / Hub Name</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Email Address</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Phone / WhatsApp</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Role & Verification</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Added On</th>
                </tr>
              </thead>
              <tbody>
                {partners.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>
                      🧼 {p.name}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>{p.email}</td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>{p.phone || 'N/A'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: '#ECFDF5',
                          color: '#059669',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ✓ Verified Hub
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#94A3B8' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={partners.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      {showModal && (
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
              maxWidth: 440,
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#0F172A' }}>
              Onboard Hub / Cleaning Partner
            </h3>
            <form onSubmit={handleCreatePartner}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Hub / Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Dry Cleaners - Indiranagar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Partner Email Address (Login)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. hub.indiranagar@wardrob.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Phone / Contact
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SecurePassword123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
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
                  {submitting ? 'Saving...' : 'Authorize Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
