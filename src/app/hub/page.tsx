'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';
import './hub-dashboard.css';

export default function HubDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ intake: 0, dispatch: 0, return: 0 });
  const [returnsDue, setReturnsDue] = useState<any[]>([]);
  const [returnPage, setReturnPage] = useState(1);
  const RETURNS_PER_PAGE = 4;

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/hub/bookings');
        if (res.status === 401 || res.status === 403) {
          router.push('/hub/login');
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setStats({
            intake: data.intakeBookings?.length || 0,
            dispatch: data.preDispatchBookings?.length || 0,
            return: data.postReturnBookings?.length || 0,
          });
          setReturnsDue(data.returnsDueToday || []);
        } else {
          setError(data.error || 'Failed to load stats');
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [router]);

  return (
    <>
      <div className="hub-header">
        <div>
          <h1 className="hub-h1">Operations Dashboard</h1>
          <p className="hub-sub">Monitor physical items at the quality inspection center.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/hub/inspections" className="action-btn">
            Inspection Queue
          </Link>
          <Link href="/hub/scan" className="action-btn scan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3"/>
              <rect x="7" y="7" width="10" height="10" />
            </svg>
            Scan Item
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading Dashboard...</div>
      ) : error ? (
        <div style={{ padding: 16, background: '#FEF2F2', color: '#991B1B', borderRadius: 8 }}>{error}</div>
      ) : (
        <>
          <div className="kpi-grid">
            <Link href="/hub/inspections" className="kpi-card intake">
              <div className="kpi-icon">📦</div>
              <div>
                <div className="kpi-num">{stats.intake}</div>
                <div className="kpi-lbl">Pending Intake</div>
              </div>
            </Link>

            <Link href="/hub/inspections" className="kpi-card dispatch">
              <div className="kpi-icon">🚚</div>
              <div>
                <div className="kpi-num">{stats.dispatch}</div>
                <div className="kpi-lbl">Ready for Dispatch</div>
              </div>
            </Link>

            <Link href="/hub/inspections" className="kpi-card return">
              <div className="kpi-icon">🔄</div>
              <div>
                <div className="kpi-num">{stats.return}</div>
                <div className="kpi-lbl">Awaiting Return Check</div>
              </div>
            </Link>
          </div>

          <div className="panel-grid">
            <div className="panel-card" style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)', color: '#FFF' }}>
              <div style={{ maxWidth: '500px' }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Hub Inspections Protocol</h2>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
                  Ensure that every garment passing through the Hub is thoroughly inspected and documented. 
                  Use the Scan Item tool to quickly pull up an item's details and proceed with its next required action.
                </p>
                <Link href="/hub/scan" className="action-btn scan">
                  Open Scanner
                </Link>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Returns Due Today <span style={{ background: '#0F172A', color: '#FFF', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', marginLeft: '6px' }}>{returnsDue.length}</span></span>
                {returnsDue.length > 0 && (
                  <Link href="/hub/inspections?stage=POST_RETURN" style={{ fontSize: '12px', color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
                    Process in QC &rarr;
                  </Link>
                )}
              </div>
              {returnsDue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: 13 }}>
                  No returns expected today.
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {returnsDue
                      .slice((returnPage - 1) * RETURNS_PER_PAGE, returnPage * RETURNS_PER_PAGE)
                      .map(b => (
                        <div key={b.id} className="return-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                          <div>
                            <strong>{b.listing?.title || 'Garment'}</strong>
                            <span>{b.renter?.name || 'Renter'} &bull; 📞 {b.renter?.phone || 'N/A'}</span>
                          </div>
                          <Link
                            href={`/hub/inspections?stage=POST_RETURN&sku=${encodeURIComponent(b.listing?.sku || '')}`}
                            className="action-btn"
                            style={{ padding: '6px 12px', fontSize: '12px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
                          >
                            Inspect
                          </Link>
                        </div>
                      ))}
                  </div>

                  {returnsDue.length > RETURNS_PER_PAGE && (
                    <div style={{ marginTop: 14 }}>
                      <Pagination
                        currentPage={returnPage}
                        totalItems={returnsDue.length}
                        itemsPerPage={RETURNS_PER_PAGE}
                        onPageChange={setReturnPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
