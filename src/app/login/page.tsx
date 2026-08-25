'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          if (data.user.role === 'LISTER') router.replace('/lister/products');
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
        if (data.user.role === 'LISTER') router.push('/lister/products');
        else if (data.user.role === 'ADMIN') router.push('/admin');
        else router.push('/');
      } else {
        setError(data.error || 'Invalid email or password.');
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
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.08; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
        padding: '40px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle dot pattern background */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          animation: 'dotPulse 4s ease-in-out infinite',
        }} />

        <div style={{
          width: '100%', maxWidth: '420px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 40px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'loginFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
          position: 'relative', zIndex: 10,
        }}>
          {/* Logo */}
          <div style={{
            textAlign: 'center', marginBottom: '36px',
            paddingBottom: '24px', borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
          }} onClick={() => router.push('/')}>
            <span style={{
              fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700,
              letterSpacing: '0.18em', color: 'var(--ink)', display: 'block',
              marginBottom: '6px',
            }}>WARDROB</span>
            <span style={{
              fontSize: '10px', fontWeight: 500, letterSpacing: '0.2em',
              color: 'var(--text-muted)', textTransform: 'uppercase',
            }}>Premium Fashion Rental</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700,
            color: 'var(--ink)', marginBottom: '8px', textAlign: 'center',
          }}>Welcome Back</h1>
          <p style={{
            fontSize: '14px', color: 'var(--ink-secondary)', lineHeight: 1.5,
            marginBottom: '32px', textAlign: 'center',
          }}>Sign in to access your account and bookings.</p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 16px', background: '#FFF5F5',
              border: '1px solid #FFD5D5', borderRadius: 'var(--radius-md)',
              color: '#CC2222', fontSize: '13px', fontWeight: 500,
              marginBottom: '24px',
            }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 600,
                color: 'var(--ink)', marginBottom: '8px',
                letterSpacing: '0.06em',
              }}>Email Address</label>
              <input
                type="email"
                required
                autoFocus
                placeholder="hello@wardrob.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', height: '48px', padding: '0 16px',
                  background: '#FFFFFF', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--ink)',
                  outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 4px var(--accent-light)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 600,
                color: 'var(--ink)', marginBottom: '8px',
                letterSpacing: '0.06em',
              }}>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', height: '48px', padding: '0 16px',
                  background: '#FFFFFF', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md)', fontSize: '14px', color: 'var(--ink)',
                  outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.boxShadow = '0 0 0 4px var(--accent-light)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link href="/forgot-password" style={{
                fontSize: '13px', color: 'var(--accent)', fontWeight: 500,
                textDecoration: 'none',
              }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading || !email || !password} style={{
              width: '100%', height: '50px', border: 'none',
              borderRadius: 'var(--radius-md)',
              background: loading || !email || !password ? 'var(--border)' : 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)',
              color: loading || !email || !password ? 'var(--text-muted)' : '#FFFFFF',
              fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: loading || !email || !password ? 'none' : '0 4px 16px rgba(212, 86, 122, 0.3)',
            }}>
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFF', animation: 'spin 0.6s linear infinite',
                  }} />
                  Verifying...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Register link */}
          <div style={{
            marginTop: '28px', paddingTop: '24px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--ink-secondary)' }}>
              New to Wardrob?{' '}
              <Link href="/register" style={{
                color: 'var(--accent)', fontWeight: 600, textDecoration: 'none',
              }}>
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <LoginForm />
    </Suspense>
  );
}
