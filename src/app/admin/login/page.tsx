'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const urlError = searchParams.get('error');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (urlError) setError(urlError);
  }, [urlError]);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user && data.user.role === 'ADMIN') {
          router.replace('/admin');
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

    try {
      const res = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          await fetch('/api/auth/logout', { method: 'POST' });
          setError('Access denied. This account is not registered as a System Administrator.');
        }
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
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
          background: #FAFAFA;
          padding: 40px 24px;
          box-sizing: border-box;
          overflow-y: auto;
        }

        .form-col {
          width: 100%;
          max-width: 410px;
          background: #FFFFFF;
          border: 1px solid #EBEBEB;
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
          border-bottom: 1px solid #F0F0F0;
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
          background: #0A0A0A;
        }
        .brand-logo-diamond {
          width: 4px;
          height: 4px;
          background: #0A0A0A;
          transform: rotate(45deg);
          flex-shrink: 0;
        }
        .brand-name {
          font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 0.5em;
          text-indent: 0.5em;
          color: #0A0A0A;
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
          color: #999999;
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
          color: #888888;
          margin-bottom: 8px;
          text-align: center;
          display: block;
        }

        .form-title {
          font-family: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 400;
          color: #0A0A0A;
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
          color: #111111;
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
          border: 1px solid #CCCCCC;
          border-radius: 0px;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: #000000;
        }

        .password-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #888888;
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
          background: #000000;
          color: #FFFFFF;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .action-btn:hover:not(:disabled) {
          background: #222222;
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
      `}</style>

      <div className="login-root">
        <div className="form-col">
          {/* Logo Header */}
          <Link href="/" className="brand-logo-wrap">
            <div className="brand-logo-ornament">
              <span className="brand-logo-rule" />
              <span className="brand-logo-diamond" />
              <span className="brand-logo-rule" />
            </div>
            <span className="brand-name">WARDROB</span>
            <div className="brand-sub-row">
              <span className="brand-sub">Admin Console</span>
            </div>
          </Link>

          <div className="form-box">
            <span className="form-eyebrow">Security Guard</span>
            <h1 className="form-title">Console Login</h1>
            <p className="form-subtitle">Enter administrator credentials to unlock the panel.</p>

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
                  placeholder="admin@wardrob.com or 9999999999"
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
                  Seeded password is: <code>admin123</code>
                </div>
              </div>

              <button type="submit" className="action-btn" disabled={loading || !email || !password}>
                {loading ? <div className="spinner" /> : 'Unlock Admin Console'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#090D16' }} />}>
      <AdminLoginForm />
    </Suspense>
  );
}
