'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RenterNavbar() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    fetch('/api/auth/session')
      .then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null)
      .then(d => { if (d?.success && d?.user) setSession(d.user); })
      .catch(() => {});

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setMobileMenuOpen(false);
    router.refresh();
    router.push('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <style>{`
        .rn-left { display: flex; align-items: center; gap: 28px; flex: 1; }
        .rn-right { display: flex; align-items: center; justify-content: flex-end; gap: 20px; flex: 1; }
        .rn-link {
          font-size: 13px; font-weight: 500; color: var(--ink-secondary);
          letter-spacing: 0.06em; text-decoration: none; transition: color 0.3s ease;
        }
        .rn-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          width: 36px; height: 36px; align-items: center; justify-content: center;
          border-radius: 8px; transition: background 0.2s;
        }
        .rn-hamburger:hover { background: var(--accent-light); }
        .rn-hamburger svg { stroke: var(--ink); }
        .rn-mobile-menu {
          display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          z-index: 200; pointer-events: none;
        }
        .rn-mobile-menu.open { pointer-events: all; }
        .rn-mobile-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.4); opacity: 0;
          transition: opacity 0.3s ease;
        }
        .rn-mobile-menu.open .rn-mobile-overlay { opacity: 1; }
        .rn-mobile-panel {
          position: absolute; top: 0; right: 0; width: 300px; max-width: 85vw; height: 100%;
          background: #FFFFFF; transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column; overflow-y: auto;
          box-shadow: -8px 0 30px rgba(0,0,0,0.1);
        }
        .rn-mobile-menu.open .rn-mobile-panel { transform: translateX(0); }
        .rn-mobile-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid var(--border);
        }
        .rn-mobile-close {
          background: none; border: none; cursor: pointer; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; font-size: 20px; color: var(--ink);
        }
        .rn-mobile-close:hover { background: var(--accent-light); }
        .rn-mobile-links {
          flex: 1; display: flex; flex-direction: column; padding: 16px 0;
        }
        .rn-mobile-link {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 24px; font-size: 15px; font-weight: 500;
          color: var(--ink); text-decoration: none; transition: background 0.2s;
          border: none; background: none; cursor: pointer; text-align: left; width: 100%;
        }
        .rn-mobile-link:hover { background: var(--accent-light); }
        .rn-mobile-divider { height: 1px; background: var(--border); margin: 8px 24px; }
        .rn-mobile-wallet {
          margin: 8px 24px; padding: 14px 18px; border-radius: var(--radius-md);
          background: rgba(13, 148, 136, 0.06); display: flex; align-items: center;
          justify-content: space-between;
        }
        .rn-mobile-search { margin: 8px 24px; display: flex; gap: 8px; }
        .rn-mobile-search input {
          flex: 1; padding: 10px 14px; border: 1.5px solid var(--border);
          border-radius: var(--radius-md); font-size: 14px; outline: none; background: var(--bg);
        }
        .rn-mobile-search input:focus { border-color: var(--accent); }
        .rn-mobile-search button {
          padding: 10px 16px; background: var(--accent); color: #FFF;
          border: none; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .rn-nav-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          transition: padding 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rn-mobile-actions { display: none; align-items: center; gap: 8px; }
        .rn-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; color: var(--ink-secondary); transition: background 0.2s;
        }
        .rn-icon-btn:hover { background: var(--accent-light); color: var(--accent); }
        @media (max-width: 768px) {
          .rn-left, .rn-right { display: none !important; }
          .rn-hamburger { display: flex !important; }
          .rn-mobile-actions { display: flex !important; }
          .rn-mobile-menu { display: block; }
        }
        @media (max-width: 480px) {
          .rn-mobile-panel { width: 280px; }
        }
      `}</style>

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isScrolled ? 'rgba(255, 250, 245, 0.94)' : 'rgba(255, 250, 245, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: isScrolled ? '1px solid rgba(240, 230, 224, 0.8)' : '1px solid rgba(240, 230, 224, 0.3)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <nav className="rn-nav-inner" style={{
          padding: isScrolled ? '12px max(16px, 4vw)' : '16px max(16px, 4vw)',
        }}>
          {/* Left Links (desktop) */}
          <div className="rn-left">
            <Link href="/catalog" className="rn-link">Collection</Link>
            <Link href="/lister/login" className="rn-link">List &amp; Earn</Link>
          </div>

          {/* Center — Brand */}
          <Link href="/" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700,
              color: 'var(--ink)', letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>Wardrob</span>
          </Link>

          {/* Right (desktop) */}
          <div className="rn-right">
            {showSearch ? (
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.2s ease' }}>
                <input autoFocus placeholder="Search…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 16px', border: 'none', borderBottom: '2px solid var(--accent)', background: 'transparent', fontSize: '13px', width: '180px', outline: 'none', fontFamily: 'var(--font-sans)', borderRadius: 0 }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
                <button type="button" onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
              </form>
            ) : (
              <button onClick={() => setShowSearch(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--ink-secondary)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Search
              </button>
            )}
            {session ? (
              <>
                {session.role === 'ADMIN' && (
                  <Link href="/admin" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.04em' }}>Admin</Link>
                )}
                <Link href="/profile" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-secondary)', letterSpacing: '0.04em', textDecoration: 'none' }}>Account</Link>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)', background: 'rgba(13, 148, 136, 0.08)', padding: '6px 14px', borderRadius: 'var(--radius-full)', letterSpacing: '0.02em' }}>
                  ₹{Number(session.walletBalance).toLocaleString('en-IN')}
                </span>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>Logout</button>
              </>
            ) : (
              <Link href="/login" style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.06em', textDecoration: 'none', padding: '10px 28px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(212, 86, 122, 0.25)' }}>
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Actions (Search + Account + Hamburger) */}
          <div className="rn-mobile-actions">
            <button className="rn-icon-btn" onClick={() => setMobileMenuOpen(true)} title="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
            <Link href={session ? "/profile" : "/login"} className="rn-icon-btn" title="Account">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
            <button className="rn-hamburger" onClick={() => setMobileMenuOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Slide-Out Menu */}
      <div className={`rn-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="rn-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
        <div className="rn-mobile-panel">
          <div className="rn-mobile-top">
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.1em' }}>WARDROB</span>
            <button className="rn-mobile-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>
          <form onSubmit={handleSearch} className="rn-mobile-search">
            <input placeholder="Search garments…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <button type="submit">Go</button>
          </form>
          <div className="rn-mobile-links">
            <Link href="/catalog" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Collection
            </Link>
            <Link href="/lister/login" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              List &amp; Earn
            </Link>
            <div className="rn-mobile-divider" />
            {session ? (
              <>
                {session.role === 'ADMIN' && (
                  <Link href="/admin" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Admin Panel
                  </Link>
                )}
                <Link href="/profile" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Account
                </Link>
                <div className="rn-mobile-wallet">
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Wallet</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--success)' }}>₹{Number(session.walletBalance).toLocaleString('en-IN')}</span>
                </div>
                <div className="rn-mobile-divider" />
                <button className="rn-mobile-link" onClick={handleLogout} style={{ color: 'var(--alert)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}
                style={{ margin: '8px 24px', background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)', color: '#FFF', borderRadius: 'var(--radius-md)', justifyContent: 'center', fontWeight: 600 }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
