'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';

export default function RenterNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
      setMobileSearchOpen(false);
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
        .rn-link:hover { color: var(--accent); }
        .rn-hamburger {
          display: none; background: none; border: none; cursor: pointer;
          width: 38px; height: 38px; align-items: center; justify-content: center;
          border-radius: 10px; transition: background 0.2s;
        }
        .rn-hamburger:hover { background: var(--accent-light); }
        .rn-hamburger svg { stroke: var(--ink); }

        /* Mobile Drawer */
        .rn-mobile-menu {
          display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          z-index: 999; pointer-events: none;
        }
        .rn-mobile-menu.open { pointer-events: all; }
        .rn-mobile-overlay {
          position: absolute; inset: 0;
          background: rgba(15, 15, 26, 0.55);
          backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .rn-mobile-menu.open .rn-mobile-overlay { opacity: 1; }
        .rn-mobile-left { display: none; }
        .rn-mobile-right { display: none; }

        .rn-mobile-panel {
          position: absolute; top: 0; left: 0; width: 320px; max-width: 86vw; height: 100%;
          background: #FFFFFF; transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; flex-direction: column; overflow-y: auto;
          box-shadow: 10px 0 40px rgba(0,0,0,0.15);
        }
        .rn-mobile-menu.open .rn-mobile-panel { transform: translateX(0); }
        
        .rn-mobile-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; border-bottom: 1px solid var(--border);
          background: var(--bg-warm);
        }
        .rn-mobile-close {
          background: rgba(0,0,0,0.05); border: none; cursor: pointer; width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; font-size: 15px; color: var(--ink);
          transition: background 0.2s;
        }
        .rn-mobile-close:hover { background: var(--accent-light); color: var(--accent); }
        
        .rn-mobile-links {
          flex: 1; display: flex; flex-direction: column; padding: 10px 0;
        }
        .rn-mobile-link {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 20px; font-size: 13.5px; font-weight: 500;
          color: var(--ink); text-decoration: none; transition: all 0.2s;
          border: none; background: none; cursor: pointer; text-align: left; width: 100%;
        }
        .rn-mobile-link:active, .rn-mobile-link:hover {
          background: var(--accent-light);
          color: var(--accent);
          padding-left: 24px;
        }
        .rn-mobile-divider { height: 1px; background: var(--border); margin: 6px 20px; }
        
        .rn-mobile-wallet-card {
          margin: 12px 18px; padding: 14px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(212,86,122,0.08) 0%, rgba(255,241,235,0.9) 100%);
          border: 1px solid rgba(212,86,122,0.2);
          display: flex; align-items: center; justify-content: space-between;
        }
        
        .rn-nav-inner {
          max-width: 1400px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          transition: padding 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ═══ MOBILE BOTTOM NAVIGATION BAR ═══ */
        .rn-bottom-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(60px + env(safe-area-inset-bottom, 12px));
          padding-bottom: env(safe-area-inset-bottom, 12px);
          background: rgba(255, 250, 245, 0.94);
          backdrop-filter: blur(24px) saturate(190%);
          border-top: 1px solid rgba(240, 230, 224, 0.85);
          box-shadow: 0 -4px 20px rgba(30, 30, 45, 0.05);
          z-index: 900;
          align-items: center;
          justify-content: space-around;
        }
        .rn-bottom-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 6px 12px;
          border-radius: 12px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .rn-bottom-tab svg {
          stroke: var(--text-muted);
          transition: stroke 0.25s ease, transform 0.25s ease;
        }
        .rn-bottom-tab.active {
          color: var(--accent);
        }
        .rn-bottom-tab.active svg {
          stroke: var(--accent);
          transform: translateY(-2px);
        }
        .rn-bottom-tab.active::after {
          content: '';
          position: absolute;
          bottom: 2px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent);
        }

        .rn-top-strip {
          background: #1E1E2D;
          color: #FFF;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 6px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          border-bottom: 1px solid rgba(212, 86, 122, 0.2);
        }
        .rn-top-strip-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @media (max-width: 768px) {
          .rn-left, .rn-right { display: none !important; }
          .rn-mobile-left { display: flex !important; align-items: center; }
          .rn-mobile-right { display: flex !important; align-items: center; justify-content: flex-end; width: 38px; }
          .rn-hamburger {
            display: flex !important;
            background: transparent !important;
            padding: 0 !important;
            width: 38px !important;
            height: 38px !important;
            justify-content: flex-start !important;
          }
          .rn-mobile-menu { display: block; }
          .rn-bottom-bar { display: flex; }
          .rn-top-strip {
            display: none !important;
          }
        }
      `}</style>

      {/* ━━━ TOP ANNOUNCEMENT STRIP (Desktop Only) ━━━ */}
      <div className="rn-top-strip">
        <div className="rn-top-strip-item">
          <span style={{ color: '#D4567A', fontSize: '10px' }}>✦</span>
          <span>Complimentary 72-Hour Event Buffer on All Rentals</span>
        </div>
        <span className="rn-top-strip-secondary" style={{ opacity: 0.35 }}>•</span>
        <div className="rn-top-strip-item rn-top-strip-secondary">
          <span style={{ color: '#C5A880', fontSize: '10px' }}>✨</span>
          <span>60°C Ozone Sterilized &amp; Hub Inspected Couture</span>
        </div>
      </div>

      {/* Top Sticky Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isScrolled ? 'rgba(255, 250, 245, 0.94)' : 'rgba(255, 250, 245, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: isScrolled ? '1px solid rgba(240, 230, 224, 0.8)' : '1px solid rgba(240, 230, 224, 0.3)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <nav className="rn-nav-inner" style={{
          padding: isScrolled ? '10px 18px' : '14px 18px',
        }}>
          {/* Mobile Left: Minimalist Hamburger Button */}
          <div className="rn-mobile-left">
            <button className="rn-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>

          {/* Left Links (desktop) */}
          <div className="rn-left">
            <Link href="/catalog" className="rn-link">Collection</Link>
            <Link href="/categories" className="rn-link">Categories</Link>
            <Link href="/lister/login" className="rn-link">List &amp; Earn</Link>
          </div>

          {/* Center — Brand */}
          <Link href="/" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <BrandLogo size="md" />
          </Link>

          {/* Right (desktop) */}
          <div className="rn-right">
            {showSearch ? (
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.2s ease' }}>
                <input autoFocus placeholder="Search couture…" value={searchQuery}
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

          {/* Mobile Right Spacer (Balances left hamburger so logo is 100% centered) */}
          <div className="rn-mobile-right">
            {session ? (
              <Link href="/profile" style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #D4567A, #B8405E)',
                color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, textDecoration: 'none',
              }}>
                {session.name ? session.name[0].toUpperCase() : 'U'}
              </Link>
            ) : (
              <div style={{ width: '22px' }} />
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Slide-Out Drawer (Slides in from LEFT) */}
      <div className={`rn-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="rn-mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
        <div className="rn-mobile-panel">
          <div className="rn-mobile-top">
            <BrandLogo size="sm" />
            <button className="rn-mobile-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>

          {/* 🔍 Slim Luxury Search Bar */}
          <form onSubmit={handleSearch} style={{ padding: '8px 16px', background: '#FFFFFF', borderBottom: '1px solid rgba(240, 230, 224, 0.7)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#F9F6F0', borderRadius: '20px',
              padding: '5px 12px', border: '1px solid rgba(240, 230, 224, 0.9)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search couture, lehengas, sarees…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  outline: 'none', fontSize: '12px', color: 'var(--ink)',
                  padding: '2px 0',
                }}
              />
            </div>
          </form>

          {session ? (
            <div className="rn-mobile-wallet-card">
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                  {session.name || 'Member'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--ink-secondary)' }}>{session.email}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Balance</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>
                  ₹{Number(session.walletBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px 20px', background: 'var(--bg-warm)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>Welcome to Wardrob</p>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>Access verified designer couture archives.</p>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)', color: '#FFF',
                  padding: '10px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none', boxShadow: '0 4px 14px rgba(212,86,122,0.25)'
                }}>
                Sign In / Register →
              </Link>
            </div>
          )}

          <div className="rn-mobile-links">
            <Link href="/" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home Storefront
            </Link>
            <Link href="/catalog" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              All Collections
            </Link>
            <Link href="/categories" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
              Browse Categories
            </Link>
            <Link href="/lister/login" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              Lister Studio (Earn)
            </Link>

            <div className="rn-mobile-divider" />

            {session && (
              <>
                <Link href="/profile" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Account &amp; Bookings
                </Link>
                <Link href="/id-verification" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  KYC Verification
                </Link>
                {session.role === 'ADMIN' && (
                  <Link href="/admin" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                    Admin Control Center
                  </Link>
                )}
                <div className="rn-mobile-divider" />
                <button className="rn-mobile-link" onClick={handleLogout} style={{ color: 'var(--alert)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LUXURY FLOATING MOBILE BOTTOM TAB BAR ═══ */}
      <nav className="rn-bottom-bar" aria-label="Mobile Navigation">
        <Link href="/" className={`rn-bottom-tab ${pathname === '/' ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Home</span>
        </Link>

        <Link href="/catalog" className={`rn-bottom-tab ${pathname?.startsWith('/catalog') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>Explore</span>
        </Link>

        <Link href="/categories" className={`rn-bottom-tab ${pathname?.startsWith('/categories') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Curated</span>
        </Link>

        <Link href="/lister/login" className={`rn-bottom-tab ${pathname?.startsWith('/lister') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>Lend</span>
        </Link>

        <Link href={session ? "/profile" : "/login"} className={`rn-bottom-tab ${pathname?.startsWith('/profile') || pathname?.startsWith('/login') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Account</span>
        </Link>
      </nav>
    </>
  );
}

