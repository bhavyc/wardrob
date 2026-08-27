'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

type UserDetails = {
  name: string;
  email: string;
  phone: string | null;
};

export default function ListerKycPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ListerStatus, setListerStatus] = useState<KycStatus>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [shopName, setShopName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bio, setBio] = useState('');
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const [registrationFeePaid, setRegistrationFeePaid] = useState<boolean>(true);
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const ListerRes = await fetch('/api/lister/profile');
        if (ListerRes.ok) {
          const ListerData = await ListerRes.json();
          if (ListerData.success && ListerData.profile) {
            const p = ListerData.profile;
            setRegistrationFeePaid(Boolean(p.registrationFeePaid));
            setListerStatus(p.status); 
            setIsVerified(p.isVerified); 
            setShopName(p.shopName);
            setAadhaarNumber(p.aadhaarNumber || ''); 
            setPanNumber(p.panNumber || '');
            setBankAccountNo(p.bankAccountNo || ''); 
            setBankIfsc(p.bankIfsc || '');
            setBio(p.bio || '');
            setUserDetails(p.user || null);
          } else {
            router.push('/lister/register');
          }
        } else {
          router.push('/lister/register');
        }
      } catch {
        setError('Failed to load verification status.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayRegistrationFee = async () => {
    setFeeLoading(true);
    setError('');
    try {
      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        setError('Razorpay SDK failed to load. Please check internet connection.');
        setFeeLoading(false);
        return;
      }

      const res = await fetch('/api/lister/registration-fee/order', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create registration fee payment order.');
        setFeeLoading(false);
        return;
      }

      const options = {
        key: data.razorpayOrder.keyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: 'Wardrob Boutique Platform',
        description: 'Lister Onboarding Registration Fee (₹500)',
        order_id: data.razorpayOrder.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/lister/registration-fee/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setRegistrationFeePaid(true);
            } else {
              setError(verifyData.error || 'Payment verification failed.');
            }
          } catch {
            setError('Verification network error.');
          } finally {
            setFeeLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setFeeLoading(false);
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch {
      setError('Registration fee checkout error.');
      setFeeLoading(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarNumber.length !== 12 || isNaN(Number(aadhaarNumber))) {
      setError('Aadhaar number must be a 12-digit numeric code.'); return;
    }
    if (panNumber.length !== 10) {
      setError('PAN number must be exactly 10 alphanumeric characters.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/lister/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber, panNumber, bankAccountNo, bankIfsc }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true); setListerStatus('PENDING'); setIsVerified(false);
      } else {
        setError(data.error || 'Failed to submit KYC details.');
      }
    } catch {
      setError('Submission error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_CONFIG = {
    APPROVED: {
      gradient: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
      border: '#6EE7B7',
      iconBg: 'linear-gradient(135deg, #10B981, #059669)',
      icon: '✓',
      title: 'Identity Verified',
      titleColor: '#065F46',
      desc: 'Your Aadhaar, PAN, and bank details have been successfully verified. Your account is fully approved to list listings and receive payouts.',
      descColor: '#047857',
    },
    PENDING: {
      gradient: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
      border: '#FCD34D',
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      icon: '⏳',
      title: 'Under Review',
      titleColor: '#92400E',
      desc: 'Your documents have been submitted and are being reviewed by our compliance team. This typically takes 24–48 business hours.',
      descColor: '#B45309',
    },
    REJECTED: {
      gradient: 'linear-gradient(135deg, #FFF5F5, #FED7D7)',
      border: '#FEB2B2',
      iconBg: 'linear-gradient(135deg, #E53E3E, #C53030)',
      icon: '✗',
      title: 'Verification Failed',
      titleColor: '#7F1D1D',
      desc: 'Your previous KYC submission was rejected. Please review the information below and re-submit with correct details.',
      descColor: '#991B1B',
    },
  };

  if (loading) return null;

  return (
    <>
      <style>{`
        @keyframes kycFadeUp { from { opacity:0;transform:translateY(16px); } to { opacity:1;transform:translateY(0); } }
        @keyframes checkPop { from { transform:scale(0) rotate(-30deg);opacity:0; } to { transform:scale(1) rotate(0deg);opacity:1; } }
        @keyframes spin { to { transform:rotate(360deg); } }

        .kyc-wrap { width: 100%; max-width: 860px; }

        .kyc-header { margin-bottom: 28px; animation:kycFadeUp 0.4s ease both; }
        .kyc-h1 { font-family:var(--font-cormorant),'Cormorant Garamond',Georgia,serif; font-size:32px; font-weight:400; color:#0D1A14; margin-bottom:4px; }
        .kyc-sub { font-size:13px; color:#74897C; }

        .status-banner {
          border-radius:20px; padding:28px 32px; margin-bottom:28px;
          border:1px solid; animation:kycFadeUp 0.4s ease 0.08s both;
        }
        .status-banner-top { display:flex; align-items:center; gap:20px; }
        @media (max-width: 768px) {
          .status-banner-top { flex-direction: column; align-items: flex-start; gap: 12px; }
          .kyc-summary { gap: 16px; }
          .kyc-summary-row { flex-direction: column; align-items: flex-start; gap: 4px; }
        }
        .status-banner-icon {
          width:52px; height:52px; border-radius:16px;
          display:flex; align-items:center; justify-content:center;
          font-size:22px; color:#FFFFFF; flex-shrink:0;
          box-shadow:0 6px 18px rgba(0,0,0,0.12);
          animation:checkPop 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both;
        }
        .status-banner-title { font-family:var(--font-cormorant),serif; font-size:24px; font-weight:400; margin-bottom:4px; }
        .status-banner-desc { font-size:13px; line-height:1.6; }

        .kyc-summary {
          background:rgba(255,255,255,0.7); border-radius:12px;
          padding:16px; display:flex; flex-direction:column; gap:10px;
          margin-top:16px; border:1px solid rgba(255,255,255,0.8);
        }
        .kyc-summary-row { display:flex; align-items:center; justify-content:space-between; font-size:12px; }
        .kyc-summary-key { color:rgba(0,0,0,0.4); font-weight:600; letter-spacing:0.04em; text-transform:uppercase; font-size:10px; }
        .kyc-summary-val { font-family:monospace; font-weight:700; font-size:13px; color:rgba(0,0,0,0.65); }

        .approved-actions { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:20px; }
        @media (max-width: 768px) {
          .approved-actions { grid-template-columns:1fr; }
        }
        .action-btn-primary {
          height:44px; border:none; border-radius:10px; cursor:pointer;
          background:linear-gradient(135deg,#2C5E43,#1E4D33);
          color:#FFFFFF; font-size:12px; font-weight:700; letter-spacing:0.08em;
          transition:all 0.25s ease; display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .action-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(44,94,67,0.28); }
        .action-btn-outline {
          height:44px; border:1.5px solid rgba(44,94,67,0.25); border-radius:10px; cursor:pointer;
          background:rgba(255,255,255,0.6); color:#2C5E43; font-size:12px; font-weight:700;
          letter-spacing:0.08em; transition:all 0.25s ease;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .action-btn-outline:hover { background:#2C5E43; color:#FFFFFF; border-color:#2C5E43; }

        /* Form */
        .kyc-form-card {
          background:#FFFFFF; border-radius:20px;
          border:1px solid rgba(44,94,67,0.08);
          box-shadow:0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(44,94,67,0.04);
          overflow:hidden; animation:kycFadeUp 0.4s ease 0.16s both;
        }
        .form-section-head {
          padding:20px 28px; background:#F8FAF8;
          border-bottom:1px solid rgba(44,94,67,0.07);
          display:flex; align-items:center; gap:12px;
        }
        .section-icon {
          width:36px; height:36px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          font-size:16px; background:linear-gradient(135deg,rgba(44,94,67,0.1),rgba(197,168,128,0.06));
        }
        .section-title { font-size:12px; font-weight:700; color:#2C5E43; letter-spacing:0.08em; text-transform:uppercase; }
        .section-subtitle { font-size:11px; color:#74897C; margin-top:2px; }

        .form-fields { padding:24px 28px; display:flex; flex-direction:column; gap:18px; }
        .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media (max-width: 768px) {
          .two-col { grid-template-columns: 1fr; }
          .form-fields { padding: 20px; }
        }
        .field-lbl { display:block; font-size:10px; font-weight:700; color:#3D5347; margin-bottom:7px; letter-spacing:0.07em; text-transform:uppercase; }
        .field-inp {
          width:100%; height:46px; padding:0 14px;
          border:1.5px solid #DDE4DF; border-radius:10px; outline:none;
          font-size:13px; color:#1C2E24; background:#FAFBFA;
          transition:all 0.2s ease;
        }
        .field-inp:focus { border-color:#2C5E43; background:#FFFFFF; box-shadow:0 0 0 3px rgba(44,94,67,0.07); }
        .field-inp.mono { font-family:monospace; letter-spacing:0.1em; }

        .form-divider { height:1px; background:rgba(44,94,67,0.06); margin:4px 0; }

        .submit-section { padding:0 28px 28px; }
        .submit-btn {
          width:100%; height:52px; border:none; border-radius:14px;
          background:linear-gradient(135deg,#2C5E43,#1E4D33);
          color:#FFFFFF; font-size:13px; font-weight:700; letter-spacing:0.1em;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all 0.25s ease;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 24px rgba(44,94,67,0.3); }
        .submit-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .mini-spin { width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,0.3); border-top-color:#FFF; animation:spin 0.65s linear infinite; }

        .alert-error { padding:14px 18px; border-radius:12px; margin-bottom:20px; font-size:13px; font-weight:500; display:flex; align-items:center; gap:10px; background:#FFF5F5; border:1px solid #FEB2B2; color:#C53030; }
        .success-banner {
          padding:20px 24px; border-radius:14px; margin-bottom:20px;
          background:linear-gradient(135deg,#F0FFF4,#C6F6D5);
          border:1px solid #9AE6B4; display:flex; align-items:center; gap:12px;
        }
        .success-icon { width:36px; height:36px; border-radius:50%; background:#38A169; display:flex; align-items:center; justify-content:center; color:#FFF; font-size:16px; flex-shrink:0; }

        /* Verified Console Columns layout */
        .pane-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 28px;
          margin-top: 28px;
          animation: kycFadeUp 0.4s ease 0.16s both;
        }
        @media (max-width: 900px) {
          .pane-layout { grid-template-columns: 1fr; gap: 20px; }
        }

        .pane-section { display: flex; flex-direction: column; gap: 6px; }
        .pane-lbl {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #74897C;
          margin-bottom: 4px;
        }
        .pane-val { font-size: 13.5px; color: #334155; line-height: 1.6; }

        /* Document Visual Cards (Aadhaar & PAN) */
        .docs-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 8px;
        }
        @media (max-width: 600px) {
          .docs-container { grid-template-columns: 1fr; }
        }

        .doc-mockup-card {
          width: 100%;
          max-width: 320px;
          aspect-ratio: 1.58 / 1;
          border-radius: 12px;
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(15,23,42,0.03);
          border: 1px solid;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s ease;
        }
        .doc-mockup-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(15,23,42,0.06);
        }

        /* Aadhaar card details */
        .aadhaar-style {
          background: linear-gradient(135deg, #F0FDFA, #E0F2FE);
          border-color: #93C5FD;
        }
        .aadhaar-header {
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(147, 197, 253, 0.4);
          padding-bottom: 6px; margin-bottom: 6px;
        }
        .gov-seal-icon { font-size: 14px; }
        .gov-text-small { font-size: 7.5px; font-weight: 800; color: #1E3A8A; text-transform: uppercase; }
        .aadhaar-number-display {
          font-family: monospace; font-size: 15px; font-weight: 700;
          letter-spacing: 0.1em; color: #1E293B; text-align: center; margin: 8px 0;
        }
        .aadhaar-holder-label { font-size: 7.5px; color: #64748B; text-transform: uppercase; }
        .aadhaar-holder-name { font-size: 10.5px; font-weight: 700; color: #1E293B; }

        /* PAN card details */
        .pan-style {
          background: linear-gradient(135deg, #ECFDF5, #F0FDF4);
          border-color: #6EE7B7;
        }
        .pan-header {
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(110, 231, 183, 0.4);
          padding-bottom: 6px; margin-bottom: 6px;
        }
        .pan-header-text { font-size: 7.5px; font-weight: 800; color: #064E3B; text-transform: uppercase; }
        .pan-number-display {
          font-family: monospace; font-size: 15px; font-weight: 700;
          letter-spacing: 0.12em; color: #0F172A; text-align: center; margin: 8px 0;
          background: rgba(255,255,255,0.7); padding: 4px; border-radius: 6px;
        }
        .pan-subinfo { display: flex; justify-content: space-between; align-items: flex-end; }
        .pan-signature-line { font-family: 'Georgia', serif; font-style: italic; font-size: 11px; color: #0F172A; border-bottom: 1px dashed #A7F3D0; padding-bottom: 2px; }

        /* Settlement Payout Bank Card Mockup */
        .bank-passbook-mockup {
          width: 100%;
          max-width: 320px;
          aspect-ratio: 1.58 / 1;
          background: linear-gradient(135deg, #1C2D24 0%, #0A140F 100%);
          border-color: rgba(197, 168, 128, 0.25);
          color: #FFFFFF;
          border-radius: 14px;
          padding: 16px 20px;
          box-shadow: 0 10px 24px rgba(15,23,42,0.15);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .bank-passbook-mockup::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 10% 10%, rgba(197, 168, 128, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .bank-card-chip {
          width: 32px; height: 24px; border-radius: 4px;
          background: linear-gradient(135deg, #C5A880, #E5C59F);
          position: relative;
          margin-top: 6px;
        }
        .bank-card-chip::after {
          content: ''; position: absolute; inset: 4px;
          border: 1px solid rgba(0,0,0,0.15); border-radius: 2px;
        }
        .bank-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .bank-card-title { font-size: 8.5px; font-weight: 700; letter-spacing: 0.15em; color: #C5A880; text-transform: uppercase; }
        .bank-card-number {
          font-family: monospace; font-size: 16px; font-weight: 700;
          letter-spacing: 0.08em; color: #FFFFFF; text-shadow: 0 2px 4px rgba(0,0,0,0.4);
          margin-top: 10px; margin-bottom: 10px;
        }
        .bank-card-footer { display: flex; justify-content: space-between; align-items: flex-end; }
        .bank-card-holder { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.9); }
        .bank-card-ifsc { font-size: 10px; font-family: monospace; color: #C5A880; font-weight: 700; }
      `}</style>

      <div className="kyc-wrap">
        <div className="kyc-header">
          <h1 className="kyc-h1">KYC Verification</h1>
          <p className="kyc-sub">{shopName ? `Identity verification for "${shopName}"` : 'Complete your identity and banking details to start selling'}</p>
        </div>

        {/* Status Banner */}
        {ListerStatus && STATUS_CONFIG[ListerStatus] && (
          <div
            className="status-banner"
            style={{
              background: STATUS_CONFIG[ListerStatus].gradient,
              borderColor: STATUS_CONFIG[ListerStatus].border,
            }}
          >
            <div className="status-banner-top">
              <div className="status-banner-icon" style={{ background: STATUS_CONFIG[ListerStatus].iconBg }}>
                {STATUS_CONFIG[ListerStatus].icon}
              </div>
              <div>
                <h2 className="status-banner-title" style={{ color: STATUS_CONFIG[ListerStatus].titleColor }}>
                  {STATUS_CONFIG[ListerStatus].title}
                </h2>
                <p className="status-banner-desc" style={{ color: STATUS_CONFIG[ListerStatus].descColor }}>
                  {STATUS_CONFIG[ListerStatus].desc}
                </p>
              </div>
            </div>

            {/* Masked details for PENDING */}
            {ListerStatus === 'PENDING' && (aadhaarNumber || panNumber) && (
              <div className="kyc-summary">
                {aadhaarNumber && (
                  <div className="kyc-summary-row">
                    <span className="kyc-summary-key">Aadhaar</span>
                    <span className="kyc-summary-val">XXXX XXXX {aadhaarNumber.slice(-4)}</span>
                  </div>
                )}
                {panNumber && (
                  <div className="kyc-summary-row">
                    <span className="kyc-summary-key">PAN</span>
                    <span className="kyc-summary-val">XXXXX{panNumber.slice(-4)}</span>
                  </div>
                )}
                {bankAccountNo && (
                  <div className="kyc-summary-row">
                    <span className="kyc-summary-key">Bank Account</span>
                    <span className="kyc-summary-val">XXXXXXX{bankAccountNo.slice(-4)}</span>
                  </div>
                )}
                {bankIfsc && (
                  <div className="kyc-summary-row">
                    <span className="kyc-summary-key">IFSC</span>
                    <span className="kyc-summary-val">{bankIfsc}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions for APPROVED */}
            {ListerStatus === 'APPROVED' && (
              <div className="approved-actions">
                <button className="action-btn-primary" onClick={() => router.push('/lister/listings')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="3" width="7" height="7" rx="1" /><rect x="15" y="3" width="7" height="7" rx="1" /><rect x="2" y="14" width="7" height="7" rx="1" /><rect x="15" y="14" width="7" height="7" rx="1" /></svg>
                  Manage listings
                </button>
                <button className="action-btn-outline" onClick={() => router.push('/lister/bookings')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12H19" /><path d="M12 5L19 12L12 19" /></svg>
                  View bookings
                </button>
              </div>
            )}
          </div>
        )}

        {/* Extended display for APPROVED: verified mockups console */}
        {ListerStatus === 'APPROVED' && (
          <div className="pane-layout">
            {/* Left side: Aadhaar & PAN mockups */}
            <div className="pane-section">
              <span className="pane-lbl">Verified Identity Cards (KYC)</span>
              <div className="docs-container">
                {/* Aadhaar card mock */}
                <div className="doc-mockup-card aadhaar-style">
                  <div className="aadhaar-header">
                    <span className="gov-text-small">Unique Identification Authority of India</span>
                    <span className="gov-seal-icon">🏛️</span>
                  </div>
                  <div className="aadhaar-number-display">
                    XXXX XXXX {aadhaarNumber.slice(-4)}
                  </div>
                  <div>
                    <div className="aadhaar-holder-label">Aadhaar Number</div>
                    <div className="aadhaar-holder-name">{userDetails?.name || 'VERIFIED PARTNER'}</div>
                  </div>
                </div>

                {/* PAN card mock */}
                <div className="doc-mockup-card pan-style">
                  <div className="pan-header">
                    <span className="pan-header-text">Income Tax Department · Govt of India</span>
                    <span className="gov-seal-icon">🇮🇳</span>
                  </div>
                  <div className="pan-number-display">
                    XXXXX{panNumber.slice(-4).toUpperCase()}
                  </div>
                  <div className="pan-subinfo">
                    <div>
                      <div className="aadhaar-holder-label">Permanent Account Card</div>
                      <div className="aadhaar-holder-name">{(userDetails?.name || 'VERIFIED PARTNER').toUpperCase()}</div>
                    </div>
                    <div className="pan-signature-line">
                      {(userDetails?.name || 'VERIFIED').split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Artisan Heritage Story Box */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid rgba(44,94,67,0.08)', boxShadow: '0 4px 12px rgba(44,94,67,0.02)' }}>
                <span className="pane-lbl">Artisan Heritage & Shop Story</span>
                <p style={{ fontStyle: 'italic', fontSize: '13.5px', color: '#3D5347', lineHeight: 1.6 }}>
                  "{bio || 'Your registered artisan shop profile bio will appear here.'}"
                </p>
              </div>
            </div>

             {/* Right side: Bank details list & contact details */}
            <div className="pane-section">
              <span className="pane-lbl">Settlement Bank Account</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid rgba(44,94,67,0.08)', boxShadow: '0 4px 12px rgba(44,94,67,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '8px' }}>
                  <span style={{ color: '#74897C' }}>Bank Account Number</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>XXXX XXXX {bankAccountNo.slice(-4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '2px' }}>
                  <span style={{ color: '#74897C' }}>IFSC Code</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bankIfsc.toUpperCase()}</span>
                </div>
              </div>

              {/* Registered contact details card */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid rgba(44,94,67,0.08)', boxShadow: '0 4px 12px rgba(44,94,67,0.02)' }}>
                <span className="pane-lbl">Compliance Registered Contacts</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginTop: 4 }}>
                  <span>✉️</span>
                  <span style={{ fontWeight: 600 }}>{userDetails?.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  <span>📞</span>
                  <span style={{ fontWeight: 600 }}>{userDetails?.phone || 'No phone registered'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Fee Card — shown if fee is not paid yet */}
        {!registrationFeePaid && (
          <div className="kyc-form-card" style={{ padding: '36px 32px' }}>
            {error && (
              <div className="alert-error" style={{ marginBottom: '20px' }}><span>⚠</span>{error}</div>
            )}
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>
                💳
              </div>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '24px', fontWeight: 600, color: '#0D1A14', marginBottom: '8px' }}>
                Lister Onboarding Registration Fee
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
                To maintain standard quality, trust, and baseline verification across all boutiques, a mandatory one-time registration fee of <strong>₹500 (Non-Refundable)</strong> is required before submitting your KYC details.
              </p>
              
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                  <span style={{ color: '#475569', fontWeight: 500 }}>One-time Platform Fee</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>₹500.00</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                  * This fee is non-refundable regardless of KYC verification outcome.
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayRegistrationFee}
                disabled={feeLoading}
                className="submit-btn"
                style={{ width: '100%', height: '48px', fontSize: '14px' }}
              >
                {feeLoading ? <><div className="mini-spin" />Processing Gateway…</> : 'Pay ₹500 & Proceed to KYC Verification →'}
              </button>
            </div>
          </div>
        )}

        {/* KYC Form — shown if fee is paid AND (status === null || REJECTED) */}
        {registrationFeePaid && (ListerStatus === null || ListerStatus === 'REJECTED') && !success && (
          <div className="kyc-form-card">
            {error && (
              <div style={{ padding: '16px 28px 0' }}>
                <div className="alert-error"><span>⚠</span>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmitKyc}>
              {/* Identity section */}
              <div className="form-section-head">
                <div className="section-icon">🪪</div>
                <div>
                  <div className="section-title">Government Identity</div>
                  <div className="section-subtitle">Aadhaar and PAN verification</div>
                </div>
              </div>
              <div className="form-fields">
                <div className="two-col">
                  <div>
                    <label className="field-lbl">Aadhaar Number</label>
                    <input
                      className="field-inp mono" type="text" required maxLength={12}
                      value={aadhaarNumber}
                      onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234 5678 9012"
                    />
                  </div>
                  <div>
                    <label className="field-lbl">PAN Card Number</label>
                    <input
                      className="field-inp mono" type="text" required maxLength={10}
                      value={panNumber}
                      onChange={e => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>
              </div>

              <div className="form-divider" />

              {/* Bank section */}
              <div className="form-section-head">
                <div className="section-icon">🏦</div>
                <div>
                  <div className="section-title">Payout Bank Account</div>
                  <div className="section-subtitle">Where your earnings will be deposited</div>
                </div>
              </div>
              <div className="form-fields">
                <div className="two-col">
                  <div>
                    <label className="field-lbl">Account Number</label>
                    <input
                      className="field-inp mono" type="text" required
                      value={bankAccountNo}
                      onChange={e => setBankAccountNo(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter Account Number"
                    />
                  </div>
                  <div>
                    <label className="field-lbl">IFSC Code</label>
                    <input
                      className="field-inp mono" type="text" required maxLength={11}
                      value={bankIfsc}
                      onChange={e => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                    />
                  </div>
                </div>
              </div>

              <div className="submit-section">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting || !aadhaarNumber || !panNumber || !bankAccountNo || !bankIfsc}
                >
                  {submitting ? <><div className="mini-spin" />Submitting…</> : 'Submit KYC for Verification →'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#AEC0B4', marginTop: '12px' }}>
                  All data is encrypted with 256-bit SSL
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="success-banner">
            <div className="success-icon">✓</div>
            <div>
              <strong style={{ fontSize: 14, color: '#276749' }}>KYC Submitted Successfully</strong>
              <p style={{ fontSize: 13, color: '#38A169', marginTop: 2 }}>
                Your documents are under review. We'll notify you within 24–48 hours.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
