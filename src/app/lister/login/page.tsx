'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

function ListerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const urlError = searchParams.get('error');

  useEffect(() => { setMounted(true); }, []);

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
          // Logged in user is not a Lister, logout and show error
          await fetch('/api/auth/logout', { method: 'POST' });
          setError('This account is not registered as a Lister. Please register to continue.');
        }
      } else {
        if (data.error === 'Account under review') {
          setIsBlocked(true);
        } else {
          setError(data.error || 'Invalid credentials. Please try again.');
        }
      }
    } catch {
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-root {
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

        .form-col {
          width: 100%;
          max-width: 410px;
          background: #FFFFFF;
          border: 1px solid rgba(212,86,122,0.15);
          border-radius: 0px;
          padding: 48px 40px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          box-sizing: border-box;
          z-index: 10;
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

        .form-box {
          width: 100%;
        }

        .form-eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(212,86,122,0.8);
          margin-bottom: 8px;
          text-align: center;
          display: block;
        }

        .form-title {
          font-family: var(--font-serif);
          font-size: 26px;
          font-weight: 700;
          color: #1E1E2D;
          margin-bottom: 8px;
          line-height: 1.2;
          text-align: center;
        }
        .form-subtitle {
          font-size: 13px;
          color: #666666;
          margin-bottom: 32px;
          line-height: 1.5;
          text-align: center;
        }

        .field-wrap {
          position: relative;
          margin-bottom: 24px;
        }
        .field-label {
          display: block;
          font-size: 9.5px;
          font-weight: 700;
          color: #1E1E2D;
          margin-bottom: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .input-row {
          display: flex;
          align-items: center;
          position: relative;
        }
        .form-input {
          width: 100%;
          height: 46px;
          padding: 0 14px;
          font-size: 14px;
          color: #000000;
          background: #FFFFFF;
          border: 1px solid rgba(212,86,122,0.3);
          border-radius: 0px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: #D4567A;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #D4567A;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .reg-hint {
          font-size: 11px;
          color: #888888;
          margin-top: 8px;
          line-height: 1.4;
        }
        .reg-hint code {
          background: #F5F5F5;
          padding: 2px 6px;
          font-family: inherit;
          color: #000000;
          font-weight: 600;
        }

        .action-btn {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 0px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          background: #1E1E2D;
          color: #FFFFFF;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .action-btn:hover:not(:disabled) {
          background: #2A2A3D;
        }
        .action-btn:disabled {
          background: #EBEBEB !important;
          color: #999999 !important;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #FFF;
          animation: spin 0.6s linear infinite;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: #FFF5F5;
          border: 1px solid #FFCCCC;
          border-radius: 0px;
          margin-bottom: 20px;
        }
        .error-text {
          font-size: 12.5px;
          color: #CC2222;
          font-weight: 500;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 32px 0 24px;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(212,86,122,0.15);
        }
        .divider-text {
          font-size: 10.5px;
          color: #999999;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .register-link {
          text-align: center;
          font-size: 12.5px;
        }
        .register-link a {
          color: #1E1E2D;
          font-weight: 700;
          text-decoration: none;
          border-bottom: 1px solid #D4567A;
          padding-bottom: 2px;
          transition: opacity 0.2s ease;
        }
        .register-link a:hover {
          opacity: 0.6;
        }

        .blocked-card {
          text-align: center;
          padding: 20px 0;
        }
        .blocked-icon {
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
        .blocked-title {
          font-family: var(--font-cormorant), serif;
          font-size: 24px;
          font-weight: 400;
          color: #0A0A0A;
          margin-bottom: 12px;
        }
        .blocked-desc {
          font-size: 13.5px;
          color: #666666;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .blocked-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #FAFAFA;
          border: 1px solid #EBEBEB;
          border-radius: 0px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #666666;
          margin-bottom: 24px;
        }
        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 1px solid #CCCCCC;
          border-radius: 0px;
          padding: 12px 16px;
          cursor: pointer;
          color: #000000;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          width: 100%;
        }
        .back-btn:hover {
          border-color: #000000;
          background: #FAFAFA;
        }
      `}</style>

      <div className="login-root">
        <div className="form-col">
          {/* Logo Header */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <BrandLogo size="lg" showSubtitle={true} subtitle="ARTISAN STUDIO" />
          </Link>

          <div className="form-box">
            {isBlocked ? (
              <div className="blocked-card">
                <div className="blocked-icon">⏳</div>
                <h2 className="blocked-title">Account Under Review</h2>
                <p className="blocked-desc">
                  Your Lister application is currently being reviewed by our team. This process typically takes 24–48 hours. We'll notify you once your account is approved.
                </p>
                <div className="blocked-badge">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#888888' }} />
                  Pending Approval
                </div>
                <button
                  className="back-btn"
                  onClick={() => { setIsBlocked(false); setPassword(''); setError(''); }}
                >
                  ← Try Another Account
                </button>
              </div>
            ) : (
              <>
                <span className="form-eyebrow">Lister Portal</span>
                <h1 className="form-title">Lister Sign In</h1>
                <p className="form-subtitle">Enter credentials to access your listings dashboard.</p>

                {error && (
                  <div className="error-banner">
                    <div className="error-text">{error}</div>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="field-wrap">
                    <label className="field-label">Email or Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. aditi@example.com"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="field-wrap">
                    <label className="field-label">Password</label>
                    <div className="input-row">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(p => !p)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="reg-hint">
                      Seeded password is: <code>lister123</code>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: '-12px', marginBottom: '8px' }}>
                    <Link href="/forgot-password" style={{ fontSize: '13px', color: '#163300', fontWeight: 500, textDecoration: 'underline' }}>
                      Forgot Password?
                    </Link>
                  </div>

                  <button type="submit" className="action-btn" disabled={loading || !email || !password}>
                    {loading ? <div className="spinner" /> : 'Access Dashboard'}
                  </button>
                </form>

                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-text">Want to rent out your wardrobe?</span>
                  <div className="divider-line" />
                </div>

                <div className="register-link">
                  <Link href="/lister/register">Become a Lister</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ListerLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#090D16' }} />}>
      <ListerLoginForm />
    </Suspense>
  );
}
