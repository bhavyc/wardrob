'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function ListerRegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Form step routing
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string | null; email: string } | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2
  const [shopName, setShopName] = useState('');
  const [bio, setBio] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      setCurrentUser(null);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setStep(1);
    } catch {}
    setLoading(false);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (phone.length < 10) {
        setError('Please enter a valid 10-digit phone number.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bio.trim().length < 20) {
      setError('Please write a slightly longer story (min 20 characters) so customers can appreciate your craft.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/lister/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          shopName,
          bio,
          referralCode: referralCodeInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/lister/kyc');
      } else {
        setError(data.error || 'Registration failed. Please check details and try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Personal Details', 'Public Profile'];
  const totalSteps = stepLabels.length;
  const displayStep = success ? totalSteps : step;

  return (
    <>
      <style jsx global>{`
        @keyframes regFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reg-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFAF5;
          padding: 40px 24px;
          box-sizing: border-box;
          overflow-y: auto;
        }

        .reg-card {
          width: 100%;
          max-width: 620px;
          background: #FFFFFF;
          border: 1px solid rgba(212,86,122,0.15);
          border-radius: 0px;
          padding: 48px 40px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
          animation: regFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          box-sizing: border-box;
          z-index: 10;
        }
        @media (max-width: 480px) {
          .reg-card { padding: 36px 20px; }
        }

        .brand-logo-wrap {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          margin-bottom: 36px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(212,86,122,0.1);
        }
        .brand-logo-ornament {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .brand-logo-rule {
          width: 24px;
          height: 1px;
          background: #1E1E2D;
        }
        .brand-logo-diamond {
          width: 4px;
          height: 4px;
          background: #1E1E2D;
          transform: rotate(45deg);
          flex-shrink: 0;
        }
        .brand-name {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-indent: 0.18em;
          color: #1E1E2D;
          text-decoration: none;
          text-transform: uppercase;
          display: block;
          line-height: 1;
        }
        .brand-sub-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 5px;
        }
        .brand-sub {
          font-size: 6.5px;
          font-weight: 600;
          letter-spacing: 0.4em;
          text-indent: 0.4em;
          color: #D4567A;
          text-transform: uppercase;
          display: block;
        }

        .reg-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }
        .reg-back {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #555555;
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 8px 14px;
          border: 1px solid #CCCCCC;
          transition: all 0.2s ease;
        }
        .reg-back:hover {
          border-color: #1E1E2D;
          color: #1E1E2D;
          background: #FFFAF5;
        }
        .reg-login-link {
          font-size: 12.5px;
          color: #666666;
        }
        .reg-login-link a {
          color: #1E1E2D;
          font-weight: 700;
          text-decoration: none;
          border-bottom: 1px solid #D4567A;
          padding-bottom: 2px;
        }

        .reg-progress {
          width: 100%;
          margin-bottom: 36px;
        }
        .reg-steps-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .reg-step-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .reg-step-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid #CCCCCC;
          background: #FFFFFF;
          color: #888888;
          transition: all 0.25s ease;
        }
        .reg-step-circle.active {
          border-color: #1E1E2D;
          background: #1E1E2D;
          color: #FFFFFF;
        }
        .reg-step-circle.done {
          border-color: #D4567A;
          background: #FFFFFF;
          color: #D4567A;
        }
        .reg-step-label {
          font-size: 11px;
          font-weight: 700;
          color: #999999;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .reg-step-label.active {
          color: #1E1E2D;
        }
        .reg-step-label.done {
          color: #D4567A;
        }
        .reg-step-line {
          flex: 1;
          height: 1px;
          background: #EBEBEB;
          margin: 0 12px;
        }
        .reg-step-line.done {
          background: #D4567A;
        }

        .reg-prog-bar-bg {
          width: 100%;
          height: 2px;
          background: rgba(212,86,122,0.15);
        }
        .reg-prog-bar-fill {
          height: 100%;
          background: #D4567A;
          transition: width 0.3s ease;
        }

        .reg-box {
          width: 100%;
        }

        .reg-section-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .reg-section-icon {
          font-size: 20px;
        }
        .reg-section-title {
          font-family: var(--font-serif);
          font-size: 24px;
          font-weight: 700;
          color: #1E1E2D;
          line-height: 1.2;
        }
        .reg-section-sub {
          font-size: 13px;
          color: #666666;
          margin-top: 2px;
        }

        .reg-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .reg-grid-1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 600px) {
          .reg-grid-2 { grid-template-columns: 1fr; }
        }

        .reg-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .reg-lbl {
          font-size: 9.5px;
          font-weight: 700;
          color: #1E1E2D;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .reg-inp, .reg-ta {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          color: #000000;
          background: #FFFFFF;
          border: 1px solid rgba(212,86,122,0.3);
          border-radius: 0px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .reg-inp:focus, .reg-ta:focus {
          border-color: #D4567A;
        }
        .reg-inp.mono {
          font-family: monospace;
          letter-spacing: 0.05em;
        }
        .reg-ta {
          font-family: var(--font-sans), sans-serif;
          resize: vertical;
        }

        .reg-hint {
          font-size: 11px;
          color: #888888;
        }

        .reg-btn-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
        }
        .reg-next-btn {
          flex: 1;
          height: 48px;
          border: none;
          border-radius: 0px;
          background: #1E1E2D;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .reg-next-btn:hover:not(:disabled) {
          background: #2A2A3D;
        }
        .reg-next-btn:disabled {
          background: #EBEBEB !important;
          color: #999999 !important;
          cursor: not-allowed;
        }

        .reg-back-btn {
          height: 48px;
          padding: 0 20px;
          border: 1px solid rgba(212,86,122,0.3);
          border-radius: 0px;
          background: #FFFFFF;
          color: #1E1E2D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .reg-back-btn:hover {
          border-color: #1E1E2D;
          background: #FFFAF5;
        }

        .reg-spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #FFF;
          animation: spin 0.6s linear infinite;
        }

        .reg-error {
          padding: 12px 14px;
          background: #FFF5F5;
          border: 1px solid #FFCCCC;
          border-radius: 0px;
          color: #CC2222;
          font-size: 12.5px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .reg-section-divider {
          height: 1px;
          background: #F0F0F0;
          margin: 24px 0;
        }
        .reg-section-tag {
          font-size: 10px;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .reg-security {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #888888;
          margin-top: 24px;
        }

        /* Success screen details */
        .reg-success {
          text-align: center;
          padding: 20px 0;
        }
        .reg-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #FAFAFA;
          border: 1px solid #EBEBEB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
        }
        .reg-success-title {
          font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          color: #000000;
          margin-bottom: 12px;
        }
        .reg-success-desc {
          font-size: 14px;
          color: #555555;
          line-height: 1.6;
          max-width: 440px;
          margin: 0 auto 28px;
        }
        .reg-success-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
          margin: 0 auto 28px;
          text-align: left;
        }
        .reg-success-step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #333333;
          padding: 12px;
          border: 1px solid #EBEBEB;
        }
        .reg-success-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #FAFAFA;
          border: 1px solid #EBEBEB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #000000;
        }
        .reg-login-cta {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 0px;
          background: #000000;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .reg-login-cta:hover {
          background: #222222;
        }

        .reg-user-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #FAFAFA;
          border: 1px solid #EBEBEB;
          margin-bottom: 24px;
        }
        .reg-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #000000;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
        .reg-user-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #000000;
        }
        .reg-user-email {
          font-size: 11px;
          color: #666666;
        }
        .reg-switch-btn {
          margin-left: auto;
          background: none;
          border: 1px solid #CCCCCC;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 700;
          color: #000000;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .reg-switch-btn:hover {
          border-color: #000000;
          background: #FAFAFA;
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-card">
          {/* Logo Header */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <BrandLogo size="lg" showSubtitle={true} subtitle="ARTISAN COLLECTIVE ONBOARDING" />
          </Link>

          {/* Top bar */}
          <div className="reg-topbar">
            <Link href="/" className="reg-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
              Back to Store
            </Link>
            <span className="reg-login-link">
              Already a Lister? <Link href="/lister/login">Sign In</Link>
            </span>
          </div>

          <div className="reg-form-area">
            {/* ── Success Screen ── */}
            {success ? (
              <div className="reg-success">
                <div className="reg-success-icon">✓</div>
                <h1 className="reg-success-title">Application Submitted</h1>
                <p className="reg-success-desc">
                  Your lister application is now under review. Our team typically responds within <strong>24–48 hours</strong>.
                </p>
                <div className="reg-success-steps">
                  {[
                    'Admin reviews your KYC & banking details',
                    'You receive approval confirmation',
                    'Sign in and start listing your wardrobe items',
                  ].map((s, i) => (
                    <div key={i} className="reg-success-step">
                      <div className="reg-success-num">{i + 1}</div>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
                <button className="reg-login-cta" onClick={() => router.push('/lister/login')}>
                  Sign In to Your Account →
                </button>
              </div>
            ) : (
              <>
                {/* Step progress */}
                <div className="reg-progress">
                  <div className="reg-steps-row">
                    {stepLabels.map((label, i) => {
                      const num = i + 1;
                      const isActive = num === displayStep;
                      const isDone = num < displayStep;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < stepLabels.length - 1 ? 1 : undefined }}>
                          <div className="reg-step-item">
                            <div className={`reg-step-circle${isActive ? ' active' : isDone ? ' done' : ''}`}>
                              {isDone ? '✓' : num}
                            </div>
                            <span className={`reg-step-label${isActive ? ' active' : isDone ? ' done' : ''}`}>{label}</span>
                          </div>
                          {i < stepLabels.length - 1 && (
                            <div className={`reg-step-line${isDone ? ' done' : ''}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="reg-prog-bar-bg">
                    <div className="reg-prog-bar-fill" style={{ width: `${(displayStep / totalSteps) * 100}%` }} />
                  </div>
                </div>

                {/* ── STEP 1: Personal Info ── */}
                {step === 1 && (
                  <div className="reg-box" key="step1">
                    <div className="reg-section-head">
                      <div className="reg-section-icon">👤</div>
                      <div>
                        <h1 className="reg-section-title">Your Information</h1>
                        <p className="reg-section-sub">Tell us about yourself</p>
                      </div>
                    </div>

                    {error && <div className="reg-error">{error}</div>}

                    <form onSubmit={handleNext}>
                      <div className="reg-grid-2">
                        <div className="reg-field">
                          <label className="reg-lbl">Full Name</label>
                          <input className="reg-inp" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aditi Sharma" autoFocus />
                        </div>
                        <div className="reg-field">
                          <label className="reg-lbl">Email Address</label>
                          <input className="reg-inp" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="aditi@example.com" />
                        </div>
                      </div>
                      <div className="reg-grid-1">
                        <div className="reg-field">
                          <label className="reg-lbl">Phone Number</label>
                          <input className="reg-inp" type="tel" required value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98765 43210" maxLength={10} />
                          <div className="reg-hint">Used for OTP login and buyer communication</div>
                        </div>
                      </div>
                      <div className="reg-grid-1">
                        <div className="reg-field">
                          <label className="reg-lbl">Password</label>
                          <input className="reg-inp" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} />
                          <div className="reg-hint">Used for logging into your lister portal</div>
                        </div>
                      </div>
                      <div className="reg-btn-row">
                        <button type="submit" className="reg-next-btn" disabled={!name || !email || !phone || !password}>
                          Continue to Profile Details →
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── STEP 2: Shop Details ── */}
                {step === 2 && (
                  <div className="reg-box" key="step2">
                    <div className="reg-section-head">
                      <div className="reg-section-icon">👗</div>
                      <div>
                        <h1 className="reg-section-title">Your Profile Info</h1>
                        <p className="reg-section-sub">Tell renters a bit about your style</p>
                      </div>
                    </div>

                    {/* Logged-in user badge */}
                    {isLoggedIn && currentUser && (
                      <div className="reg-user-badge">
                        <div className="reg-user-avatar">
                          {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="reg-user-name">{currentUser.name}</div>
                          <div className="reg-user-email">{currentUser.email}</div>
                        </div>
                        <button type="button" className="reg-switch-btn" onClick={handleLogout} disabled={loading}>
                          New Account
                        </button>
                      </div>
                    )}

                    {error && <div className="reg-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                      <div className="reg-grid-1">
                        <div className="reg-field">
                          <label className="reg-lbl">Public Display Name</label>
                          <input className="reg-inp" type="text" required value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Aditi's Wardrobe" autoFocus />
                        </div>
                      </div>
                      <div className="reg-grid-1">
                        <div className="reg-field">
                          <label className="reg-lbl">Heritage Story & Bio</label>
                          <textarea
                            className="reg-ta" required rows={4} value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Describe your style, favorite brands, and what makes your wardrobe unique to renters..."
                          />
                          <div className="reg-hint">This appears on your public profile visible to renters</div>
                        </div>
                      </div>
                      <div className="reg-grid-1">
                        <div className="reg-field">
                          <label className="reg-lbl">Referral Code (Optional)</label>
                          <input
                            className="reg-inp"
                            type="text"
                            value={referralCodeInput}
                            onChange={e => setReferralCodeInput(e.target.value.toUpperCase())}
                            placeholder="e.g. REF123456"
                          />
                          <div className="reg-hint">Have a referral code from an existing Lister? Enter it to link accounts.</div>
                        </div>
                      </div>
                      <div className="reg-btn-row">
                        {!isLoggedIn && (
                          <button type="button" className="reg-back-btn" onClick={() => { setStep(1); setError(''); }}>
                            Back
                          </button>
                        )}
                        <button type="submit" className="reg-next-btn" disabled={loading || !shopName || !bio}>
                          {loading ? 'Creating Account…' : 'Create Profile & Proceed →'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
