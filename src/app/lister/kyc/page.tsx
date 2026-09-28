'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './lister-kyc.css';

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
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [hasSubmittedDocs, setHasSubmittedDocs] = useState<boolean>(false);

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
            const docsInDb = Boolean(p.aadhaarNumber && p.panNumber && p.bankAccountNo);
            setHasSubmittedDocs(docsInDb);
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
              setShowPaymentSuccessModal(true);
              window.dispatchEvent(new Event('lister-updated'));
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
        setSuccess(true);
        setHasSubmittedDocs(true);
        setListerStatus('PENDING');
        setIsVerified(false);
        window.dispatchEvent(new Event('lister-updated'));
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
      <div className="kyc-wrap">
        <div className="kyc-header">
          <h1 className="kyc-h1">KYC Verification</h1>
          <p className="kyc-sub">{shopName ? `Identity verification for "${shopName}"` : 'Complete your identity and banking details to start selling'}</p>
        </div>

        {/* Status Banner — Only shown if registration fee is paid AND (approved, rejected, or docs actually submitted) */}
        {registrationFeePaid && ListerStatus && STATUS_CONFIG[ListerStatus] && (ListerStatus !== 'PENDING' || hasSubmittedDocs || success) && (
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
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setHasSubmittedDocs(false)}
                    style={{
                      background: 'rgba(180, 83, 9, 0.1)',
                      border: '1px solid rgba(180, 83, 9, 0.3)',
                      color: '#92400E',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ Edit Submitted Information
                  </button>
                </div>
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

        {/* KYC Form — shown if fee is paid AND (documents not submitted yet OR rejected) AND not recently submitted */}
        {registrationFeePaid && ((!hasSubmittedDocs && ListerStatus !== 'APPROVED') || ListerStatus === 'REJECTED') && !success && (
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
                <div style={{ marginTop: '16px', padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>⚠️</span>
                  <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                    <strong>Important:</strong> Please double-check your bank account number and IFSC code. If incorrect details are provided, payouts may be transferred to the wrong account and Wardrob will not be held responsible for the loss of funds.
                  </p>
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

        {/* Payment Success Modal */}
        {showPaymentSuccessModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 999, padding: '20px',
          }}>
            <div style={{
              background: '#FFFFFF', borderRadius: '20px', width: '100%',
              maxWidth: '440px', padding: '32px', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid rgba(44,94,67,0.1)',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#ECFDF5', border: '2px solid #6EE7B7',
                color: '#059669', fontSize: '28px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                ✓
              </div>
              <h3 style={{
                fontFamily: 'var(--font-cormorant), serif',
                fontSize: '26px', fontWeight: 600, color: '#0D1A14', marginBottom: '12px',
              }}>
                Payment Successful!
              </h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
                Your ₹500 registration fee has been received. 
                <br/><br/>
                <strong>Next Step:</strong> Please submit your KYC details below. You will be able to list items for rent only after your identity is verified and approved by our Admin team.
              </p>
              <button
                style={{
                  width: '100%', height: '48px', border: 'none', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2C5E43, #1E4D33)', color: '#FFFFFF',
                  fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(44,94,67,0.25)',
                }}
                onClick={() => setShowPaymentSuccessModal(false)}
              >
                I Understood, Proceed to KYC
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
