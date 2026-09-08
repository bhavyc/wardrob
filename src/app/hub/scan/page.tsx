'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './hub-scan.css';

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
