'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import '../login/login.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    setDevToken('');

    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage(data.message || 'A secure reset link has been dispatched to your email.');
        if (data.dev_token) {
          setDevToken(data.dev_token);
        }
      } else {
        setError(data.error || 'Failed to send reset link. Please check the email entered.');
      }
    } catch {
      setError('Connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="renter-auth-wrapper">
      {/* Return to Sign In navigation */}
      <Link href="/login" className="auth-nav-back" title="Return to Sign In">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Back to Sign In</span>
      </Link>

      {/* Luxury Centered Card */}
      <div className="auth-form-card">
        {/* Brand Header */}
        <div className="auth-brand-head" onClick={() => router.push('/')}>
          <BrandLogo size="lg" showSubtitle={true} subtitle="ACCOUNT SECURITY" />
        </div>

        <div className="auth-header-text">
          <span className="auth-badge-pill">Account Recovery</span>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your registered email address to receive a secure password recovery link.</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="auth-error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {message && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '14px 16px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            color: '#065F46',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '20px',
            lineHeight: 1.45
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              <div style={{ fontWeight: 700, color: '#047857', marginBottom: '2px' }}>Reset Link Dispatched</div>
              <div>{message}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
                disabled={loading || !!message}
                autoComplete="email"
                required
              />
              <div className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!message}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <span className="auth-submit-spinner" />
                <span>Sending Recovery Link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Development Token Helper */}
        {devToken && (
          <div style={{
            marginTop: '20px',
            padding: '14px',
            background: '#FFF8F6',
            borderRadius: '12px',
            border: '1px dashed rgba(212, 86, 122, 0.4)'
          }}>
            <p style={{ fontSize: '11px', color: '#D4567A', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🛠 Local Development Token
            </p>
            <p style={{ fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#1E1E2D', marginBottom: '10px' }}>
              {devToken}
            </p>
            <Link
              href={`/reset-password?token=${devToken}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#D4567A',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <span>Click to simulate opening reset email</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        )}

        {/* Card Footer */}
        <div className="auth-card-footer">
          <span className="auth-footer-text">Remember your login details?</span>
          <Link href="/login" className="auth-footer-link">Back to Member Sign In</Link>
        </div>
      </div>
    </div>
  );
}
