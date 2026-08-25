'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    aadhaarNumber: '',
    panNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.name === 'panNumber') value = value.toUpperCase();
    if (e.target.name === 'aadhaarNumber') value = value.replace(/\D/g, '').slice(0, 12);
    
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login?registered=true'), 2000);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.name.trim().length >= 2 &&
    formData.email.trim() !== '' &&
    formData.phone.trim().length === 10 &&
    formData.password.length >= 8 &&
    formData.confirmPassword === formData.password &&
    formData.aadhaarNumber.length === 12 &&
    formData.panNumber.length === 10;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    padding: '0 16px',
    background: '#FFFFFF',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--ink)',
    marginBottom: '8px',
    letterSpacing: '0.06em',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow = '0 0 0 4px var(--accent-light)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <>
      <style jsx global>{`
        @keyframes registerFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.08; }
        }
        @keyframes successPop {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .reg-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 4px var(--accent-light) !important;
        }
        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: var(--ink); }
        .strength-bar {
          height: 3px;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
      `}</style>

      <div style={{
        minHeight: '100vh', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
        padding: '40px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot pattern background */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          animation: 'dotPulse 4s ease-in-out infinite',
        }} />

        <div style={{
          width: '100%', maxWidth: '460px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 40px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'registerFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
          position: 'relative', zIndex: 10,
        }}>

          {/* Logo */}
          <div style={{
            textAlign: 'center', marginBottom: '32px',
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

          {/* Success State */}
          {success ? (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              animation: 'successPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                Account Created!
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--ink-secondary)' }}>
                Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              <h1 style={{
                fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700,
                color: 'var(--ink)', marginBottom: '6px', textAlign: 'center',
              }}>Create Your Account</h1>
              <p style={{
                fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.5,
                marginBottom: '28px', textAlign: 'center',
              }}>
                Join Wardrob and discover luxury fashion rentals.
              </p>

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

              <form onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle} htmlFor="reg-name">Full Name</label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    required
                    autoFocus
                    autoComplete="name"
                    placeholder="Sneha Verma"
                    value={formData.name}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle} htmlFor="reg-email">Email Address</label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="sneha@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle} htmlFor="reg-phone">Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '14px', color: 'var(--ink-secondary)', fontWeight: 500,
                      userSelect: 'none',
                    }}>+91</span>
                    <input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={formData.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData(prev => ({ ...prev, phone: val }));
                        if (error) setError('');
                      }}
                      style={{ ...inputStyle, paddingLeft: '48px' }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  {/* Aadhaar Number */}
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle} htmlFor="reg-aadhaar">Aadhaar Number (12 digits)</label>
                    <input
                      id="reg-aadhaar"
                      name="aadhaarNumber"
                      type="text"
                      required
                      placeholder="1234 5678 9012"
                      maxLength={12}
                      value={formData.aadhaarNumber}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>

                  {/* PAN Number */}
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle} htmlFor="reg-pan">PAN Card Number</label>
                    <input
                      id="reg-pan"
                      name="panNumber"
                      type="text"
                      required
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      value={formData.panNumber}
                      onChange={handleChange}
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle} htmlFor="reg-password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      style={{ ...inputStyle, paddingRight: '48px' }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {formData.password.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[1, 2, 3, 4].map(i => {
                        const strength = Math.min(
                          (formData.password.length >= 8 ? 1 : 0) +
                          (/[A-Z]/.test(formData.password) ? 1 : 0) +
                          (/[0-9]/.test(formData.password) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(formData.password) ? 1 : 0),
                          4
                        );
                        const colors = ['#EF4444', '#F97316', '#EAB308', '#10B981'];
                        return (
                          <div
                            key={i}
                            className="strength-bar"
                            style={{
                              flex: 1,
                              background: i <= strength ? colors[strength - 1] : 'var(--border)',
                            }}
                          />
                        );
                      })}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                        {
                          formData.password.length < 8 ? 'Too short' :
                          (() => {
                            const s = (formData.password.length >= 8 ? 1 : 0) +
                              (/[A-Z]/.test(formData.password) ? 1 : 0) +
                              (/[0-9]/.test(formData.password) ? 1 : 0) +
                              (/[^A-Za-z0-9]/.test(formData.password) ? 1 : 0);
                            return s <= 1 ? 'Weak' : s === 2 ? 'Fair' : s === 3 ? 'Good' : 'Strong';
                          })()
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '28px' }}>
                  <label style={labelStyle} htmlFor="reg-confirm">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        paddingRight: '48px',
                        borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password
                          ? '#EF4444'
                          : formData.confirmPassword && formData.confirmPassword === formData.password
                          ? '#10B981'
                          : undefined,
                      }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowConfirm(v => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                    <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px' }}>
                      Passwords do not match.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  id="btn-create-account"
                  disabled={loading || !isFormValid}
                  style={{
                    width: '100%', height: '50px', border: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: loading || !isFormValid
                      ? 'var(--border)'
                      : 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)',
                    color: loading || !isFormValid ? 'var(--text-muted)' : '#FFFFFF',
                    fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em',
                    cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.3s ease',
                    boxShadow: loading || !isFormValid ? 'none' : '0 4px 16px rgba(212, 86, 122, 0.3)',
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#FFF', animation: 'spin 0.6s linear infinite',
                      }} />
                      Creating Account...
                    </>
                  ) : 'Create Account →'}
                </button>

                {/* Terms notice */}
                <p style={{
                  fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center',
                  marginTop: '16px', lineHeight: 1.5,
                }}>
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>

              {/* Login link */}
              <div style={{
                marginTop: '28px', paddingTop: '24px',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '14px', color: 'var(--ink-secondary)' }}>
                  Already have an account?{' '}
                  <Link href="/login" style={{
                    color: 'var(--accent)', fontWeight: 600, textDecoration: 'none',
                  }}>
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <RegisterForm />
    </Suspense>
  );
}
