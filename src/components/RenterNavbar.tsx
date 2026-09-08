'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import './RenterNavbar.css';

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
      .catch(() => { });

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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                </button>
                <button type="button" onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
              </form>
            ) : (
              <button onClick={() => setShowSearch(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--ink-secondary)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Home Storefront
            </Link>
            <Link href="/catalog" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
              All Collections
            </Link>
            <Link href="/categories" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h7" /></svg>
              Browse Categories
            </Link>
            <Link href="/lister/login" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
              Lister Studio (Earn)
            </Link>

            <div className="rn-mobile-divider" />

            {session && (
              <>
                <Link href="/profile" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  My Account &amp; Bookings
                </Link>
                <Link href="/id-verification" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  KYC Verification
                </Link>
                {session.role === 'ADMIN' && (
                  <Link href="/admin" className="rn-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /></svg>
                    Admin Control Center
                  </Link>
                )}
                <div className="rn-mobile-divider" />
                <button className="rn-mobile-link" onClick={handleLogout} style={{ color: 'var(--alert)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
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
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Home</span>
        </Link>

        <Link href="/catalog" className={`rn-bottom-tab ${pathname?.startsWith('/catalog') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Explore</span>
        </Link>

        <Link href="/categories" className={`rn-bottom-tab ${pathname?.startsWith('/categories') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Curated</span>
        </Link>

        <Link href="/lister/login" className={`rn-bottom-tab ${pathname?.startsWith('/lister') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>Lend</span>
        </Link>

        <Link href={session ? "/profile" : "/login"} className={`rn-bottom-tab ${pathname?.startsWith('/profile') || pathname?.startsWith('/login') ? 'active' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Account</span>
        </Link>
      </nav>
    </>
  );
}

