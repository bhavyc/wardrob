'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function IDVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [idPhotoUrl, setIdPhotoUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.success && data.user) {
          setSessionUser(data.user);
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setIdPhotoUrl(data.url);
      } else {
        setError(data.error || 'Failed to upload photo.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber || !idPhotoUrl) {
      setError('Please provide an ID number and upload a photo.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idType, idNumber, idPhotoUrl })
      });
      const data = await res.json();
      
      if (data.success) {
        setSessionUser({ ...sessionUser, idVerificationStatus: 'PENDING' });
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  const status = sessionUser?.idVerificationStatus || 'NOT_SUBMITTED';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF8', padding: '60px 20px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: '40px 32px', borderRadius: 16, boxShadow: '0 8px 24px rgba(44,94,67,0.08)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Link href="/" style={{ fontSize: 13, color: '#74897C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>←</span> Back to Store
          </Link>
          <BrandLogo size="sm" />
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#163625', margin: '0 0 8px', fontFamily: 'var(--font-cormorant), serif' }}>Trust & Safety Verification</h1>
        
        {status === 'APPROVED' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 18, color: '#059669', marginBottom: 8 }}>Identity Verified</h2>
            <p style={{ fontSize: 14, color: '#74897C' }}>You are a trusted member of the WARDROB community.</p>
          </div>
        )}

        {status === 'PENDING' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 18, color: '#D97706', marginBottom: 8 }}>Verification in Progress</h2>
            <p style={{ fontSize: 14, color: '#74897C' }}>Your ID has been submitted and is currently being reviewed by our Trust & Safety team.</p>
          </div>
        )}

        {(status === 'NOT_SUBMITTED' || status === 'REJECTED') && (
          <>
            <p style={{ fontSize: 14, color: '#74897C', marginBottom: 32, lineHeight: 1.5 }}>
              WARDROB is a trusted community. To receive the verified badge, please submit a valid government ID.
            </p>

            {status === 'REJECTED' && (
              <div style={{ background: '#FFF5F5', color: '#C53030', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 24, border: '1px solid #FEB2B2' }}>
                <strong>Verification Rejected:</strong> {sessionUser?.idRejectionReason || 'Your ID could not be verified. Please try again with a clear photo.'}
              </div>
            )}

            {error && (
              <div style={{ background: '#FFF5F5', color: '#C53030', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 24, border: '1px solid #FEB2B2' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2E24', marginBottom: 8 }}>ID Document Type</label>
                <select
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #DDE4DF', fontSize: 14, color: '#1C2E24', background: '#FAFBFA' }}
                  value={idType}
                  onChange={e => setIdType(e.target.value)}
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2E24', marginBottom: 8 }}>ID Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234 5678 9012"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #DDE4DF', fontSize: 14, color: '#1C2E24', background: '#FAFBFA' }}
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1C2E24', marginBottom: 8 }}>Upload ID Photo</label>
                <p style={{ fontSize: 11, color: '#74897C', marginBottom: 12 }}>Ensure all text is clearly visible and not blurry.</p>
                
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    border: '2px dashed #DDE4DF', 
                    borderRadius: 8, 
                    padding: '32px 16px', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    background: idPhotoUrl ? '#F0FDF4' : '#FAFBFA',
                    transition: 'background 0.2s'
                  }}
                >
                  {uploading ? (
                    <span style={{ fontSize: 14, color: '#2C5E43', fontWeight: 600 }}>Uploading...</span>
                  ) : idPhotoUrl ? (
                    <div>
                      <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>✅</span>
                      <span style={{ fontSize: 14, color: '#059669', fontWeight: 600 }}>ID Uploaded</span>
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>📸</span>
                      <span style={{ fontSize: 14, color: '#74897C', fontWeight: 600 }}>Click to upload Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={loading || uploading || !idPhotoUrl || !idNumber}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    background: (loading || uploading || !idPhotoUrl || !idNumber) ? '#AEC0B4' : '#2C5E43', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 8, 
                    fontSize: 15, 
                    fontWeight: 700, 
                    cursor: (loading || uploading || !idPhotoUrl || !idNumber) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Submit Verification
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
