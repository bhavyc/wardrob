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
          background: var(--bg);
          padding: 40px 24px;
          box-sizing: border-box;
          overflow-y: auto;
          position: relative;
        }

        .login-root::before {
          content: '';
          position: absolute;
          top: -20%; left: -10%;
          width: 50%; height: 50%;
          background: radial-gradient(circle, var(--accent-light) 0%, transparent 70%);
          opacity: 0.8;
          filter: blur(80px);
          pointer-events: none;
        }

        .form-col {
          width: 100%;
          max-width: 420px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 48px 40px;
          box-shadow: var(--shadow-lg);
          animation: fadeInUp 0.5s var(--ease-out-expo) both;
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
          border-bottom: 1px solid var(--border);
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
          background: var(--ink);
        }
        .brand-logo-diamond {
          width: 4px;
          height: 4px;
          background: var(--ink);
          transform: rotate(45deg);
          flex-shrink: 0;
        }
        .brand-name {
          font-family: var(--font-serif);
          font-size: 24px;
          font-weight: 600;
          letter-spacing: 0.5em;
          text-indent: 0.5em;
          color: var(--ink);
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
          font-family: var(--font-sans);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.4em;
          text-indent: 0.4em;
          color: var(--accent);
          text-transform: uppercase;
          display: block;
        }

        .form-box {
          width: 100%;
        }

        .form-eyebrow {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 8px;
          text-align: center;
          display: block;
        }

        .form-title {
          font-family: var(--font-serif);
          font-size: 32px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 8px;
          line-height: 1.2;
          text-align: center;
        }
        .form-subtitle {
          font-family: var(--font-sans);
          font-size: 14px;
          color: var(--text-muted);
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
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 700;
          color: var(--ink-secondary);
          margin-bottom: 8px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .input-row {
          display: flex;
          align-items: center;
          position: relative;
        }
        .form-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          font-family: var(--font-sans);
          font-size: 15px;
          color: var(--ink);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          outline: none;
          transition: var(--transition-smooth);
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-light);
          background: #FFFFFF;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          font-family: var(--font-sans);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          transition: color 0.2s;
        }
        .password-toggle:hover {
          color: var(--ink);
        }

        .reg-hint {
          font-family: var(--font-sans);
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 10px;
          line-height: 1.4;
        }
        .reg-hint code {
          background: var(--bg-rose);
          color: var(--accent);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-weight: 600;
        }

        .action-btn {
          width: 100%;
          height: 54px;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          background: var(--ink);
          color: #FFFFFF;
          transition: var(--transition-smooth);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          box-shadow: 0 4px 14px rgba(30, 30, 45, 0.2);
        }
        .action-btn:hover:not(:disabled) {
          background: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212, 86, 122, 0.3);
        }
        .action-btn:disabled {
          background: var(--border-strong) !important;
          color: var(--text-muted) !important;
          box-shadow: none !important;
          transform: none !important;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #FFF;
          animation: spin 0.6s linear infinite;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
        }
        .error-text {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #DC2626;
          font-weight: 600;
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
