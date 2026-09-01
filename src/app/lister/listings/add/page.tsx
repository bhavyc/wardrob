'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LiveCameraCapture from '@/components/LiveCameraCapture';

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

  // Media (Cloudinary Uploads) - Up to 4 images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const categories = ['Saree', 'Kurti', 'Sharara Set', 'Lehenga', 'Anarkali Suit', 'Dress', 'Kurta', 'Sherwani', 'Others'];
  const conditions = ['New with tags', 'Like New', 'Excellent', 'Good (Lightly Used)'];
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
  const [isMobile, setIsMobile] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [registrationFeePaid, setRegistrationFeePaid] = useState(true);
  const [listerStatus, setListerStatus] = useState('APPROVED');

  useEffect(() => {
    const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || process.env.NODE_ENV === 'development';
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
      setError('Minimum event package rent allowed is ₹5000.');
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
      <style>{`
        @keyframes pageFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .add-page-wrap {
          max-width: 800px;
          margin: 0 auto;
          animation: pageFadeIn 0.4s ease both;
          padding: 20px;
        }

        .add-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
        }
        .back-link {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid rgba(44,94,67,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #74897C; text-decoration: none;
          transition: all 0.2s ease;
        }
        .back-link:hover {
          border-color: #2C5E43; color: #2C5E43; background: rgba(44,94,67,0.04);
        }
        .add-title {
          font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-size: 32px; font-weight: 400; color: #0D1A14;
        }

        .form-card {
          background: #FFFFFF; border-radius: 20px;
          border: 1px solid rgba(44,94,67,0.08);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(44,94,67,0.04);
          padding: 36px;
        }
        
        @media (max-width: 600px) {
          .form-card { padding: 24px 16px; }
        }

        .form-section-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          color: #2C5E43; text-transform: uppercase; margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }
        .form-section-title::after {
          content: ''; flex: 1; height: 1px; background: rgba(44,94,67,0.08);
        }

        .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .field-grid-1 { display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px; }
        @media (max-width: 600px) {
          .field-grid-2 { grid-template-columns: 1fr; }
        }

        .field-lbl {
          display: block; font-size: 10.5px; font-weight: 700;
          color: #3D5347; margin-bottom: 7px; letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .field-inp {
          width: 100%; height: 46px; padding: 0 14px;
          border: 1.5px solid #DDE4DF; border-radius: 10px; outline: none;
          font-size: 13.5px; color: #1C2E24; background: #FAFBFA;
          transition: all 0.2s ease;
        }
        .field-inp:focus {
          border-color: #2C5E43; background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(44,94,67,0.07);
        }
        .field-ta {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #DDE4DF; border-radius: 10px; outline: none;
          font-size: 13.5px; color: #1C2E24; background: #FAFBFA;
          resize: none; transition: all 0.2s ease;
        }
        .field-ta:focus {
          border-color: #2C5E43; background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(44,94,67,0.07);
        }

        /* Upload Image Grid */
        .images-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 16px; margin-top: 20px;
        }
        .image-preview-card {
          position: relative; aspect-ratio: 4/5;
          border-radius: 10px; border: 1px solid rgba(44,94,67,0.1);
          overflow: hidden; background: #F0F4F1;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .image-preview-img { width: 100%; height: 100%; object-fit: cover; }
        .image-preview-delete-btn {
          position: absolute; top: 6px; right: 6px;
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(229, 62, 62, 0.9); color: #FFFFFF;
          border: none; cursor: pointer; font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: background 0.15s ease;
        }
        .image-preview-delete-btn:hover { background: #E53E3E; }
        
        .trust-badge {
          background: #EDFDF5;
          border: 1px solid #C6F6D5;
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #276749;
          font-size: 13px;
        }

        .submit-section {
          border-top: 1px solid rgba(44,94,67,0.08);
          padding-top: 24px; display: flex; justify-content: flex-end; gap: 14px;
        }
        .cancel-btn {
          height: 48px; padding: 0 24px; border: 1.5px solid #DDE4DF;
          border-radius: 12px; background: transparent; color: #74897C;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease;
        }
        .cancel-btn:hover { border-color: #2C5E43; color: #2C5E43; background: rgba(44,94,67,0.04); }
        .save-btn {
          height: 48px; padding: 0 32px; border: none;
          border-radius: 12px; background: linear-gradient(135deg, #2C5E43, #1E4D33);
          color: #FFFFFF; font-size: 13px; font-weight: 700; letter-spacing: 0.06em;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          gap: 8px; transition: all 0.25s ease;
        }
        .save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(44,94,67,0.28); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .success-overlay {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; padding: 48px 20px;
        }
        .success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: #38A169; display: flex; align-items: center; justify-content: center;
          color: #FFFFFF; font-size: 28px; margin-bottom: 20px;
          box-shadow: 0 6px 20px rgba(56,161,105,0.25);
        }
      `}</style>

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
        ) : !isMobile ? (
          <div className="form-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: '28px', color: '#163625', marginBottom: '12px' }}>Mobile Device Required</h2>
            <p style={{ fontSize: '14px', color: '#74897C', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
              Please open this page on your mobile phone to add photos. High-quality live capture requires a mobile camera.
            </p>
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
                  <input className="field-inp" type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sabyasachi Inspired Floral Lehenga" />
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
                  <p style={{ fontSize: '11px', color: '#74897C', marginTop: '6px' }}>Flat 4-day event price (Minimum ₹5000). WARDROB takes a 35% commission.</p>
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
                
                {imageUrls.length < 4 ? (
                  <LiveCameraCapture 
                    onCapture={handleCapture}
                    buttonText="Open Camera & Capture"
                  />
                ) : (
                  <p style={{ color: '#2C5E43', fontWeight: 'bold' }}>✓ Maximum 4 photos uploaded.</p>
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
                <button type="submit" className="save-btn" disabled={loading || uploading || !title || !rentalPrice || Number(rentalPrice) < 5000 || imageUrls.length === 0}>
                  {loading ? 'Submitting...' : 'Submit Listing'}
                </button>
              </div>
            </form>
          )}
          </div>
        )}
      </div>
    </>
  );
}
