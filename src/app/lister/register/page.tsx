'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './lister-register.css';

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
