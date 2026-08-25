'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface ListerInfo {
  name: string;
  shopName: string;
  initials: string;
}

export default function ListerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [Lister, setLister] = useState<ListerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Register and login pages bypass the sidebar entirely
  const isPublicPage = pathname?.startsWith('/lister/register') || pathname?.startsWith('/lister/login');

  useEffect(() => {
    if (isPublicPage) {
      setLoading(false);
      return;
    }
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) { router.replace('/lister/login'); return; }
        const data = await res.json();
        if (!data.success || !data.user || data.user.role !== 'LISTER') {
          router.replace('/lister/login');
          return;
        }
        const name = data.user.name || 'Artisan';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        setLister({
          name,
          shopName: data.ListerProfile?.shopName || 'My Shop',
          initials,
        });
      } catch {
        router.replace('/lister/login');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [router, isPublicPage]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/lister/login');
  };

  if (isPublicPage) return <>{children}</>;


  if (loading) {
    return (
      <div style={{
        display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
        background: '#0D1A14',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(197,168,128,0.2)',
            borderTopColor: '#C5A880',
            animation: 'dashboardSpin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 12, color: 'rgba(197,168,128,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Loading workspace
          </span>
        </div>
        <style>{`@keyframes dashboardSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const navLinks = [
    {
      href: '/lister/listings',
      label: 'listings',
      sublabel: 'Catalog & listings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="3" width="7" height="7" rx="1.5" />
          <rect x="15" y="3" width="7" height="7" rx="1.5" />
          <rect x="2" y="14" width="7" height="7" rx="1.5" />
          <rect x="15" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      href: '/lister/bookings',
      label: 'bookings',
      sublabel: 'Shipments & tracking',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 12H19" /><path d="M12 5L19 12L12 19" />
          <rect x="2" y="2" width="20" height="20" rx="3" opacity="0.25" />
        </svg>
      ),
    },
    {
      href: '/lister/payouts',
      label: 'payouts & Payouts',
      sublabel: 'Earnings & settlements',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <path d="M16 14h2" />
        </svg>
      ),
    },
    {
      href: '/lister/kyc',
      label: 'KYC Status',
      sublabel: 'Identity & bank verification',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  const sidebarW = sidebarCollapsed ? '72px' : '260px';

  return (
    <>
      <style>{`
        @keyframes dashboardSpin { to { transform: rotate(360deg); } }
        @keyframes sidebarFadeIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes contentFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sd-root {
          display: flex;
          min-height: 100vh;
          background: #FFFAF5;
        }

        /* ── Sidebar ── */
        .sd-sidebar {
          width: ${sidebarW};
          flex-shrink: 0;
          position: fixed; left: 0; top: 0; bottom: 0;
          background: #1E1E2D;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(212,86,122,0.08);
          transition: width 0.3s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
          z-index: 100;
        }

        .sd-sidebar-top {
          padding: ${sidebarCollapsed ? '24px 16px' : '28px 24px 20px'};
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: padding 0.3s ease;
          display: flex; align-items: center;
          justify-content: ${sidebarCollapsed ? 'center' : 'space-between'};
        }

        .sd-logo-name {
          font-family: var(--font-serif);
          font-size: 22px; font-weight: 700; letter-spacing: 0.18em;
          color: #FFFFFF; line-height: 1; white-space: nowrap;
          text-decoration: none; text-transform: uppercase;
        }
        .sd-logo-sub {
          font-size: 7px; letter-spacing: 0.4em; color: #D4567A;
          font-weight: 700; text-transform: uppercase; margin-top: 5px;
          display: block; white-space: nowrap;
        }

        .sd-collapse-btn {
          background: none; border: none; cursor: pointer;
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.35); flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .sd-collapse-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }

        .sd-nav {
          flex: 1; padding: ${sidebarCollapsed ? '16px 8px' : '16px 12px'};
          display: flex; flex-direction: column; gap: 4px;
          transition: padding 0.3s ease; overflow-y: auto;
        }

        .sd-nav-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(212,86,122,0.45);
          padding: ${sidebarCollapsed ? '12px 0 6px' : '12px 12px 6px'};
          white-space: nowrap; overflow: hidden;
          display: ${sidebarCollapsed ? 'none' : 'block'};
        }

        .sd-nav-link {
          display: flex; align-items: center;
          gap: 12px; text-decoration: none;
          padding: ${sidebarCollapsed ? '10px 0' : '11px 12px'};
          border-radius: 10px;
          justify-content: ${sidebarCollapsed ? 'center' : 'flex-start'};
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .sd-nav-link::before {
          content: '';
          position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; border-radius: 0 3px 3px 0;
          background: #D4567A;
          transform: scaleY(0); transition: transform 0.25s ease;
        }
        .sd-nav-link.active { background: rgba(212,86,122,0.1); }
        .sd-nav-link.active::before { transform: scaleY(1); }
        .sd-nav-link.active .sd-nav-icon { color: #D4567A; }
        .sd-nav-link.active .sd-nav-text { color: #FFFFFF; }
        .sd-nav-link:not(.active):hover { background: rgba(255,255,255,0.04); }
        .sd-nav-link:not(.active):hover .sd-nav-icon { color: rgba(255,255,255,0.7); }
        .sd-nav-link:not(.active):hover .sd-nav-text { color: rgba(255,255,255,0.7); }

        .sd-nav-icon { color: rgba(255,255,255,0.38); transition: color 0.25s ease; flex-shrink: 0; }
        .sd-nav-text {
          color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 600;
          letter-spacing: 0.01em; transition: color 0.25s ease; white-space: nowrap;
        }
        .sd-nav-subtext {
          color: rgba(255,255,255,0.22); font-size: 10px; line-height: 1;
          display: ${sidebarCollapsed ? 'none' : 'block'};
        }
        .sd-nav-texts { display: flex; flex-direction: column; gap: 3px; }

        .sd-bottom {
          padding: ${sidebarCollapsed ? '12px 8px' : '12px 12px 20px'};
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column; gap: 8px;
          transition: padding 0.3s ease;
        }

        .sd-Lister-card {
          display: flex; align-items: center; gap: 10px;
          padding: ${sidebarCollapsed ? '8px 0' : '10px 12px'};
          border-radius: 10px; background: rgba(255,255,255,0.04);
          justify-content: ${sidebarCollapsed ? 'center' : 'flex-start'};
        }
        .sd-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #D4567A, #B8405E);
          display: flex; align-items: center; justify-content: center;
          color: #FFFFFF; font-size: 13px; font-weight: 700;
          border: 1px solid rgba(212,86,122,0.3); flex-shrink: 0;
        }
        .sd-Lister-info { overflow: hidden; display: ${sidebarCollapsed ? 'none' : 'block'}; }
        .sd-Lister-name {
          font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.8);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sd-Lister-shop {
          font-size: 10px; color: rgba(212,86,122,0.7);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .sd-logout-btn {
          display: flex; align-items: center; gap: 10px;
          background: none; border: none; cursor: pointer;
          padding: ${sidebarCollapsed ? '10px 0' : '10px 12px'};
          border-radius: 10px; width: 100%;
          justify-content: ${sidebarCollapsed ? 'center' : 'flex-start'};
          color: rgba(255,255,255,0.3); font-size: 12px; font-weight: 600;
          letter-spacing: 0.04em; transition: all 0.25s ease;
        }
        .sd-logout-btn:hover:not(:disabled) {
          background: rgba(229,62,62,0.1); color: #FC8181;
        }
        .sd-logout-btn:disabled { opacity: 0.5; cursor: default; }

        /* ── Content area ── */
        .sd-content {
          margin-left: ${sidebarW};
          flex: 1; min-height: 100vh;
          display: flex; flex-direction: column;
          transition: margin-left 0.3s cubic-bezier(0.16,1,0.3,1);
          animation: contentFadeIn 0.4s ease both;
        }

        /* ── Top bar ── */
        .sd-topbar {
          height: 60px; background: rgba(255, 250, 245, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(240,230,224,0.8);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; position: sticky; top: 0; z-index: 50;
        }
        .sd-breadcrumb {
          font-size: 12px; color: var(--text-muted); font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
          display: flex; align-items: center; gap: 8px;
        }
        .sd-breadcrumb-sep { color: var(--border-strong); }
        .sd-topbar-actions { display: flex; align-items: center; gap: 12px; }
        .sd-topbar-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          background: rgba(212,86,122,0.08); border: 1px solid rgba(212,86,122,0.2);
          font-size: 11px; font-weight: 700; color: #D4567A; letter-spacing: 0.04em;
        }
        .sd-topbar-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #D4567A; animation: dashboardPulse 2s infinite;
        }
        @keyframes dashboardPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .sd-page-content {
          flex: 1; padding: 36px 40px 60px;
        }

        .sd-mobile-overlay {
          display: none;
        }

        .sd-mobile-hamburger {
          display: none;
        }

        @media (max-width: 768px) {
          .sd-sidebar {
            width: 260px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sd-sidebar.mobile-open {
            transform: translateX(0);
          }
          
          .sd-content {
            margin-left: 0;
          }

          .sd-topbar {
            padding: 0 16px;
          }

          .sd-page-content {
            padding: 24px 16px;
          }
          
          .sd-mobile-hamburger {
            display: block;
            background: none; border: none; cursor: pointer;
            padding: 8px; margin-right: 12px;
          }

          .sd-collapse-btn {
            display: none;
          }

          .sd-nav-label, .sd-nav-subtext, .sd-Lister-info, .sd-logout-btn span {
            display: block !important;
          }

          .sd-mobile-overlay {
            display: block;
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 90;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
          }
          .sd-mobile-overlay.mobile-open {
            opacity: 1; pointer-events: auto;
          }
        }
      `}</style>

      <div className="sd-root">
        <div className={`sd-mobile-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
        
        {/* ──── Sidebar ──── */}
        <aside className={`sd-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Logo & collapse */}
          <div className="sd-sidebar-top">
            {!sidebarCollapsed && (
              <Link href="/" style={{ textDecoration: 'none' }}>
                <span className="sd-logo-name">WARDROB</span>
                <span className="sd-logo-sub">Artisan Collective</span>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link href="/" style={{ textDecoration: 'none', fontSize: 20, color: '#D4567A', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>W</Link>
            )}
            <button className="sd-collapse-btn" onClick={() => setSidebarCollapsed(c => !c)} title="Toggle sidebar">
              {sidebarCollapsed
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18L15 12 9 6" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18L9 12 15 6" /></svg>
              }
            </button>
          </div>

          {/* Nav */}
          <nav className="sd-nav">
            <div className="sd-nav-label">Workspace</div>
            {navLinks.map(link => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link key={link.href} href={link.href} className={`sd-nav-link${isActive ? ' active' : ''}`}>
                  <span className="sd-nav-icon">{link.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="sd-nav-texts">
                      <span className="sd-nav-text">{link.label}</span>
                      <span className="sd-nav-subtext">{link.sublabel}</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: Lister info + logout */}
          <div className="sd-bottom">
            {Lister && (
              <div className="sd-Lister-card">
                <div className="sd-avatar">{Lister.initials}</div>
                <div className="sd-Lister-info">
                  <div className="sd-Lister-name">{Lister.name}</div>
                  <div className="sd-Lister-shop">✦ {Lister.shopName}</div>
                </div>
              </div>
            )}
            <button className="sd-logout-btn" onClick={handleLogout} disabled={loggingOut}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!sidebarCollapsed && <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>}
            </button>
          </div>
        </aside>

        {/* ──── Main content ──── */}
        <div className="sd-content">
          {/* Top bar */}
          <header className="sd-topbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="sd-mobile-hamburger" onClick={() => setMobileMenuOpen(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E1E2D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div className="sd-breadcrumb">
              <span>Wardrob</span>
              <span className="sd-breadcrumb-sep">/</span>
              <span style={{ color: 'var(--ink)' }}>
                {pathname === '/lister/listings' ? 'listings'
                  : pathname === '/lister/bookings' ? 'bookings'
                  : pathname === '/lister/kyc' ? 'KYC Status'
                  : 'Lister'}
              </span>
            </div>
            </div>
            <div className="sd-topbar-actions">
              {Lister && (
                <div className="sd-topbar-badge">
                  <div className="sd-topbar-dot" />
                  {Lister.shopName}
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <div className="sd-page-content" key={pathname}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
