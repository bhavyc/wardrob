'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HubScanPage() {
  const router = useRouter();
  const [sku, setSku] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on load to support barcode scanners
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/hub/scan?sku=${encodeURIComponent(sku.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to find item');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
      setSku(''); // Clear input for next scan
    }
  };

  return (
    <>
      <style>{`
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .scan-container {
          max-width: 600px; margin: 0 auto;
          animation: pageFadeIn 0.4s ease both;
        }

        .scan-header { margin-bottom: 32px; }
        .scan-h1 { font-family: var(--font-inter), sans-serif; font-size: 28px; font-weight: 800; color: #0F172A; margin-bottom: 8px; }
        .scan-sub { font-size: 14px; color: #64748B; font-weight: 500; }

        .scan-card {
          background: #FFFFFF; border-radius: 16px; padding: 32px;
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 10px 25px -5px rgba(15,23,42,0.05);
          margin-bottom: 24px;
        }

        .scan-input-group {
          position: relative;
        }
        .scan-input {
          width: 100%; height: 60px; padding: 0 24px; padding-left: 54px;
          font-size: 18px; font-weight: 600; color: #0F172A;
          background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 12px;
          outline: none; transition: all 0.2s;
        }
        .scan-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .scan-icon {
          position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
          color: #94A3B8;
        }
        .scan-btn {
          position: absolute; right: 8px; top: 8px; bottom: 8px;
          background: #10B981; color: #FFF; border: none; border-radius: 8px;
          padding: 0 20px; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .scan-btn:hover { background: #059669; }
        .scan-btn:disabled { background: #CBD5E1; cursor: not-allowed; }

        .result-card {
          background: #FFF; border-radius: 16px; overflow: hidden;
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 10px 25px -5px rgba(15,23,42,0.05);
          animation: pageFadeIn 0.3s ease both;
        }
        .result-header { padding: 24px; border-bottom: 1px solid #F1F5F9; display: flex; gap: 20px; }
        .result-img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; background: #F8FAFC; }
        .result-title { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
        .result-sku { font-family: monospace; font-size: 13px; color: #64748B; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; }
        
        .result-body { padding: 24px; }
        .result-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .result-row strong { color: #334155; }
        .result-row span { color: #64748B; }

        .result-action {
          padding: 24px; background: #F8FAFC; border-top: 1px solid #F1F5F9;
          display: flex; justify-content: space-between; align-items: center; gap: 16px;
        }
        @media (max-width: 480px) {
          .result-action { flex-direction: column; align-items: stretch; text-align: center; }
          .proceed-btn { width: 100%; }
        }
        .action-indicator { display: flex; alignItems: center; gap: 8px; font-weight: 700; font-size: 15px; justify-content: center; }
        .indicator-dot { width: 12px; height: 12px; border-radius: 50%; }

        .proceed-btn {
          background: #0F172A; color: #FFF; border: none; border-radius: 8px;
          padding: 10px 20px; font-weight: 600; cursor: pointer; text-decoration: none;
        }
        .proceed-btn:hover { background: #1E293B; }
      `}</style>

      <div className="scan-container">
        <Link href="/hub" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontWeight: 600, fontSize: '14px', marginBottom: '24px' }}>
          &larr; Back to Dashboard
        </Link>

        <div className="scan-header">
          <h1 className="scan-h1">Scan Item</h1>
          <p className="scan-sub">Scan the barcode or enter the SKU to pull up item details.</p>
        </div>

        <div className="scan-card">
          <form onSubmit={handleScan}>
            <div className="scan-input-group">
              <svg className="scan-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3"/>
                <rect x="7" y="7" width="10" height="10" />
              </svg>
              <input 
                ref={inputRef}
                type="text" 
                className="scan-input" 
                placeholder="WR-XXXXXX" 
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                autoComplete="off"
              />
              <button type="submit" className="scan-btn" disabled={loading || !sku.trim()}>
                {loading ? 'Searching...' : 'Scan'}
              </button>
            </div>
          </form>
          {error && <div style={{ marginTop: '16px', color: '#EF4444', fontSize: '14px', fontWeight: 500 }}>⚠ {error}</div>}
        </div>

        {result && result.listing && (
          <div className="result-card">
            <div className="result-header">
              {result.listing.baselineImages?.[0] && (
                <img src={result.listing.baselineImages[0]} alt="" className="result-img" />
              )}
              <div>
                <div className="result-title">{result.listing.title}</div>
                <div style={{ marginBottom: 8 }}><span className="result-sku">{result.listing.sku}</span></div>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Category: {result.listing.category} | Size: {result.listing.size}
                </div>
              </div>
            </div>

            <div className="result-body">
              <div className="result-row">
                <strong>Current Status:</strong>
                <span>{result.listing.status}</span>
              </div>
              <div className="result-row">
                <strong>Shelf Location:</strong>
                <span>{result.listing.shelfLocation ? (
                  <strong style={{ color: '#0F172A', background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                    {result.listing.shelfLocation}
                  </strong>
                ) : 'Not Assigned'}</span>
              </div>

              {result.currentBooking && (
                <>
                  <hr style={{ border: 'none', borderTop: '1px dashed #E2E8F0', margin: '16px 0' }} />
                  <div className="result-row">
                    <strong>Active Booking ID:</strong>
                    <span style={{ fontFamily: 'monospace' }}>{result.currentBooking.id.slice(0,8)}...</span>
                  </div>
                  <div className="result-row">
                    <strong>Renter:</strong>
                    <span>{result.currentBooking.renter.name} (📞 {result.currentBooking.renter.phone || 'N/A'})</span>
                  </div>
                  <div className="result-row">
                    <strong>Dates:</strong>
                    <span>{new Date(result.currentBooking.startDate).toLocaleDateString()} &rarr; {new Date(result.currentBooking.endDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}
            </div>

            <div className="result-action">
              <div className="action-indicator" style={{ color: result.actionColor }}>
                <div className="indicator-dot" style={{ background: result.actionColor }} />
                {result.nextAction}
              </div>
              {result.nextAction.includes('Inspection') ? (
                <Link href={`/hub/inspections?sku=${result.listing.sku}`} className="proceed-btn">
                  Start Inspection &rarr;
                </Link>
              ) : (
                <Link href={`/hub/inspections?sku=${result.listing.sku}&action=store`} className="proceed-btn">
                  Update Storage Location &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
