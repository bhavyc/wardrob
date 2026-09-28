'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import LiveCameraCapture from '@/components/LiveCameraCapture';
import '../../../hub/mobile-capture/[token]/mobile-capture.css'; // Reusing mobile capture styles

export default function ListerMobileCapturePage() {
  const routeParams = useParams();
  const rawToken = routeParams?.token;
  const paramToken = (Array.isArray(rawToken) ? rawToken[0] : rawToken) || '';

  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'NOT_FOUND'>('ACTIVE');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const fetchedTokenRef = useRef<string>('');

  useEffect(() => {
    let resolved = paramToken;
    if (!resolved && typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('mobile-capture');
      if (idx !== -1 && parts[idx + 1]) {
        resolved = parts[idx + 1];
      } else if (parts.length > 0 && parts[parts.length - 1] !== 'mobile-capture') {
        resolved = parts[parts.length - 1];
      }
    }

    if (!resolved || resolved === 'mobile-capture') {
      setSessionStatus('NOT_FOUND');
      setLoading(false);
      return;
    }

    setToken(resolved);

    // Prevent duplicate or infinite fetching for the same token
    if (fetchedTokenRef.current === resolved) {
      return;
    }
    fetchedTokenRef.current = resolved;

    fetchSession(resolved);
  }, [paramToken]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchSession = async (activeToken: string) => {
    if (!activeToken || activeToken === 'mobile-capture') {
      setSessionStatus('NOT_FOUND');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorDetails(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`/api/lister/mobile-capture/${encodeURIComponent(activeToken)}/photos`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        setSessionStatus('NOT_FOUND');
        setLoading(false);
        return;
      }
      if (res.status === 410) {
        setSessionStatus('EXPIRED');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setSessionStatus(data.status || 'ACTIVE');
        setPhotos(data.photos || []);
      } else {
        if (data.status) {
          setSessionStatus(data.status);
        } else {
          setErrorDetails(data.error || 'Unable to pair session.');
        }
      }
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setErrorDetails(err?.name === 'AbortError' ? 'Connection timed out. Please tap retry.' : 'Network connection error. Please tap retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (blob: Blob) => {
    if (sessionStatus !== 'ACTIVE') return;

    try {
      setUploading(true);
      const formData = new FormData();
      const file = new File([blob], `cam_${Date.now()}.jpg`, { type: 'image/jpeg' });
      formData.append('file', file);

      const res = await fetch(`/api/lister/mobile-capture/${token}/photos`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.photos) {
          setPhotos(data.photos);
        } else if (data.url) {
          setPhotos(prev => [...prev, data.url]);
        }
        showToast('✓ Photo synced to desktop!');
      } else {
        alert(data.error || 'Failed to upload photo.');
        if (res.status === 410) {
          setSessionStatus('EXPIRED');
        }
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Network error while uploading photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async () => {
    try {
      const res = await fetch('/api/lister/mobile-capture/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status: 'COMPLETED' }),
      });
      if (res.ok) {
        setSessionStatus('COMPLETED');
      }
    } catch (err) {
      console.error('Error completing session:', err);
    }
  };

  if (loading) {
    return (
      <div className="mc-container">
        <div className="mc-status-card">
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(197, 168, 128, 0.25)',
            borderTopColor: '#D4567A',
            animation: 'mcSpin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h2 className="mc-status-title">Connecting Session...</h2>
          <p className="mc-status-desc">Pairing with your desktop form.</p>
          <button
            type="button"
            className="mc-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              const active = token || fetchedTokenRef.current || paramToken;
              if (active) fetchSession(active);
              else window.location.reload();
            }}
          >
            Refresh Connection
          </button>
        </div>
      </div>
    );
  }

  if (errorDetails) {
    return (
      <div className="mc-container">
        <div className="mc-status-card">
          <div className="mc-status-icon error">⚠️</div>
          <h2 className="mc-status-title">Connection Error</h2>
          <p className="mc-status-desc">{errorDetails}</p>
          <button
            type="button"
            className="mc-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              const active = token || fetchedTokenRef.current || paramToken;
              if (active) fetchSession(active);
              else window.location.reload();
            }}
          >
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'NOT_FOUND') {
    return (
      <div className="mc-container">
        <div className="mc-status-card">
          <div className="mc-status-icon error">✕</div>
          <h2 className="mc-status-title">Session Not Found</h2>
          <p className="mc-status-desc">
            This QR code link is invalid or has been deleted. Please generate a new one on desktop.
          </p>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'EXPIRED') {
    return (
      <div className="mc-container">
        <div className="mc-status-card">
          <div className="mc-status-icon error">⏳</div>
          <h2 className="mc-status-title">Session Expired</h2>
          <p className="mc-status-desc">
            For security, mobile capture sessions expire after 15 minutes. Please scan a fresh QR code from your desktop screen.
          </p>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'COMPLETED') {
    return (
      <div className="mc-container">
        <div className="mc-status-card">
          <div className="mc-status-icon success">✓</div>
          <h2 className="mc-status-title">Session Complete!</h2>
          <p className="mc-status-desc">
            All {photos.length} photos have been synced directly to your desktop form. You can return to your computer to submit the listing.
          </p>
          <button className="mc-btn-secondary" onClick={() => window.close()}>
            Close This Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-container">
      {/* Top Header */}
      <header className="mc-header">
        <div className="mc-brand-title">
          <span>WARDROB LISTER</span>
        </div>
        <div className="mc-live-badge">
          <span className="mc-pulse-dot" />
          <span>Syncing Live</span>
        </div>
      </header>

      {/* Item info bar */}
      <div className="mc-subhead">
        <div className="mc-listing-title">
          Add Listing Photos
        </div>
        <div className="mc-count-badge">
          {photos.length} photo{photos.length === 1 ? '' : 's'} sent
        </div>
      </div>

      {/* Main Content: Camera View */}
      <main className="mc-content">
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              Capture High-Quality Photos
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 12,
              background: '#DCFCE7',
              color: '#166534'
            }}>
              {photos.length} Synced
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#64748B', marginTop: 6, lineHeight: 1.4 }}>
            Take clear photos of the front, back, and any important details (tags, embroidery, defects). Ensure good lighting.
          </p>
        </div>

        <div className="mc-camera-wrapper">
          <LiveCameraCapture
            onCapture={handleCapture}
            multiCapture={true}
            captureCount={photos.length}
            buttonText={uploading ? 'Syncing Photo...' : '📸 Snap Photo'}
            guideText={'Align item clearly in frame'}
          />
        </div>

        {/* Gallery Strip of photos captured so far */}
        {photos.length > 0 && (
          <div className="mc-gallery-strip">
            <div className="mc-gallery-title">
              <span>Synced to Desktop ({photos.length} photos)</span>
            </div>
            <div className="mc-thumbnails">
              {photos.map((url, idx) => (
                <div key={idx} className="mc-thumb-item">
                  <img src={url} alt={`Captured ${idx + 1}`} />
                  <span style={{
                    position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.7)',
                    color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 700
                  }}>
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finish / Done Action */}
        <div className="mc-footer-actions">
          <button
            className="mc-finish-btn"
            onClick={handleFinish}
            disabled={uploading || photos.length === 0}
            style={{
              opacity: photos.length === 0 ? 0.6 : 1,
              cursor: photos.length === 0 ? 'not-allowed' : 'pointer',
              background: photos.length > 0 ? '#059669' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            {photos.length === 0
              ? '📸 Capture at least 1 photo'
              : `✓ Done Capturing (${photos.length} Synced)`}
          </button>
        </div>
      </main>

      {/* Live sync toast */}
      {toastMessage && (
        <div className="mc-toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
