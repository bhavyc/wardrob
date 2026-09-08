'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import './hub-login.css';

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
