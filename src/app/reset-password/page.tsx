'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to reset password.');
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
          <h1 className="premium-serif" style={{ fontSize: '28px', color: '#000', marginBottom: '8px' }}>Create New Password</h1>
          <p style={{ fontSize: '14px', color: '#666' }}>Please enter your new password below.</p>
        </div>

        {error && <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>{error}</div>}
        {message && <div style={{ background: '#ECFDF5', color: '#065F46', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>{message}</div>}

        {!message ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#000', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #EBEBEB', fontSize: '15px', outline: 'none' }}
                disabled={loading || !token}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#000', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #EBEBEB', fontSize: '15px', outline: 'none' }}
                disabled={loading || !token}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !token}
              className="btn-primary" 
              style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', background: '#000', color: '#FFF', fontSize: '14px', fontWeight: 600, cursor: loading || !token ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href="/renter/login" style={{ display: 'inline-block', padding: '12px 24px', background: '#000', color: '#FFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
