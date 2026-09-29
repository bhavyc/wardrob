'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './admin-login.css';

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
      <div className="login-root">
        <div className="form-col">
          {/* Logo Header */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <BrandLogo size="lg" showSubtitle={true} subtitle="ADMIN CONSOLE" />
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
                  placeholder="Enter admin email or mobile"
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
