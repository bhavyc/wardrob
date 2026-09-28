'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LiveCameraCapture from '@/components/LiveCameraCapture';
import { QRCodeSVG } from 'qrcode.react';
import './lister-add-listing.css';

export default function AddListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states for P2P Rental
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Lehenga');
  const [customCategory, setCustomCategory] = useState('');
  const [size, setSize] = useState('M');
  const [condition, setCondition] = useState('Like New');
  const [rentalPrice, setRentalPrice] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [showPriceErrorModal, setShowPriceErrorModal] = useState(false);

  // Media (Cloudinary Uploads) - Up to 4 images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const categories = ['Saree', 'Kurti', 'Sharara Set', 'Lehenga', 'Anarkali Suit', 'Dress', 'Kurta', 'Sherwani', 'Others'];
  const conditions = ['New with tags', 'Like New', 'Excellent', 'Good (Lightly Used)'];
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
  const [isMobile, setIsMobile] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [registrationFeePaid, setRegistrationFeePaid] = useState(false);
  const [listerStatus, setListerStatus] = useState('PENDING');

  const [mobileSessionToken, setMobileSessionToken] = useState<string | null>(null);
  const [qrCaptureUrl, setQrCaptureUrl] = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    async function verifyEligibility() {
      try {
        const res = await fetch('/api/lister/listings');
        const data = await res.json();
        if (res.ok && data.success) {
          setRegistrationFeePaid(Boolean(data.registrationFeePaid));
          if (data.listerStatus) setListerStatus(data.listerStatus);
        }
      } catch {
      } finally {
        setCheckingStatus(false);
      }
    }
    verifyEligibility();
  }, []);

  const generateMobileSession = async () => {
    try {
      const res = await fetch('/api/lister/mobile-capture/session', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMobileSessionToken(data.token);
        setQrCaptureUrl(data.captureUrl);
        setPollingActive(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollingActive && mobileSessionToken) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/lister/mobile-capture/${mobileSessionToken}/photos`);
          const data = await res.json();
          if (res.ok && data.success) {
            if (data.photos && data.photos.length > imageUrls.length) {
              setImageUrls(data.photos);
            }
            if (data.status === 'COMPLETED' || data.status === 'EXPIRED') {
              setPollingActive(false);
            }
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingActive, mobileSessionToken, imageUrls.length]);

  const handleCapture = async (blob: Blob, base64: string) => {
    if (imageUrls.length >= 4) {
      setError('You can only upload a maximum of 4 images.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // In dev/simulation mode, base64 is actually an Unsplash URL — use it directly
      if (base64.startsWith('http')) {
        setImageUrls(prev => [...prev, base64]);
        setUploading(false);
        return;
      }

      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      // Pass a temporary context ID until listing is saved
      formData.append('listingId', `lister-draft-${Date.now()}`);
      
      const localRes = await fetch('/api/uploads/listing-photo', {
        method: 'POST',
        body: formData
      });

      const localData = await localRes.json();
      if (localRes.ok && localData.success) {
        setImageUrls(prev => [...prev, localData.url]);
      } else {
        setError(localData.error || 'Failed to upload image.');
      }
    } catch (err) {
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrls.length === 0) {
      setError('Please capture at least 1 photo using the live camera.');
      return;
    }
    if (category === 'Others' && !customCategory.trim()) {
      setError('Please specify the custom category.');
      return;
    }
    if (!title.trim() || !description.trim() || !rentalPrice || !securityDeposit) {
      setError('Please fill in all required fields.');
      return;
    }
    if (Number(rentalPrice) < 5000) {
      setShowPriceErrorModal(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalCategory = category === 'Others' ? customCategory.trim() : category;

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category: finalCategory,
          size,
          condition,
          rentalPrice: Number(rentalPrice),
          securityDeposit: Number(securityDeposit),
          baselineImages: imageUrls,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/lister/listings');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create rental listing.');
      }
    } catch {
      setError('Error submitting listing details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="add-page-wrap">
        <div className="add-page-header">
          <Link href="/lister/listings" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </Link>
          <h1 className="add-title">Add Rental Listing</h1>
        </div>

        {checkingStatus ? (
          <div className="form-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #DDE4DF', borderTopColor: '#2C5E43', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '13px', color: '#74897C' }}>Checking boutique status...</p>
          </div>
        ) : !registrationFeePaid ? (
          <div className="form-card" style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: '28px', color: '#92400E', marginBottom: '12px' }}>
              Registration Fee Required
            </h2>
            <p style={{ fontSize: '14px', color: '#74897C', maxWidth: '440px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              A mandatory one-time registration fee of <strong>₹500</strong> is required before you can list wardrobe items. Complete payment and verify your identity in KYC settings.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/lister/kyc" style={{
                background: '#D97706', color: '#FFFFFF', padding: '12px 28px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(217,119,6,0.25)',
              }}>
                Pay ₹500 & Complete KYC →
              </Link>
              <Link href="/lister/listings" style={{
                background: '#F0F4F1', color: '#3D5347', padding: '12px 20px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 600, textDecoration: 'none',
              }}>
                Back to listings
              </Link>
            </div>
          </div>
        ) : listerStatus !== 'APPROVED' ? (
          <div className="form-card" style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: '28px', color: '#1E40AF', marginBottom: '12px' }}>
              {listerStatus === 'REJECTED' ? 'KYC Verification Rejected' : 'KYC Verification Pending'}
            </h2>
            <p style={{ fontSize: '14px', color: '#74897C', maxWidth: '440px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              {listerStatus === 'REJECTED'
                ? 'Your verification documents were rejected. Please re-submit valid government ID in KYC settings.'
                : 'Your ₹500 registration fee is received. Once our compliance team approves your identity documents, item listing will be activated.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/lister/kyc" style={{
                background: '#2563EB', color: '#FFFFFF', padding: '12px 28px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
              }}>
                Check KYC Status →
              </Link>
              <Link href="/lister/listings" style={{
                background: '#F0F4F1', color: '#3D5347', padding: '12px 20px', borderRadius: '12px',
                fontSize: '13px', fontWeight: 600, textDecoration: 'none',
              }}>
                Back to listings
              </Link>
            </div>
          </div>
        ) : (
          <div className="form-card">
            {success ? (
            <div className="success-overlay">
              <div className="success-icon">✓</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: '26px', color: '#163625', marginBottom: '8px' }}>Listing Created!</h2>
              <p style={{ fontSize: '13.5px', color: '#74897C' }}>Your rental listing has been created. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleAddListing}>
              {error && <div className="alert-banner alert-error" style={{ marginBottom: 20, padding: 12, background: '#FFF5F5', color: '#C53030', borderRadius: 8 }}><span>⚠</span> {error}</div>}

              <div className="trust-badge">
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <span>
                  <strong>P2P Trust Guarantee:</strong> Listings require live camera capture to prevent fraud. Every item is verified and cleaned at our Hub before it reaches the renter.
                </span>
              </div>

              {/* 1. Basic Info */}
              <div className="form-section-title">Item Information</div>
              <div className="field-grid-1">
                <div>
                  <label className="field-lbl">Listing Title *</label>
                  <input className="field-inp" type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Heritage Embroidered Floral Velvet Lehenga" />
                </div>
                <div>
                  <label className="field-lbl">Description & History *</label>
                  <textarea className="field-ta" rows={3} required value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the item, when it was bought, how many times worn..." />
                </div>
              </div>

              <div className="field-grid-2">
                <div>
                  <label className="field-lbl">Category *</label>
                  <select className="field-inp" style={{ height: 46, cursor: 'pointer' }} value={category} onChange={e => setCategory(e.target.value)}>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {category === 'Others' && (
                    <div style={{ marginTop: 14 }}>
                      <input 
                        className="field-inp" 
                        type="text" 
                        required 
                        value={customCategory} 
                        onChange={e => setCustomCategory(e.target.value)} 
                        placeholder="Specify Category" 
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="field-lbl">Size *</label>
                  <select className="field-inp" style={{ height: 46, cursor: 'pointer' }} value={size} onChange={e => setSize(e.target.value)}>
                    {sizeOptions.map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-grid-2">
                <div>
                  <label className="field-lbl">Condition *</label>
                  <select className="field-inp" style={{ height: 46, cursor: 'pointer' }} value={condition} onChange={e => setCondition(e.target.value)}>
                    {conditions.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Pricing & Deposit */}
              <div className="form-section-title">Pricing & Deposit</div>
              <div className="field-grid-2">
                <div>
                  <label className="field-lbl">Event Package Rent (₹) *</label>
                  <input className="field-inp" type="number" required min="5000" value={rentalPrice} onChange={e => setRentalPrice(e.target.value)} placeholder="e.g. 5000" />
                  <p style={{ fontSize: '11px', color: '#74897C', marginTop: '6px' }}>Flat 4-day event price (Minimum ₹5,000). Platform commission is 35% (or min ₹2,000 floor).</p>
                </div>
                <div>
                  <label className="field-lbl">Security Deposit (₹) *</label>
                  <input className="field-inp" type="number" required min="500" value={securityDeposit} onChange={e => setSecurityDeposit(e.target.value)} placeholder="e.g. 3000" />
                </div>
              </div>



              {/* 3. Live Camera Upload */}
              <div className="form-section-title">Live Verification Photos</div>
              <div className="field-grid-1" style={{ background: '#F8FAF8', padding: '24px', borderRadius: '14px', border: '1px dashed #AEC0B4' }}>
                <p style={{ fontSize: '13px', color: '#3D5347', marginBottom: '16px' }}>
                  Please use your device's camera to capture photos of the item. Gallery uploads are disabled to prevent stock photo fraud.
                </p>
                
                {!isMobile ? (
                  qrCaptureUrl ? (
                    <div style={{ textAlign: 'center', padding: '20px', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#163625', marginBottom: '16px' }}>
                        Scan QR with your phone to upload photos
                      </p>
                      <QRCodeSVG value={qrCaptureUrl} size={180} />
                      <p style={{ fontSize: '12px', color: '#74897C', marginTop: '16px' }}>
                        Photos captured on your phone will appear here live.
                      </p>
                      {pollingActive && (
                        <p style={{ fontSize: '12px', color: '#2C5E43', marginTop: '8px', fontWeight: 'bold' }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, background: '#10B981', borderRadius: '50%', marginRight: 6, animation: 'pulse 2s infinite' }} />
                          Waiting for photos...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', background: '#FFF', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📱</div>
                      <p style={{ fontSize: '14px', color: '#3D5347', marginBottom: '16px' }}>
                        You are on a desktop. Live capture requires a mobile camera.
                      </p>
                      <button type="button" onClick={generateMobileSession} style={{ padding: '12px 24px', background: '#2C5E43', color: '#FFF', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        Generate Mobile QR Code
                      </button>
                    </div>
                  )
                ) : (
                  imageUrls.length < 4 ? (
                    <LiveCameraCapture 
                      onCapture={handleCapture}
                      buttonText="Open Camera & Capture"
                    />
                  ) : (
                    <p style={{ color: '#2C5E43', fontWeight: 'bold' }}>✓ Maximum 4 photos uploaded.</p>
                  )
                )}
                
                {uploading && <p style={{ fontSize: '13px', color: '#2C5E43', marginTop: '12px' }}>Uploading photo...</p>}

                {imageUrls.length > 0 && (
                  <div className="images-grid">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="image-preview-card">
                        <img src={url} alt="" className="image-preview-img" />
                        <button 
                          type="button" 
                          className="image-preview-delete-btn" 
                          onClick={() => handleDeleteImage(idx)}
                          title="Delete Image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="submit-section">
                <button type="button" className="cancel-btn" onClick={() => router.push('/lister/listings')} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading || uploading}>
                  {loading ? 'Submitting...' : 'Submit Listing'}
                </button>
              </div>
            </form>
          )}
          </div>
        )}
      </div>

      {/* Minimum Price Error Modal */}
      {showPriceErrorModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={() => setShowPriceErrorModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '32px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              textAlign: 'center',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FCA5A5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '30px',
              margin: '0 auto 18px',
            }}>
              ⚠️
            </div>

            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.2px',
              color: '#DC2626',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              Minimum Price Policy
            </div>

            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: '12px',
              fontFamily: 'var(--font-cormorant), serif',
            }}>
              Rental Price Below ₹5,000 Threshold
            </h3>

            <p style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: 1.6,
              marginBottom: '22px',
            }}>
              Wardrob is an exclusive luxury couture collective. To uphold platform standards, ensure authentic couture care, and protect outfit valuation, <strong>every garment must have a minimum rental price of ₹5,000</strong>.
            </p>

            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px 20px',
              marginBottom: '26px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                <span style={{ color: '#64748B' }}>Your Entered Rent:</span>
                <span style={{ fontWeight: 700, color: '#DC2626' }}>
                  ₹{Number(rentalPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', borderTop: '1px dashed #CBD5E1', paddingTop: '8px' }}>
                <span style={{ color: '#64748B' }}>Required Minimum:</span>
                <span style={{ fontWeight: 700, color: '#16A34A' }}>₹5,000</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPriceErrorModal(false);
                const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                if (input) input.focus();
              }}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#1E1E2D',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Update Rental Price to ₹5,000+
            </button>
          </div>
        </div>
      )}
    </>
  );
}
