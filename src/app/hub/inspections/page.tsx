'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Pagination from '@/components/Pagination';
import './hub-inspections.css';

type SyncedPhoto = {
  id: string;
  url: string;
};

type ActiveTab = 'INTAKE' | 'PRE_DISPATCH' | 'POST_RETURN' | 'HISTORY';

export default function HubInspections() {
  const router = useRouter();
  const [intake, setIntake] = useState<any[]>([]);
  const [preDispatch, setPreDispatch] = useState<any[]>([]);
  const [postReturn, setPostReturn] = useState<any[]>([]);
  const [recentInspections, setRecentInspections] = useState<any[]>([]);
  
  // Active Stage Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('INTAKE');
  const [viewLayout, setViewLayout] = useState<'FOCUSED' | 'KANBAN'>('FOCUSED');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [inspectionType, setInspectionType] = useState<'LISTER_TO_HUB_INTAKE' | 'PRE_DISPATCH' | 'POST_RETURN' | null>(null);
  const [grade, setGrade] = useState('A_NO_ISSUE');
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [isItemComplete, setIsItemComplete] = useState(true);
  const [missingPartsDescription, setMissingPartsDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedSku, setGeneratedSku] = useState('');

  // Mobile Synced Photos state (populated via phone camera pairing)
  const [evidencePhotos, setEvidencePhotos] = useState<SyncedPhoto[]>([]);

  // Cross-Device Mobile Capture Handoff state
  const [mobileCaptureToken, setMobileCaptureToken] = useState<string | null>(null);
  const [mobileCaptureUrl, setMobileCaptureUrl] = useState<string | null>(null);
  const [startingMobileSession, setStartingMobileSession] = useState(false);
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);

  // Search Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Next Step Guidance Modal State
  type NextStepGuidance = {
    title: string;
    icon: 'inbound' | 'return' | 'dispatch' | 'settle';
    badge: string;
    garmentTitle: string;
    bookingId: string;
    description: string;
    actionText: string;
    actionUrl: string;
  };
  const [nextStepModal, setNextStepModal] = useState<NextStepGuidance | null>(null);

  // Full-Screen Image Lightbox Zoom state
  const [selectedRefImgIndex, setSelectedRefImgIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxGallery, setLightboxGallery] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      } else if (e.key === 'ArrowLeft' && lightboxGallery.length > 1 && lightboxImage) {
        const prevIdx = (lightboxIndex - 1 + lightboxGallery.length) % lightboxGallery.length;
        setLightboxIndex(prevIdx);
        setLightboxImage(lightboxGallery[prevIdx]);
      } else if (e.key === 'ArrowRight' && lightboxGallery.length > 1 && lightboxImage) {
        const nextIdx = (lightboxIndex + 1) % lightboxGallery.length;
        setLightboxIndex(nextIdx);
        setLightboxImage(lightboxGallery[nextIdx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, lightboxGallery, lightboxIndex]);

  useEffect(() => {
    fetchBookings();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stageParam = params.get('stage');
      const skuParam = params.get('sku');
      if (stageParam && ['INTAKE', 'PRE_DISPATCH', 'POST_RETURN', 'HISTORY'].includes(stageParam)) {
        setActiveTab(stageParam as ActiveTab);
      }
      if (skuParam) {
        setSearchQuery(skuParam);
      }
    }
  }, []);

  // Deep Link: Auto-open modal if bookingId is in query params
  useEffect(() => {
    if (typeof window !== 'undefined' && !activeBooking) {
      const params = new URLSearchParams(window.location.search);
      const bookingIdParam = params.get('bookingId');
      const stageParam = params.get('stage');

      if (bookingIdParam) {
        if (stageParam === 'INTAKE' && intake.length > 0) {
          const match = intake.find(b => b.id === bookingIdParam);
          if (match) openModal(match, 'LISTER_TO_HUB_INTAKE');
        } else if (stageParam === 'POST_RETURN' && postReturn.length > 0) {
          const match = postReturn.find(b => b.id === bookingIdParam);
          if (match) openModal(match, 'POST_RETURN');
        } else if (stageParam === 'PRE_DISPATCH' && preDispatch.length > 0) {
          const match = preDispatch.find(b => b.id === bookingIdParam);
          if (match) openModal(match, 'PRE_DISPATCH');
        }
      }
    }
  }, [intake, postReturn, preDispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/hub/bookings');
      if (res.status === 403 || res.status === 401) {
        router.push('/hub/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setIntake(data.intakeBookings || []);
        setPreDispatch(data.preDispatchBookings || []);
        setPostReturn(data.postReturnBookings || []);
        setRecentInspections(data.recentInspections || []);

        // Auto-select tab if current tab is empty but another has items
        if ((data.intakeBookings?.length || 0) === 0) {
          if ((data.preDispatchBookings?.length || 0) > 0) {
            setActiveTab('PRE_DISPATCH');
          } else if ((data.postReturnBookings?.length || 0) > 0) {
            setActiveTab('POST_RETURN');
          }
        }
      } else {
        setError(data.error || 'Failed to load bookings');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const startMobileCaptureSession = async (bookingId: string) => {
    try {
      setStartingMobileSession(true);
      const res = await fetch('/api/hub/mobile-capture/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMobileCaptureToken(data.token);
        setMobileCaptureUrl(data.captureUrl);
      } else {
        console.error('Failed to initialize mobile capture session:', data.error);
      }
    } catch (err) {
      console.error('Mobile session start error:', err);
    } finally {
      setStartingMobileSession(false);
    }
  };

  const openModal = (booking: any, type: 'LISTER_TO_HUB_INTAKE' | 'PRE_DISPATCH' | 'POST_RETURN') => {
    setActiveBooking(booking);
    setInspectionType(type);
    setGrade('A_NO_ISSUE');
    setDeductionAmount(0);
    setIsItemComplete(true);
    setMissingPartsDescription('');
    setEvidencePhotos([]);
    setGeneratedSku('');
    setSelectedRefImgIndex(0);
    startMobileCaptureSession(booking.id);
  };

  const closeModal = () => {
    setActiveBooking(null);
    setInspectionType(null);
    setMobileCaptureToken(null);
    setMobileCaptureUrl(null);
  };

  // Polling for mobile captured photos every 3 seconds
  useEffect(() => {
    if (!mobileCaptureToken || !activeBooking) return;

    let isMounted = true;
    const abortController = new AbortController();

    const intervalId = setInterval(async () => {
      if (!isMounted || !mobileCaptureToken) return;

      try {
        const res = await fetch(`/api/hub/mobile-capture/${mobileCaptureToken}/photos`, {
          signal: abortController.signal,
        });

        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            clearInterval(intervalId);
          }
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        if (data.status === 'COMPLETED' || data.status === 'EXPIRED') {
          clearInterval(intervalId);
        }

        if (data.success && Array.isArray(data.photos)) {
          setEvidencePhotos(prev => {
            const existingUrls = new Set(prev.map(p => p.url));
            const newPhotos: SyncedPhoto[] = [];

            for (const photoUrl of data.photos) {
              if (!existingUrls.has(photoUrl)) {
                newPhotos.push({
                  id: `mc-${encodeURIComponent(photoUrl).slice(-10)}-${Math.random().toString(36).substring(7)}`,
                  url: photoUrl,
                });
              }
            }

            if (newPhotos.length > 0) {
              return [...prev, ...newPhotos];
            }
            return prev;
          });
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }, 3000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(intervalId);
    };
  }, [mobileCaptureToken, activeBooking]);

  const removePhoto = (id: string) => {
    setEvidencePhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleInspectionSubmit = async () => {
    if (!activeBooking || !inspectionType) return;
    
    // Mandatory minimum 3 photos check for all Hub QC inspection stages
    if (evidencePhotos.length < 3) {
      alert(`Please capture at least 3 photos (Front, Back, Detail/Tag) before submitting the inspection. Currently only ${evidencePhotos.length}/3 photos captured.`);
      return;
    }

    const finalPhotoUrls = evidencePhotos.map(p => p.url);

    setSubmitting(true);
    try {
      const res = await fetch('/api/hub/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: activeBooking.id,
          inspectionType,
          grade: inspectionType === 'POST_RETURN' ? grade : undefined,
          deductionAmount: inspectionType === 'POST_RETURN' ? deductionAmount : 0,
          isItemComplete: inspectionType === 'POST_RETURN' ? isItemComplete : true,
          missingPartsDescription: inspectionType === 'POST_RETURN' ? missingPartsDescription : '',
          evidencePhotos: finalPhotoUrls
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.sku) {
          setGeneratedSku(data.sku);
        } else {
          const completedBooking = activeBooking;
          const completedType = inspectionType;
          closeModal();
          fetchBookings();

          if (completedType === 'POST_RETURN') {
            setNextStepModal({
              title: '✓ Return QC Complete & Deposit Settled!',
              icon: 'settle',
              badge: 'Booking Lifecycle Complete',
              garmentTitle: completedBooking?.listing?.title || 'Garment',
              bookingId: completedBooking?.id || '',
              description: 'Return inspection report has been recorded and security deposit has been auto-refunded to customer. The garment is now marked AT_HUB and is live in the catalog for the next renter.',
              actionText: '📦 View Deliveries Console',
              actionUrl: '/hub/shipments',
            });
          } else {
            alert(data.message || 'Inspection submitted successfully');
          }
        }
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error submitting inspection');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items by search query
  const filterFn = (item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const title = (item.listing?.title || item.product?.title || '').toLowerCase();
    const sku = (item.listing?.sku || '').toLowerCase();
    const renter = (item.renter?.name || '').toLowerCase();
    const lister = (item.listing?.lister?.user?.name || '').toLowerCase();
    const bookingId = (item.id || '').toLowerCase();
    return title.includes(q) || sku.includes(q) || renter.includes(q) || lister.includes(q) || bookingId.includes(q);
  };

  const filteredIntake = intake.filter(filterFn);
  const filteredPreDispatch = preDispatch.filter(filterFn);
  const filteredPostReturn = postReturn.filter(filterFn);

  // Render strictly mobile-only capture handoff panel + live synced evidence gallery
  const renderMobileHandoffSection = () => (
    <div className="hub-mobile-box">
      <div className="hub-mobile-box-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📱</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Smartphone Camera Handoff</span>
        </div>
        <span className="hub-req-badge">High-Res Camera Required</span>
      </div>

      <div className="mobile-qr-panel">
        <div className="mobile-qr-badge">
          <span className="mc-pulse-dot" />
          <span>Live Sync Active — Polling every 3s</span>
        </div>

        {startingMobileSession && !mobileCaptureUrl ? (
          <div style={{ padding: '36px 0', color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>
            Generating secure mobile pairing QR...
          </div>
        ) : mobileCaptureUrl ? (
          <>
            <div className="mobile-qr-box">
              <QRCodeSVG value={mobileCaptureUrl} size={150} level="M" />
            </div>
            <p className="mobile-qr-hint">
              Point your phone camera at this QR code to open the live capture tool. Photos will appear on this screen instantly.
            </p>
            <div className="mobile-qr-actions">
              <button
                type="button"
                className="mobile-qr-link-btn"
                onClick={() => {
                  navigator.clipboard.writeText(mobileCaptureUrl);
                  setCopiedMobileLink(true);
                  setTimeout(() => setCopiedMobileLink(false), 2000);
                }}
              >
                {copiedMobileLink ? '✓ Copied Link' : '📋 Copy Link'}
              </button>
              <a
                href={mobileCaptureUrl}
                target="_blank"
                rel="noreferrer"
                className="mobile-qr-link-btn"
              >
                ↗ Open on this PC
              </a>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>Pairing session expired or unavailable.</p>
            <button
              type="button"
              className="mobile-capture-btn-trigger"
              onClick={() => activeBooking && startMobileCaptureSession(activeBooking.id)}
            >
              Regenerate QR Code
            </button>
          </div>
        )}
      </div>

      {/* Synced Photos Live Grid */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Captured Evidence Photos ({evidencePhotos.length}/3 minimum)</span>
          {evidencePhotos.length >= 3 ? (
            <span style={{ color: '#059669', fontSize: 11, fontWeight: 700, background: '#DCFCE7', padding: '2px 8px', borderRadius: 10 }}>
              ✓ 3 Photos Minimum Met ({evidencePhotos.length})
            </span>
          ) : (
            <span style={{ color: '#B45309', fontSize: 11, fontWeight: 700, background: '#FEF3C7', padding: '2px 8px', borderRadius: 10 }}>
              ⚠️ {3 - evidencePhotos.length} more photo(s) required
            </span>
          )}
        </div>

        {evidencePhotos.length === 0 ? (
          <div className="hub-empty-photos-drop">
            <span style={{ fontSize: 26, display: 'block', marginBottom: 6 }}>📸</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>No photos received yet</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>
              Photos taken on the paired phone will stream here automatically.
            </div>
          </div>
        ) : (
          <div className="hub-photos-grid">
            {evidencePhotos.map((photo, idx) => (
              <div 
                key={photo.id} 
                className="hub-photo-thumb"
                onClick={() => {
                  setLightboxGallery(evidencePhotos.map(p => p.url));
                  setLightboxIndex(idx);
                  setLightboxImage(photo.url);
                }}
                style={{ cursor: 'zoom-in' }}
                title="Click to zoom captured photo"
              >
                <img src={photo.url} alt={`Evidence ${idx + 1}`} />
                <div className="hub-photo-check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="hub-photo-remove"
                  title="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Garment Card Component for rich warehouse visualization
  const renderGarmentCard = (b: any, stage: 'INTAKE' | 'PRE_DISPATCH' | 'POST_RETURN') => {
    const listing = b.listing || {};
    const dressImage = listing.baselineImages?.[0] || listing.images?.[0] || null;
    const listerUser = listing.lister?.user;
    const renterUser = b.renter;

    return (
      <div key={b.id} className="hub-garment-card">
        {/* Left: Garment Image Preview */}
        <div className="hub-card-media">
          {dressImage ? (
            <img
              src={dressImage}
              alt={listing.title || 'Outfit'}
              className="hub-card-img"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const placeholder = parent.querySelector('.hub-card-placeholder') as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className="hub-card-placeholder" style={{ display: dressImage ? 'none' : 'flex' }}>
            <span>👗</span>
          </div>
          {listing.size && (
            <span className="hub-card-size-tag">{listing.size}</span>
          )}
        </div>

        {/* Center: Details & Logistics Context */}
        <div className="hub-card-body">
          <div className="hub-card-top-row">
            <span className="hub-card-category">{listing.category || 'Luxury Attire'}</span>
            {listing.sku ? (
              <span className="hub-card-sku">SKU: {listing.sku}</span>
            ) : (
              <span className="hub-card-sku-pending">Tag Required</span>
            )}
          </div>

          <h3 className="hub-card-title">{listing.title || b.product?.title || 'Untitled Garment'}</h3>

          {/* Context details depending on stage */}
          <div className="hub-card-meta-list">
            {stage === 'INTAKE' && (
              <>
                <div className="hub-meta-item">
                  <span className="hub-meta-label">Lister:</span>
                  <span className="hub-meta-val">{listerUser?.name || 'Registered Lister'}</span>
                  {listerUser?.phone && <span className="hub-meta-sub">({listerUser.phone})</span>}
                </div>
                <div className="hub-meta-item">
                  <span className="hub-meta-label">Shipment:</span>
                  <span className="hub-meta-pill blue">Arriving from Lister</span>
                </div>
              </>
            )}

            {stage === 'PRE_DISPATCH' && (
              <>
                <div className="hub-meta-item">
                  <span className="hub-meta-label">Renter:</span>
                  <span className="hub-meta-val">{renterUser?.name || 'Renter'}</span>
                  {renterUser?.phone && <span className="hub-meta-sub">({renterUser.phone})</span>}
                </div>
                <div className="hub-meta-item">
                  <span className="hub-meta-label">Rental Period:</span>
                  <span className="hub-meta-val">
                    {new Date(b.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {new Date(b.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </>
            )}

            {stage === 'POST_RETURN' && (
              <>
                <div className="hub-meta-item">
                  <span className="hub-meta-label">Returned By:</span>
                  <span className="hub-meta-val">{renterUser?.name || 'Renter'}</span>
                </div>
                <div className="hub-meta-item">
                  <span className="hub-meta-label">Return Date:</span>
                  <span className="hub-meta-val">
                    {new Date(b.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="hub-meta-deposit">Deposit: ₹{Number(b.securityDeposit || 0).toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Operational Action Button */}
        <div className="hub-card-action">
          {stage === 'INTAKE' && (
            <button
              className="hub-act-btn emerald"
              onClick={() => openModal(b, 'LISTER_TO_HUB_INTAKE')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <span>Verify Intake & Tag</span>
            </button>
          )}

          {stage === 'PRE_DISPATCH' && (
            <button
              className="hub-act-btn violet"
              onClick={() => openModal(b, 'PRE_DISPATCH')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>Sanitize & Dispatch</span>
            </button>
          )}

          {stage === 'POST_RETURN' && (
            <button
              className="hub-act-btn amber"
              onClick={() => openModal(b, 'POST_RETURN')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
              <span>Receive & Grade</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="hub-loading-wrap">
        <div className="hub-spinner" />
        <p>Loading Hub Quality Control Queue...</p>
      </div>
    );
  }

  return (
    <div className="hub-page-container">
      {/* Top Header */}
      <div className="hub-header-row">
        <div>
          <div className="hub-tag">Wardrob Logistics & Quality Station</div>
          <h1 className="hub-title">Inspection & Grading Station</h1>
          <p className="hub-desc">
            Physical garment intake, pre-dispatch sanitization checks, and post-return condition grading.
          </p>
        </div>

        {/* View Layout Toggle (Focused Stage vs 3-Column Kanban) */}
        {activeTab !== 'HISTORY' && (
          <div className="hub-layout-switcher">
            <button
              className={`hub-layout-btn ${viewLayout === 'FOCUSED' ? 'active' : ''}`}
              onClick={() => setViewLayout('FOCUSED')}
              title="Spacious Workstation View"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              <span>Focused Stage</span>
            </button>
            <button
              className={`hub-layout-btn ${viewLayout === 'KANBAN' ? 'active' : ''}`}
              onClick={() => setViewLayout('KANBAN')}
              title="Overview Kanban Board"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="18" rx="1"></rect><rect x="10" y="3" width="5" height="18" rx="1"></rect><rect x="17" y="3" width="5" height="18" rx="1"></rect></svg>
              <span>3-Column Overview</span>
            </button>
          </div>
        )}
      </div>

      {/* Stage Navigation Tabs with Live Counts */}
      <div className="hub-stage-tabs">
        <button
          className={`hub-stage-tab ${activeTab === 'INTAKE' ? 'active intake' : ''}`}
          onClick={() => { setActiveTab('INTAKE'); setCurrentPage(1); }}
        >
          <div className="hub-stage-icon">📦</div>
          <div className="hub-stage-info">
            <span className="hub-stage-name">1. Lister Intake</span>
            <span className="hub-stage-sub">Verify incoming parcels</span>
          </div>
          <span className="hub-stage-badge intake">{filteredIntake.length}</span>
        </button>

        <button
          className={`hub-stage-tab ${activeTab === 'PRE_DISPATCH' ? 'active predispatch' : ''}`}
          onClick={() => { setActiveTab('PRE_DISPATCH'); setCurrentPage(1); }}
        >
          <div className="hub-stage-icon">✨</div>
          <div className="hub-stage-info">
            <span className="hub-stage-name">2. Pre-Dispatch</span>
            <span className="hub-stage-sub">Sanitize & ship to renter</span>
          </div>
          <span className="hub-stage-badge predispatch">{filteredPreDispatch.length}</span>
        </button>

        <button
          className={`hub-stage-tab ${activeTab === 'POST_RETURN' ? 'active return' : ''}`}
          onClick={() => { setActiveTab('POST_RETURN'); setCurrentPage(1); }}
        >
          <div className="hub-stage-icon">🔄</div>
          <div className="hub-stage-info">
            <span className="hub-stage-name">3. Post-Return</span>
            <span className="hub-stage-sub">Assess damage & refund</span>
          </div>
          <span className="hub-stage-badge return">{filteredPostReturn.length}</span>
        </button>

        <button
          className={`hub-stage-tab ${activeTab === 'HISTORY' ? 'active history' : ''}`}
          onClick={() => { setActiveTab('HISTORY'); setCurrentPage(1); }}
        >
          <div className="hub-stage-icon">📋</div>
          <div className="hub-stage-info">
            <span className="hub-stage-name">Completed Audit</span>
            <span className="hub-stage-sub">Inspection records</span>
          </div>
          <span className="hub-stage-badge history">{recentInspections.length}</span>
        </button>
      </div>

      {/* Real-time Search & Filter Bar */}
      <div className="hub-toolbar">
        <div className="hub-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="hub-search-input"
            placeholder="Search by Dress title, SKU barcode, Renter or Lister name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="hub-clear-search"
            >
              ✕ Clear
            </button>
          )}
        </div>

        <button className="hub-refresh-btn" onClick={fetchBookings} title="Refresh Live Queue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="hub-error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'HISTORY' ? (
        /* Completed Inspections Audit Table */
        <div className="hub-history-card">
          <div className="hub-history-header">
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Recent Inspection Records</h3>
              <p style={{ fontSize: 13, color: '#64748B' }}>Audit trail of all intake, pre-dispatch sanitizations, and return quality reports.</p>
            </div>
          </div>

          {recentInspections.length === 0 ? (
            <div className="hub-empty-state">
              <span style={{ fontSize: 36, marginBottom: 8, display: 'block' }}>📋</span>
              <p>No completed inspection logs found yet.</p>
            </div>
          ) : (
            <>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Garment</th>
                    <th>Inspection Type</th>
                    <th>Quality Grade</th>
                    <th>Lister</th>
                    <th>Renter</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInspections
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((insp: any) => (
                      <tr key={insp.id}>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748B', fontSize: 13 }}>
                          {new Date(insp.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {insp.booking?.listing?.baselineImages?.[0] ? (
                              <img
                                src={insp.booking.listing.baselineImages[0]}
                                alt=""
                                style={{ width: 36, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #E2E8F0' }}
                              />
                            ) : (
                              <div style={{ width: 36, height: 44, background: '#F1F5F9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👗</div>
                            )}
                            <div>
                              <strong style={{ display: 'block', color: '#0F172A', fontSize: 14 }}>{insp.booking?.listing?.title || 'Garment'}</strong>
                              {insp.booking?.listing?.sku && (
                                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B' }}>SKU: {insp.booking.listing.sku}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${insp.inspectionType}`}>{insp.inspectionType?.replace(/_/g, ' ')}</span>
                        </td>
                        <td>
                          <span className={`hub-grade-pill ${insp.grade}`}>
                            {insp.grade === 'A_NO_ISSUE' ? '✓ Grade A (Flawless)' : insp.grade === 'B_MINOR' ? '⚠ Grade B (Minor)' : '✕ Grade C (Damaged)'}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: '#334155' }}>
                          {insp.booking?.listing?.lister?.user?.name || 'Lister'}
                        </td>
                        <td style={{ fontSize: 13, color: '#334155' }}>
                          {insp.booking?.renter?.name || 'Renter'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={recentInspections.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      ) : viewLayout === 'FOCUSED' ? (
        /* Focused Workstation Grid */
        <div className="hub-stage-container">
          <div className="hub-stage-header-bar">
            <div>
              <h2 className="hub-stage-main-title">
                {activeTab === 'INTAKE' && 'Stage 1: Lister Intake & Barcode Tagging'}
                {activeTab === 'PRE_DISPATCH' && 'Stage 2: Pre-Dispatch Inspection & Sanitization'}
                {activeTab === 'POST_RETURN' && 'Stage 3: Post-Return Condition Assessment'}
              </h2>
              <p className="hub-stage-main-desc">
                {activeTab === 'INTAKE' && 'Arriving parcels from Listers. Match garment against original listing photos, verify condition, and assign unique Wardrob barcode SKU.'}
                {activeTab === 'PRE_DISPATCH' && 'Confirmed bookings ready for Renter delivery. Check stitching, perform ozone sanitization, seal in dust cover, and hand over to courier.'}
                {activeTab === 'POST_RETURN' && 'Garments returned by Renters. Inspect for stains, tears, missing accessories, and determine security deposit refund or deductions.'}
              </p>
            </div>
            <span className="hub-stage-counter-pill">
              {activeTab === 'INTAKE' && `${filteredIntake.length} Items Queued`}
              {activeTab === 'PRE_DISPATCH' && `${filteredPreDispatch.length} Items Queued`}
              {activeTab === 'POST_RETURN' && `${filteredPostReturn.length} Items Queued`}
            </span>
          </div>

          <div className="hub-garments-list">
            {activeTab === 'INTAKE' && (
              filteredIntake.length === 0 ? (
                <div className="hub-empty-stage">
                  <span style={{ fontSize: 40, marginBottom: 8, display: 'block' }}>📦</span>
                  <h3>No Arriving Parcels in Intake Queue</h3>
                  <p>All items have been verified and processed.</p>
                </div>
              ) : (
                filteredIntake
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map(b => renderGarmentCard(b, 'INTAKE'))
              )
            )}

            {activeTab === 'PRE_DISPATCH' && (
              filteredPreDispatch.length === 0 ? (
                <div className="hub-empty-stage">
                  <span style={{ fontSize: 40, marginBottom: 8, display: 'block' }}>✨</span>
                  <h3>No Outfits Awaiting Pre-Dispatch Sanitization</h3>
                  <p>All upcoming rentals are sanitized and ready for shipping.</p>
                </div>
              ) : (
                filteredPreDispatch
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map(b => renderGarmentCard(b, 'PRE_DISPATCH'))
              )
            )}

            {activeTab === 'POST_RETURN' && (
              filteredPostReturn.length === 0 ? (
                <div className="hub-empty-stage">
                  <span style={{ fontSize: 40, marginBottom: 8, display: 'block' }}>🔄</span>
                  <h3>No Outfits Awaiting Return Quality Assessment</h3>
                  <p>All renter return packages have been graded.</p>
                </div>
              ) : (
                filteredPostReturn
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map(b => renderGarmentCard(b, 'POST_RETURN'))
              )
            )}
          </div>

          {/* Pagination Controls for Focused Stages */}
          {activeTab === 'INTAKE' && filteredIntake.length > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredIntake.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}

          {activeTab === 'PRE_DISPATCH' && filteredPreDispatch.length > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPreDispatch.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}

          {activeTab === 'POST_RETURN' && filteredPostReturn.length > ITEMS_PER_PAGE && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredPostReturn.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      ) : (
        /* 3-Column Kanban Board Layout */
        <div className="insp-grid">
          {/* INTAKE COLUMN */}
          <div className="insp-col">
            <div className="insp-col-head">
              <span className="insp-col-title">1. Lister Intake</span>
              <span className="insp-col-count">{filteredIntake.length}</span>
            </div>
            <div className="insp-list">
              {filteredIntake.length === 0 ? (
                <div className="insp-empty-msg">No pending intake</div>
              ) : (
                filteredIntake.map(b => renderGarmentCard(b, 'INTAKE'))
              )}
            </div>
          </div>

          {/* PRE-DISPATCH COLUMN */}
          <div className="insp-col">
            <div className="insp-col-head">
              <span className="insp-col-title">2. Pre-Dispatch</span>
              <span className="insp-col-count">{filteredPreDispatch.length}</span>
            </div>
            <div className="insp-list">
              {filteredPreDispatch.length === 0 ? (
                <div className="insp-empty-msg">No pending dispatch</div>
              ) : (
                filteredPreDispatch.map(b => renderGarmentCard(b, 'PRE_DISPATCH'))
              )}
            </div>
          </div>

          {/* POST-RETURN COLUMN */}
          <div className="insp-col">
            <div className="insp-col-head">
              <span className="insp-col-title">3. Post-Return</span>
              <span className="insp-col-count">{filteredPostReturn.length}</span>
            </div>
            <div className="insp-list">
              {filteredPostReturn.length === 0 ? (
                <div className="insp-empty-msg">No pending returns</div>
              ) : (
                filteredPostReturn.map(b => renderGarmentCard(b, 'POST_RETURN'))
              )}
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {activeBooking && (
        <div className="modal-overlay">
          <div className={`modal-content hub-modal-large ${generatedSku ? 'sku-modal-compact' : ''}`}>
            {/* Modal Header */}
            <div className="hub-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`hub-modal-icon-badge ${inspectionType}`}>
                  {inspectionType === 'LISTER_TO_HUB_INTAKE' ? '📦' : inspectionType === 'PRE_DISPATCH' ? '✨' : '🔄'}
                </span>
                <div>
                  <h3 className="hub-modal-title">
                    {inspectionType === 'LISTER_TO_HUB_INTAKE' && 'Lister Intake & Barcode Verification'}
                    {inspectionType === 'PRE_DISPATCH' && 'Pre-Dispatch Sanitization & Quality Certification'}
                    {inspectionType === 'POST_RETURN' && 'Post-Return Quality Assessment & Deposit Processing'}
                  </h3>
                  <div className="hub-modal-subtitle">
                    Booking ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{activeBooking.id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <button className="modal-close" onClick={closeModal} title="Close">✕</button>
            </div>

            {/* Generated SKU Success Screen */}
            {generatedSku ? (
              <div className="hub-sku-success-box">
                <div className="hub-sku-icon-circle">✓</div>
                <h3 className="hub-sku-heading">Intake Verified & Registered!</h3>
                <p className="hub-sku-subtext">
                  A unique garment barcode has been allocated. Print this label and securely tag the garment shelf hanger.
                </p>

                <div className="hub-sku-card">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(generatedSku)}`}
                    alt="Garment SKU QR Code"
                    className="hub-sku-qr-img"
                  />
                  <div className="hub-sku-code-text">{generatedSku}</div>
                  <div className="hub-sku-dress-title">{activeBooking.listing?.title || 'Garment'}</div>
                </div>

                <div className="hub-sku-actions">
                  <button
                    onClick={() => window.print()}
                    className="hub-print-btn"
                  >
                    🖨️ Print Barcode Label
                  </button>
                  <button
                    onClick={() => { closeModal(); fetchBookings(); }}
                    className="hub-done-btn"
                  >
                    Done & Return to Queue
                  </button>
                </div>

                {/* ──── NEXT STEP GUIDANCE CARD INSIDE SKU SUCCESS ──── */}
                <div className="hub-sku-next-step">
                  <div className="hub-sku-next-label">
                    Agla Step: Ready for Renter
                  </div>
                  <div className="hub-sku-next-desc">
                    Garment barcode tag lag chuka hai. Ab is garment ko Renter ke liye Porter courier par dispatch karna hai.
                  </div>
                  <a
                    href={`/hub/shipments?leg=HUB_TO_RENTER&bookingId=${activeBooking.id}`}
                    className="hub-sku-next-btn"
                  >
                    🚚 Book Porter / Dispatch to Renter ➔
                  </a>
                </div>
              </div>
            ) : (
              <div className="hub-modal-split-body">
                {/* LEFT COLUMN: Baseline Outfit Reference & Checklist */}
                <div className="hub-modal-left-col">
                  {/* Outfit Reference Card with Multi-Photo Gallery & Lightbox Zoom */}
                  {(() => {
                    const catalogImages: string[] = Array.from(new Set([
                      ...(Array.isArray(activeBooking.listing?.baselineImages) ? activeBooking.listing.baselineImages : activeBooking.listing?.baselineImages ? [activeBooking.listing.baselineImages] : []),
                      ...(Array.isArray(activeBooking.listing?.images) ? activeBooking.listing.images : activeBooking.listing?.images ? [activeBooking.listing.images] : []),
                    ])).filter(Boolean);

                    const intakeDamageReport = activeBooking.damageReports?.find((d: any) => d.inspectionType === 'LISTER_TO_HUB_INTAKE');
                    const intakePhotos: string[] = intakeDamageReport?.evidencePhotos || [];

                    const activeRefImg = catalogImages[selectedRefImgIndex] || catalogImages[0] || null;

                    return (
                      <div className="hub-reference-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span className="hub-reference-badge">Catalog Reference</span>
                          {catalogImages.length > 0 && (
                            <span 
                              style={{ fontSize: 11, color: '#2563EB', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={() => {
                                setLightboxGallery(catalogImages);
                                setLightboxIndex(selectedRefImgIndex < catalogImages.length ? selectedRefImgIndex : 0);
                                setLightboxImage(activeRefImg);
                              }}
                            >
                              🔍 Click to Enlarge ({catalogImages.length} {catalogImages.length === 1 ? 'photo' : 'photos'})
                            </span>
                          )}
                        </div>

                        <div className="hub-ref-gallery-wrap">
                          <div className="hub-ref-img-column">
                            {activeRefImg ? (
                              <div
                                className="hub-ref-img-container"
                                onClick={() => {
                                  setLightboxGallery(catalogImages);
                                  setLightboxIndex(selectedRefImgIndex < catalogImages.length ? selectedRefImgIndex : 0);
                                  setLightboxImage(activeRefImg);
                                }}
                                title="Click to Expand / Zoom Full Screen"
                              >
                                <img src={activeRefImg} alt="Listing Reference" className="hub-ref-img" />
                                <div className="hub-ref-zoom-hint">
                                  <span>🔍 Tap to Zoom</span>
                                </div>
                              </div>
                            ) : (
                              <div className="hub-ref-placeholder">👗</div>
                            )}

                            {/* Filmstrip thumbnails if multiple catalog images */}
                            {catalogImages.length > 1 && (
                              <div className="hub-ref-thumbnails">
                                {catalogImages.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Ref ${idx + 1}`}
                                    className={`hub-ref-thumb-mini ${selectedRefImgIndex === idx ? 'active' : ''}`}
                                    onClick={() => setSelectedRefImgIndex(idx)}
                                    title={`View angle ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1 }}>
                            <h4 className="hub-ref-title">{activeBooking.listing?.title || 'Garment Title'}</h4>
                            <div className="hub-ref-details">
                              <span>Size: <strong>{activeBooking.listing?.size || 'Free Size'}</strong></span>
                              <span>Category: <strong>{activeBooking.listing?.category || 'Couture'}</strong></span>
                              {activeBooking.listing?.sku && (
                                <span>SKU: <strong>{activeBooking.listing.sku}</strong></span>
                              )}
                            </div>
                            {activeBooking.listing?.lister?.user?.name && (
                              <div className="hub-ref-contact">
                                Lister: {activeBooking.listing.lister.user.name} ({activeBooking.listing.lister.user.phone || 'No phone'})
                              </div>
                            )}
                          </div>
                        </div>

                        {/* If Post-Return stage and Intake photos exist, show Verified Intake Photos as baseline comparison */}
                        {inspectionType === 'POST_RETURN' && intakePhotos.length > 0 && (
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #CBD5E1' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span>✓ Original Intake Photos at Hub ({intakePhotos.length})</span>
                              <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>(Compare with return)</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                              {intakePhotos.map((img, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    setLightboxGallery(intakePhotos);
                                    setLightboxIndex(idx);
                                    setLightboxImage(img);
                                  }}
                                  style={{ position: 'relative', width: 64, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #059669', flexShrink: 0, cursor: 'zoom-in' }}
                                  title="Click to zoom original intake photo"
                                >
                                  <img src={img} alt={`Intake ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(5, 150, 105, 0.85)', color: '#fff', fontSize: 9, textAlign: 'center', fontWeight: 700, padding: '1px 0' }}>
                                    INTAKE #{idx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Stage-Specific Forms */}
                  {inspectionType === 'LISTER_TO_HUB_INTAKE' && (
                    <div className="hub-check-section">
                      <h4 className="m-section-title">Physical Intake Checks</h4>
                      <div className="hub-check-card">
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>Parcel seal intact upon courier handover</span>
                        </label>
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>Garment matches the lister's catalog photos</span>
                        </label>
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>No major unlisted tears, burns, or heavy stains</span>
                        </label>
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>All embellishments, belts & dupattas present</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {inspectionType === 'PRE_DISPATCH' && (
                    <div className="hub-check-section">
                      <h4 className="m-section-title">Sanitization & Dispatch Checklist</h4>
                      <div className="hub-check-card">
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>Dry-cleaning & ozone chamber sanitization complete</span>
                        </label>
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>Zippers, hooks & hem stitching verified secure</span>
                        </label>
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>Wardrob luxury authenticity & security tag attached</span>
                        </label>
                        <label className="chk-label">
                          <input type="checkbox" defaultChecked />
                          <span>Sealed inside breathable garment dust cover bag</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {inspectionType === 'POST_RETURN' && (
                    <div className="hub-check-section">
                      <h4 className="m-section-title">Condition Grading (Post-Rental)</h4>
                      <div className="hub-grade-selector">
                        <button
                          type="button"
                          onClick={() => setGrade('A_NO_ISSUE')}
                          className={`hub-grade-choice grade-a ${grade === 'A_NO_ISSUE' ? 'selected' : ''}`}
                        >
                          <div className="hub-gc-header">
                            <span className="hub-gc-badge a">Grade A</span>
                            <span className="hub-gc-status">Flawless</span>
                          </div>
                          <p className="hub-gc-desc">No tears, stains, or missing parts. 100% security deposit will be refunded to renter.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGrade('B_MINOR')}
                          className={`hub-grade-choice grade-b ${grade === 'B_MINOR' ? 'selected' : ''}`}
                        >
                          <div className="hub-gc-header">
                            <span className="hub-gc-badge b">Grade B</span>
                            <span className="hub-gc-status">Minor Damage</span>
                          </div>
                          <p className="hub-gc-desc">Light stains or minor loose beads requiring dry-clean or minor tailor touch-up.</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGrade('C_MAJOR')}
                          className={`hub-grade-choice grade-c ${grade === 'C_MAJOR' ? 'selected' : ''}`}
                        >
                          <div className="hub-gc-header">
                            <span className="hub-gc-badge c">Grade C</span>
                            <span className="hub-gc-status">Severe / Ruined</span>
                          </div>
                          <p className="hub-gc-desc">Fabric torn, burnt, or unrepairable stain. Triggers dispute & claim against deposit.</p>
                        </button>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 8 }}>
                          Accessories & Packaging Kit Complete?
                        </label>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setIsItemComplete(true)}
                            className={`hub-kit-btn ${isItemComplete ? 'active' : ''}`}
                          >
                            ✓ Yes, Everything Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsItemComplete(false)}
                            className={`hub-kit-btn ${!isItemComplete ? 'active warn' : ''}`}
                          >
                            ⚠ Parts Missing
                          </button>
                        </div>
                      </div>

                      {!isItemComplete && (
                        <div style={{ marginTop: 12 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            MISSING COMPONENTS DETAIL
                          </label>
                          <input
                            type="text"
                            className="input-text"
                            placeholder="e.g. Belt / Brooch / Hanger bag missing"
                            value={missingPartsDescription}
                            onChange={e => setMissingPartsDescription(e.target.value)}
                          />
                        </div>
                      )}

                      {grade !== 'A_NO_ISSUE' && (
                        <div style={{ marginTop: 16, background: '#FFFBEB', border: '1px solid #FDE68A', padding: 14, borderRadius: 10 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#92400E', display: 'block', marginBottom: 6 }}>
                            SECURITY DEPOSIT DEDUCTION (INR)
                          </label>
                          <input
                            type="number"
                            className="input-text"
                            min="0"
                            value={deductionAmount}
                            onChange={e => {
                              let val = Number(e.target.value);
                              if (val < 0) val = 0;
                              setDeductionAmount(val);
                            }}
                          />
                          <div style={{ fontSize: 11, color: '#B45309', marginTop: 4 }}>
                            Maximum deposit cap: ₹{Number(activeBooking.securityDeposit || 0).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Mobile Camera Handoff */}
                <div className="hub-modal-right-col">
                  {renderMobileHandoffSection()}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            {!generatedSku && (
              <div className="hub-modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="hub-footer-cancel"
                >
                  Cancel & Close
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {evidencePhotos.length < 3 ? (
                    <span style={{ fontSize: 12, color: '#E11D48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>📸</span>
                      <span>
                        At least 3 photos required ({evidencePhotos.length}/3 captured)
                      </span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>✓</span>
                      <span>3+ Photos verified ({evidencePhotos.length} synced)</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleInspectionSubmit}
                    disabled={submitting || evidencePhotos.length < 3}
                    className="hub-footer-submit"
                    style={{
                      opacity: evidencePhotos.length < 3 ? 0.6 : 1,
                      cursor: evidencePhotos.length < 3 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Registering Quality Audit...' : 'Register Inspection & Update Status'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ──── NEXT STEP GUIDANCE MODAL ──── */}
      {nextStepModal && (
        <div className="guidance-overlay" onClick={() => setNextStepModal(null)}>
          <div className="guidance-box" onClick={e => e.stopPropagation()}>
            <div className={`guidance-icon-circle guidance-icon-${nextStepModal.icon}`}>
              {nextStepModal.icon === 'inbound' && '📦'}
              {nextStepModal.icon === 'return' && '🔄'}
              {nextStepModal.icon === 'dispatch' && '🚚'}
              {nextStepModal.icon === 'settle' && '✓'}
            </div>
            <h3 className="guidance-title">{nextStepModal.title}</h3>
            <span className="guidance-badge">{nextStepModal.badge}</span>

            <div className="guidance-item-card">
              <div className="guidance-item-title">{nextStepModal.garmentTitle}</div>
              <div className="guidance-item-meta">Booking ID: #BKG-{nextStepModal.bookingId.slice(0, 8)}</div>
            </div>

            <p className="guidance-instruction">{nextStepModal.description}</p>

            <div className="guidance-actions">
              <a href={nextStepModal.actionUrl} className="guidance-primary-btn">
                {nextStepModal.actionText} ➔
              </a>
              <button className="guidance-secondary-btn" onClick={() => setNextStepModal(null)}>
                Stay on Inspections / Do Later
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ──── LIGHTBOX FULLSCREEN ZOOM MODAL ──── */}
      {lightboxImage && (
        <div 
          className="hub-lightbox-overlay" 
          onClick={() => setLightboxImage(null)}
        >
          {lightboxGallery.length > 1 && (
            <>
              <button
                type="button"
                className="hub-lightbox-nav-btn hub-lightbox-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  const prevIdx = (lightboxIndex - 1 + lightboxGallery.length) % lightboxGallery.length;
                  setLightboxIndex(prevIdx);
                  setLightboxImage(lightboxGallery[prevIdx]);
                }}
                title="Previous Image (←)"
              >
                ‹
              </button>
              <button
                type="button"
                className="hub-lightbox-nav-btn hub-lightbox-next"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIdx = (lightboxIndex + 1) % lightboxGallery.length;
                  setLightboxIndex(nextIdx);
                  setLightboxImage(lightboxGallery[nextIdx]);
                }}
                title="Next Image (→)"
              >
                ›
              </button>
            </>
          )}

          <div className="hub-lightbox-content" onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              className="hub-lightbox-close" 
              onClick={() => setLightboxImage(null)} 
              title="Close (Esc)"
            >
              ✕
            </button>
            <img src={lightboxImage} alt="Expanded Inspection Reference" className="hub-lightbox-img" />
            <div className="hub-lightbox-caption">
              <span>🔍 Full Resolution Inspection Zoom {lightboxGallery.length > 1 ? `(${lightboxIndex + 1} of ${lightboxGallery.length})` : ''}</span>
              <span style={{ opacity: 0.6, fontSize: '11px' }}>Click anywhere or press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
