'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './login.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlError) setError(urlError);
  }, [urlError]);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) {
          if (data.user.role === 'LISTER') router.replace('/lister/listings');
          else if (data.user.role === 'ADMIN') router.replace('/admin');
          else router.replace('/');
        }
      } catch {}
    }
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user.role === 'LISTER') router.push('/lister/listings');
        else if (data.user.role === 'ADMIN') router.push('/admin');
        else router.push('/');
      } else {
        setError(data.error || 'Invalid email or password. Please verify credentials.');
      }
    } catch {
      setError('Connection timeout. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="renter-auth-wrapper">
      {/* Back to Home navigation */}
      <Link href="/" className="auth-nav-back" title="Return to Homepage">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Explore Collection</span>
      </Link>

      {/* Centered Luxury Card */}
      <div className="auth-form-card">
        {/* Logo Header */}
        <div className="auth-brand-head" onClick={() => router.push('/')}>
          <BrandLogo size="lg" showSubtitle={true} subtitle="PREMIUM FASHION RENTAL" />
        </div>

        <div className="auth-header-text">
          <span className="auth-badge-pill">Renter Portal</span>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your curated wardrobe, measurements &amp; active rentals.</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <span style={{ fontSize: '15px' }}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label className="auth-label">
              <span>Email or Mobile</span>
            </label>
            <div className="auth-input-wrapper">
              <input
                type="text"
                required
                autoFocus
                placeholder="name@example.com or 10-digit mobile"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
              />
              <div className="auth-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">
              <span>Password</span>
              <Link href="/forgot-password" className="auth-forgot-link">
                Forgot?
              </Link>
            </label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your account password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input"
              />
              <div className="auth-input-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
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
            disabled={loading || !email.trim() || !password.trim()}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <div className="auth-submit-spinner" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Closet</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Switch to Lister Sign in */}
        <div style={{ marginTop: '18px', textAlign: 'center' }}>
          <Link
            href="/lister/login"
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
            <span>Are you a registered Lister?</span>
            <span style={{ color: '#D4567A', fontWeight: 600 }}>Lister Portal →</span>
          </Link>
        </div>

        <div className="auth-card-footer">
          <p className="auth-footer-text">
            New to Wardrob?
            <Link href="/register" className="auth-footer-link">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg, #FFFAF5)' }} />}>
      <LoginForm />
    </Suspense>
  );
}
