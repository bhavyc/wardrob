'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HubDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ intake: 0, dispatch: 0, return: 0 });
  const [returnsDue, setReturnsDue] = useState<any[]>([]);

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
      <style>{`
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hub-header { margin-bottom: 32px; animation: pageFadeIn 0.4s ease both; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        @media (max-width: 768px) {
          .hub-header { flex-direction: column; align-items: stretch; }
          .hub-header > div:last-child { display: flex; flex-direction: column; width: 100%; gap: 8px; }
          .action-btn { justify-content: center; width: 100%; }
        }
        
        .hub-h1 {
          font-family: var(--font-inter), sans-serif;
          font-size: 32px; font-weight: 800; color: #0F172A; margin-bottom: 8px; letter-spacing: -0.02em;
        }
        @media (max-width: 768px) {
          .hub-h1 { font-size: 24px; }
        }
        
        .hub-sub { font-size: 14px; color: #64748B; font-weight: 500; }

        .kpi-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
          margin-bottom: 32px; animation: pageFadeIn 0.4s ease 0.1s both;
        }
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: 1fr; }
        }

        .kpi-card {
          background: #FFFFFF; border-radius: 16px; padding: 24px;
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02);
          display: flex; align-items: center; gap: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none; color: inherit;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02);
        }
        .kpi-icon {
          width: 56px; height: 56px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0;
        }
        .kpi-num { font-size: 32px; font-weight: 800; color: #0F172A; line-height: 1; margin-bottom: 4px; }
        .kpi-lbl { font-size: 12px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }

        .kpi-card.intake .kpi-icon { background: #EEF2FF; color: #4F46E5; }
        .kpi-card.dispatch .kpi-icon { background: #ECFDF5; color: #059669; }
        .kpi-card.return .kpi-icon { background: #FFF7ED; color: #EA580C; }

        .action-btn {
          background: #3B82F6; color: #FFFFFF; border: none; border-radius: 12px;
          padding: 14px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.2s ease; text-decoration: none; white-space: nowrap;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .action-btn:hover { background: #2563EB; }
        .action-btn.scan {
          background: #10B981;
        }
        .action-btn.scan:hover { background: #059669; }

        .panel-grid {
          display: grid; grid-template-columns: 2fr 1fr; gap: 24px;
          animation: pageFadeIn 0.4s ease 0.2s both;
        }
        @media (max-width: 900px) {
          .panel-grid { grid-template-columns: 1fr; }
        }

        .panel-card {
          background: #FFF; border-radius: 16px; padding: 24px;
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }
        .panel-title {
          font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 16px;
          display: flex; align-items: center; justify-content: space-between;
        }

        .return-item {
          padding: 16px; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 12px;
          background: #F8FAFC;
        }
        .return-item:last-child { margin-bottom: 0; }
        .return-item strong { display: block; color: #0F172A; font-size: 14px; margin-bottom: 4px; }
        .return-item span { color: #64748B; font-size: 12px; }

      `}</style>

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
              <div className="panel-title">
                Returns Due Today <span>{returnsDue.length}</span>
              </div>
              {returnsDue.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: 13 }}>
                  No returns expected today.
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {returnsDue.map(b => (
                    <div key={b.id} className="return-item">
                      <strong>{b.listing.title}</strong>
                      <span>{b.renter.name} &bull; 📞 {b.renter.phone || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
