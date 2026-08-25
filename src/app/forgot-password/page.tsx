'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
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
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage(data.message);
        if (data.dev_token) {
          setDevToken(data.dev_token);
        }
      } else {
        setError(data.error || 'Failed to send reset link.');
      }
    } catch {
      setError('Connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#FFF', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="premium-serif" style={{ fontSize: '28px', color: '#000', marginBottom: '8px' }}>Reset Password</h1>
          <p style={{ fontSize: '14px', color: '#666' }}>Enter your email to receive a password reset link.</p>
        </div>

        {error && <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>{error}</div>}
        {message && <div style={{ background: '#ECFDF5', color: '#065F46', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>{message}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#000', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #EBEBEB', fontSize: '15px', outline: 'none' }}
              disabled={loading || !!message}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !!message}
            className="btn-primary" 
            style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', background: '#000', color: '#FFF', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {devToken && (
          <div style={{ marginTop: '24px', padding: '16px', background: '#F8F9FA', borderRadius: '8px', border: '1px dashed #CCC' }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600 }}>🛠 Dev Mode Token:</p>
            <p style={{ fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace', color: '#000', marginBottom: '12px' }}>{devToken}</p>
            <Link 
              href={`/reset-password?token=${devToken}`}
              style={{ display: 'block', textAlign: 'center', fontSize: '12px', color: '#2C5E43', fontWeight: 600, textDecoration: 'underline' }}
            >
              Simulate Email Click (Go to Reset)
            </Link>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href="/renter/login" style={{ fontSize: '13px', color: '#666', textDecoration: 'underline' }}>Back to Renter Login</Link>
          <span style={{ margin: '0 10px', color: '#CCC' }}>|</span>
          <Link href="/lister/login" style={{ fontSize: '13px', color: '#666', textDecoration: 'underline' }}>Back to Lister Login</Link>
        </div>
      </div>
    </div>
  );
}
