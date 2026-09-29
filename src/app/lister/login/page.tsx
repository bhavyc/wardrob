'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './lister-login.css';

function ListerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlError) setError(urlError);
  }, [urlError]);

  // Redirect if already logged in as Lister
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user && data.user.role === 'LISTER') {
          router.replace('/lister/listings');
        }
      } catch {}
    }
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email/phone and password.');
      return;
    }
    setLoading(true);
    setError('');
    setIsBlocked(false);

    try {
      const res = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user.role === 'LISTER' || data.user.role === 'ADMIN') {
          router.push('/lister/listings');
        } else {
          await fetch('/api/auth/logout', { method: 'POST' });
          setError('This account is registered as a Renter, not a Lister. Please use Lister credentials.');
        }
      } else {
        if (data.error === 'Account under review') {
          setIsBlocked(true);
        } else {
          setError(data.error || 'Invalid credentials. Please verify your email/phone and password.');
        }
      }
    } catch {
      setError('Network connection timeout. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lister-auth-wrapper">
      {/* Back to Home navigation */}
      <Link href="/" className="lister-nav-back" title="Return to Homepage">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Back to Storefront</span>
      </Link>

      {/* Centered Luxury Card */}
      <div className="lister-form-card">
        {/* Logo Header */}
        <div className="lister-brand-head" onClick={() => router.push('/')}>
          <BrandLogo size="lg" showSubtitle={true} subtitle="ARTISAN &amp; CURATOR STUDIO" />
        </div>

        {isBlocked ? (
          <div className="lister-blocked-card">
            <div className="lister-blocked-icon-box">⏳</div>
            <h2 className="lister-blocked-title">Account Under Review</h2>
            <p className="lister-blocked-desc">
              Your Lister KYC profile and documents are currently under verification by our curator team. This typically takes 24–48 hours. You will receive an SMS and email notification once your studio is approved.
            </p>
            <div className="lister-blocked-status-pill">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4567A' }} />
              <span>Verification Pending</span>
            </div>
            <button
              type="button"
              className="lister-back-btn"
              onClick={() => { setIsBlocked(false); setPassword(''); setError(''); }}
            >
              ← Try Another Account
            </button>
          </div>
        ) : (
          <>
            <div className="lister-header-text">
              <span className="lister-eyebrow">Lister Portal</span>
              <h1 className="lister-title">Lister Sign In</h1>
              <p className="lister-subtitle">Access your garment inventory, earnings, and rental requests.</p>
            </div>

            {error && (
              <div className="lister-error-banner">
                <span style={{ fontSize: '15px' }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="lister-field">
                <label className="lister-label">
                  <span>Email or Phone</span>
                </label>
                <div className="lister-input-wrapper">
                  <input
                    type="text"
                    className="lister-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. ananya@couture.com"
                    required
                    autoFocus
                  />
                  <div className="lister-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="lister-field">
                <label className="lister-label">
                  <span>Password</span>
                  <Link href="/forgot-password" className="lister-forgot-link">
                    Forgot?
                  </Link>
                </label>
                <div className="lister-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="lister-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter studio password"
                    required
                  />
                  <div className="lister-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="lister-pw-toggle"
                    onClick={() => setShowPassword(p => !p)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="lister-submit-btn"
                disabled={loading || !email.trim() || !password.trim()}
              >
                {loading ? (
                  <>
                    <div className="lister-submit-spinner" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Access Lister Suite</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Switch to Renter Sign In */}
            <div style={{ marginTop: '18px', textAlign: 'center' }}>
              <Link
                href="/login"
                style={{
                  fontSize: '12px',
                  color: '#666677',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'color 0.2s ease',
                }}
              >
                <span>Looking to rent garments?</span>
                <span style={{ color: '#D4567A', fontWeight: 600 }}>Renter Sign In →</span>
              </Link>
            </div>

            <div className="lister-divider">
              <div className="lister-divider-line" />
              <span className="lister-divider-text">New Atelier Partner?</span>
              <div className="lister-divider-line" />
            </div>

            <div className="lister-card-footer">
              <Link href="/lister/register" className="lister-footer-btn">
                Apply to Become a Lister
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ListerLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#FFFAF5' }} />}>
      <ListerLoginForm />
    </Suspense>
  );
}
