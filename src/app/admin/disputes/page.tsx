'use client';

import { useState, useEffect } from 'react';

import Pagination from '@/components/Pagination';

interface DisputeItem {
  id: string;
  status: 'OPEN' | 'RESOLVED';
  adminNotes: string | null;
  reason: string | null;
  raisedBy: string | null;
  createdAt: string;
  damageReport: {
    id: string;
    grade: string;
    deductionAmount: string;
    evidencePhotos: string[];
    booking: {
      id: string;
      renter: {
        name: string;
        email: string;
        phone: string | null;
      };
      listing: {
        title: string;
        lister: {
          user: {
            name: string;
            email: string;
          };
        };
      };
      damageReports?: any[];
    };
  };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [revisedDeduction, setRevisedDeduction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (data.success) {
        setDisputes(data.disputes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (status: 'RESOLVED' | 'OPEN') => {
    if (!selectedDispute) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId: selectedDispute.id,
          status,
          adminNotes: notesInput,
          revisedDeduction: revisedDeduction !== '' ? Number(revisedDeduction) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast('Dispute updated successfully!');
        setSelectedDispute(null);
        fetchDisputes();
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
            Damage Disputes & SLA Review
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Review Grade C damages and resolve conflicts between lister and renter within 48-hour SLA.
          </p>
        </div>
        <button
          onClick={fetchDisputes}
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
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
            🎉 No active damage disputes! All rental cycles clean.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Item & Booking</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Renter</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Lister</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Damage Grade</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Proposed Deduction</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>
                        {d.damageReport.booking.listing.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        Booking ID: {d.damageReport.booking.id.slice(0, 8)}...
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{d.damageReport.booking.renter.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{d.damageReport.booking.renter.email}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 600 }}>{d.damageReport.booking.listing.lister.user.name}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: d.damageReport.grade === 'C_MAJOR' ? '#FEE2E2' : '#FEF3C7',
                          color: d.damageReport.grade === 'C_MAJOR' ? '#991B1B' : '#92400E',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {d.damageReport.grade}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#EF4444' }}>
                      ₹{Number(d.damageReport.deductionAmount).toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          background: d.status === 'OPEN' ? '#FEF3C7' : '#D1FAE5',
                          color: d.status === 'OPEN' ? '#92400E' : '#065F46',
                          padding: '4px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {d.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedDispute(d);
                          setNotesInput(d.adminNotes || '');
                          setRevisedDeduction(d.damageReport.deductionAmount);
                        }}
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
                        {d.status === 'OPEN' ? 'Review & Adjudicate' : 'View Resolution'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalItems={disputes.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Review Evidence Modal */}
      {selectedDispute && (
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
              maxWidth: 580,
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#0F172A' }}>
              Dispute Investigation & Resolution
            </h3>

            {selectedDispute.reason && selectedDispute.raisedBy && (
              <div style={{ marginBottom: 16, padding: '12px', background: '#F1F5F9', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Renter's Dispute Reason</div>
                <div style={{ fontSize: '13px', color: '#0F172A' }}>{selectedDispute.reason}</div>
              </div>
            )}

            <div style={{ marginBottom: 20, fontSize: 13 }}>
              <strong>Quality Baseline vs Damage Evidence:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '12px' }}>
                {/* Before: baseline listing image -> Now PRE_DISPATCH inspection */}
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Baseline (Hub Pre-Dispatch)</div>
                  {(() => {
                    const preDispatchReport = selectedDispute.damageReport.booking.damageReports?.find((r: any) => r.inspectionType === 'PRE_DISPATCH');
                    const preDispatchImage = preDispatchReport?.evidencePhotos?.[0];
                    if (preDispatchImage) {
                      return (
                        <img
                          src={preDispatchImage}
                          alt="Baseline condition"
                          style={{ width: '100%', height: '140px', objectFit: 'cover', border: '1px solid var(--border)' }}
                        />
                      );
                    } else {
                      return (
                        <div style={{ width: '100%', height: '140px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>No baseline image</div>
                      );
                    }
                  })()}
                </div>

                {/* After: damage report evidence */}
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Evidence (Damage)</div>
                  {selectedDispute.damageReport.evidencePhotos?.[0] ? (
                    <img
                      src={selectedDispute.damageReport.evidencePhotos[0]}
                      alt="Damage evidence"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '140px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>No evidence image</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Final Deposit Deduction (₹)
              </label>
              <input
                type="number"
                value={revisedDeduction}
                onChange={(e) => setRevisedDeduction(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Admin Resolution & Notes
              </label>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Explain the resolution for lister and renter records..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
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
                type="button"
                onClick={() => handleResolve('RESOLVED')}
                disabled={submitting}
                style={{
                  padding: '8px 16px',
                  background: '#059669',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {submitting ? 'Resolving...' : 'Resolve Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
