'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import '../login/login.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState('');

  // Step 1: Send OTP Code
  const handleSendCode = async (e: React.FormEvent) => {
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
        setStep(2);
        setMessage(data.message || 'A 6-digit verification code has been dispatched to your email.');
      } else {
        setError(data.error || 'Failed to send verification code. Please check the email.');
      }
    } catch {
      setError('Connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password with OTP Code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit code received in your email.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: code.trim(),
          newPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setMessage('Your password has been updated successfully. You can now log in.');
      } else {
        setError(data.error || 'Invalid or expired code. Please request a new code.');
      }
    } catch {
      setError('Connection error. Please try again.');
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
          <h1 className="auth-title">
            {success ? 'Password Reset' : step === 1 ? 'Forgot Password' : 'Enter 6-Digit Code'}
          </h1>
          <p className="auth-subtitle">
            {success
              ? 'Your account password has been updated securely.'
              : step === 1
              ? 'Enter your registered email address to receive a secure 6-digit reset code.'
              : `We sent a 6-digit code to ${email}. Enter the code below with your new password.`}
          </p>
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

        {/* Success / Status Notification */}
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
              <div style={{ fontWeight: 700, color: '#047857', marginBottom: '2px' }}>
                {success ? 'Success!' : 'Verification Code Sent'}
              </div>
              <div>{message}</div>
            </div>
          </div>
        )}

        {success ? (
          <div>
            <Link
              href="/login"
              className="auth-submit-btn"
              style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }}
            >
              <span>Sign In with New Password</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        ) : step === 1 ? (
          /* STEP 1: Enter Email */
          <form onSubmit={handleSendCode}>
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="auth-input"
                  disabled={loading}
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
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <span className="auth-submit-spinner" />
                  <span>Sending 6-Digit Code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Enter Code + New Password */
          <form onSubmit={handleResetPassword}>
            {/* 6-Digit Code Field */}
            <div className="auth-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="auth-label">6-Digit Code</label>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setMessage(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent, #D4567A)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Change Email
                </button>
              </div>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="auth-input"
                  style={{ letterSpacing: '4px', fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}
                  disabled={loading}
                  required
                />
                <div className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div className="auth-field">
              <label className="auth-label">New Password (min. 8 characters)</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-icon"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label">Confirm New Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn"
            >
              {loading ? (
                <>
                  <span className="auth-submit-spinner" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Set New Password</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* Development Token Helper */}
        {devToken && !success && (
          <div style={{
            marginTop: '20px',
            padding: '12px 14px',
            background: '#FFF8F6',
            borderRadius: '12px',
            border: '1px dashed rgba(212, 86, 122, 0.4)'
          }}>
            <p style={{ fontSize: '11px', color: '#D4567A', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🛠 Local Dev Verification Code
            </p>
            <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#1E1E2D', margin: 0, letterSpacing: '2px' }}>
              {devToken}
            </p>
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
