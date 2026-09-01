'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';

export default function HubLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/password/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'HUB_PARTNER' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.user.role === 'HUB_PARTNER' || data.user.role === 'ADMIN') {
          router.push('/hub');
        } else {
          setError('Unauthorized. Only Hub Partners can access this portal.');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .hub-login-page {
          min-height: 100vh;
          display: flex;
          background: #0F172A;
          font-family: var(--font-sans), sans-serif;
        }

        .hub-login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 64px;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          position: relative;
          overflow: hidden;
        }
        .hub-login-left::before {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 60%);
        }

        .hub-login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: #F8FAFC;
        }

        .hub-login-card {
          width: 100%;
          max-width: 440px;
          background: #FFFFFF;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 25px 50px -12px rgba(15,23,42,0.1);
          border: 1px solid rgba(15,23,42,0.05);
        }

        .hub-h1 {
          font-family: var(--font-inter), sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .hub-sub {
          font-size: 14px;
          color: #64748B;
          margin-bottom: 32px;
        }

        .hub-input-group {
          margin-bottom: 20px;
        }
        .hub-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .hub-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          color: #0F172A;
          transition: all 0.2s ease;
          outline: none;
          background: #FAFAF9;
        }
        .hub-input:focus {
          border-color: #3B82F6;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
        }

        .hub-btn {
          width: 100%;
          height: 48px;
          background: #0F172A;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 12px;
        }
        .hub-btn:hover:not(:disabled) {
          background: #1E293B;
          transform: translateY(-1px);
        }
        .hub-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .hub-login-left { display: none; }
          .hub-login-page { background: #F8FAFC; }
          .hub-login-card { padding: 32px 24px; box-shadow: none; border: none; background: transparent; }
        }
      `}</style>

      <div className="hub-login-page">
        <div className="hub-login-left">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: 24 }}>
              <BrandLogo size="lg" color="#FFFFFF" accentColor="#94A3B8" align="left" showSubtitle={true} subtitle="QUALITY CONTROL HUB" />
            </div>
            <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.6, maxWidth: 400 }}>
              The central nerve center for luxury logistics. Inspect, sanitize, and dispatch premium garments with absolute confidence.
            </p>
          </div>
        </div>

        <div className="hub-login-right">
          <div className="hub-login-card">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <BrandLogo size="md" showSubtitle={true} subtitle="QUALITY HUB CONSOLE" />
            </div>
            <h2 className="hub-h1">Hub Authentication</h2>
            <p className="hub-sub">Sign in to the partner operations console.</p>
            
            {error && (
              <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#991B1B', fontSize: 13, marginBottom: 24, fontWeight: 500 }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin}>
              <div className="hub-input-group">
                <label className="hub-label">Email Address</label>
                <input
                  type="email" required
                  className="hub-input"
                  placeholder="hub@wardrob.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="hub-input-group">
                <label className="hub-label">Secure Password</label>
                <input
                  type="password" required
                  className="hub-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" disabled={loading} className="hub-btn">
                {loading ? 'Authenticating...' : 'Secure Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
