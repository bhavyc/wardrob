'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LiveCameraCapture from '@/components/LiveCameraCapture';
import './mobile-capture.css';

export default function MobileCapturePage() {
  const routeParams = useParams();
  const [token, setToken] = useState<string>('');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'NOT_FOUND'>('ACTIVE');
  const [bookingInfo, setBookingInfo] = useState<{ id: string; listing?: { title: string; sku?: string } } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    const paramToken = routeParams?.token as string;
    const urlToken = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean).pop() : '';
    const resolved = paramToken || urlToken || '';
    if (resolved) {
      setToken(resolved);
    }
  }, [routeParams]);

  useEffect(() => {
    if (!token) return;
    fetchSession(token);
  }, [token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchSession = async (activeToken: string) => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`/api/hub/mobile-capture/${activeToken}/photos`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 401) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      if (res.status === 404) {
        setSessionStatus('NOT_FOUND');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setSessionStatus(data.status);
        setPhotos(data.photos || []);
        if (data.booking) {
          setBookingInfo(data.booking);
        }
      } else {
        if (data.status) {
          setSessionStatus(data.status);
        } else {
          setSessionStatus('NOT_FOUND');
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
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

      const res = await fetch(`/api/hub/mobile-capture/${token}/photos`, {
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
      const res = await fetch('/api/hub/mobile-capture/session', {
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
          <div className="mc-status-icon info">⌛</div>
          <h2 className="mc-status-title">Connecting Session...</h2>
          <p className="mc-status-desc">Pairing with your desktop inspection screen.</p>
          <button
            type="button"
            className="mc-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              if (token) fetchSession(token);
              else window.location.reload();
            }}
          >
            Refresh Connection
          </button>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="mc-container">
        <div className="mc-status-card">
          <div className="mc-status-icon error">🔒</div>
          <h2 className="mc-status-title">Hub Authentication Required</h2>
          <p className="mc-status-desc">
            Please log in with your Hub Partner account on this mobile device to upload inspection photos.
          </p>
          <button
            className="mc-btn-primary"
            onClick={() => router.push(`/hub/login?returnUrl=/hub/mobile-capture/${token}`)}
          >
            Log In as Hub Partner
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
            All {photos.length} photos have been synced directly to your desktop inspection form. You can return to your computer to finalize the report.
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
          <span>WARDROB HUB</span>
        </div>
        <div className="mc-live-badge">
          <span className="mc-pulse-dot" />
          <span>Syncing Live</span>
        </div>
      </header>

      {/* Item info bar */}
      <div className="mc-subhead">
        <div className="mc-listing-title">
          {bookingInfo?.listing?.title || 'Inspection Form'}
          {bookingInfo?.listing?.sku ? ` (${bookingInfo.listing.sku})` : ''}
        </div>
        <div className="mc-count-badge">
          {photos.length} photo{photos.length === 1 ? '' : 's'} sent
        </div>
      </div>

      {/* Main Content: Camera View */}
      <main className="mc-content">
        {/* 3-Step QC Requirement Bar */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 14,
          border: photos.length >= 3 ? '1px solid #86EFAC' : '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
              Mandatory QC Photos (3 Minimum)
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 12,
              background: photos.length >= 3 ? '#DCFCE7' : '#FEF3C7',
              color: photos.length >= 3 ? '#166534' : '#B45309'
            }}>
              {photos.length >= 3 ? `✓ ${photos.length} Synced` : `${photos.length}/3 Captured`}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11 }}>
            <div style={{
              padding: '6px 4px', textAlign: 'center', borderRadius: 6,
              background: photos.length >= 1 ? '#DCFCE7' : '#F1F5F9',
              color: photos.length >= 1 ? '#15803D' : '#64748B',
              fontWeight: 600, border: photos.length === 0 ? '1.5px solid #0F172A' : 'none'
            }}>
              {photos.length >= 1 ? '✓ 1. Front' : '1. Front'}
            </div>
            <div style={{
              padding: '6px 4px', textAlign: 'center', borderRadius: 6,
              background: photos.length >= 2 ? '#DCFCE7' : '#F1F5F9',
              color: photos.length >= 2 ? '#15803D' : '#64748B',
              fontWeight: 600, border: photos.length === 1 ? '1.5px solid #0F172A' : 'none'
            }}>
              {photos.length >= 2 ? '✓ 2. Back' : '2. Back'}
            </div>
            <div style={{
              padding: '6px 4px', textAlign: 'center', borderRadius: 6,
              background: photos.length >= 3 ? '#DCFCE7' : '#F1F5F9',
              color: photos.length >= 3 ? '#15803D' : '#64748B',
              fontWeight: 600, border: photos.length === 2 ? '1.5px solid #0F172A' : 'none'
            }}>
              {photos.length >= 3 ? '✓ 3. Detail' : '3. Detail'}
            </div>
          </div>
        </div>

        <div className="mc-camera-wrapper">
          <LiveCameraCapture
            onCapture={handleCapture}
            multiCapture={true}
            captureCount={photos.length}
            buttonText={
              uploading
                ? 'Syncing Photo...'
                : photos.length === 0
                ? '📸 Snap Photo 1 (Front View)'
                : photos.length === 1
                ? '📸 Snap Photo 2 (Back View)'
                : photos.length === 2
                ? '📸 Snap Photo 3 (Detail / Tag)'
                : `📸 Snap Photo ${photos.length + 1} (Additional Angle)`
            }
            guideText={
              photos.length === 0
                ? 'Step 1/3: Align Full Front View inside frame'
                : photos.length === 1
                ? 'Step 2/3: Turn garment & align Full Back View'
                : photos.length === 2
                ? 'Step 3/3: Align Close-up of Tag, Detail or Lining'
                : '✓ 3 photos captured! Add more angles if needed'
            }
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
            disabled={uploading || photos.length < 3}
            style={{
              opacity: photos.length < 3 ? 0.6 : 1,
              cursor: photos.length < 3 ? 'not-allowed' : 'pointer',
              background: photos.length >= 3 ? '#059669' : '#475569',
              transition: 'all 0.2s'
            }}
          >
            {photos.length < 3
              ? `📸 Take ${3 - photos.length} more photo(s) (${photos.length}/3 required)`
              : `✓ Complete QC (${photos.length} Photos Synced)`}
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
