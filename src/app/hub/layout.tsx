'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

interface HubInfo {
  name: string;
  initials: string;
}

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hubUser, setHubUser] = useState<HubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Register and login pages bypass the sidebar entirely
  const isPublicPage = pathname?.startsWith('/hub/login');

  useEffect(() => {
    if (isPublicPage) {
      setLoading(false);
      return;
    }
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) { router.replace('/hub/login'); return; }
        const data = await res.json();
        if (!data.success || !data.user || (data.user.role !== 'HUB_PARTNER' && data.user.role !== 'ADMIN')) {
          router.replace('/hub/login');
          return;
        }
        const name = data.user.name || 'Hub Partner';
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        setHubUser({
          name,
          initials,
        });
      } catch {
        router.replace('/hub/login');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [router, isPublicPage, pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/hub/login');
  };

  if (isPublicPage) return <>{children}</>;

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(148,163,184,0.2)',
            borderTopColor: '#94A3B8',
            animation: 'dashboardSpin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Loading Hub Console
          </span>
        </div>
        <style>{`@keyframes dashboardSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const navLinks = [
    {
      href: '/hub',
      label: 'Dashboard',
      sublabel: 'Overview & KPIs',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      href: '/hub/shipments',
      label: 'Deliveries',
      sublabel: 'Logistics tracking',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      href: '/hub/inspections',
      label: 'Inspections',
      sublabel: 'Intake & Returns',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    }
  ];

  const sidebarW = sidebarCollapsed ? '72px' : '260px';

  return (
    <>
      <style>{`
        @keyframes dashboardSpin { to { transform: rotate(360deg); } }
        @keyframes contentFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hub-root {
          display: flex;
          min-height: 100vh;
          background: #F1F5F9;
        }

        /* ── Sidebar ── */
        .hub-sidebar {
          width: ${sidebarW};
          flex-shrink: 0;
          position: fixed; left: 0; top: 0; bottom: 0;
          background: #0F172A;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.05);
          transition: width 0.3s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
          z-index: 100;
        }

        .hub-sidebar-top {
          padding: ${sidebarCollapsed ? '24px 16px' : '28px 24px 20px'};
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: padding 0.3s ease;
          display: flex; align-items: center;
          justify-content: ${sidebarCollapsed ? 'center' : 'space-between'};
        }

        .hub-logo-name {
          font-family: var(--font-inter), sans-serif;
          font-size: 20px; font-weight: 800; letter-spacing: 0.1em;
          color: #FFFFFF; line-height: 1; white-space: nowrap;
          text-decoration: none;
        }
        .hub-logo-sub {
          font-size: 8px; letter-spacing: 0.25em; color: #94A3B8;
          font-weight: 700; text-transform: uppercase; margin-top: 5px;
          display: block; white-space: nowrap;
        }

        .hub-collapse-btn {
          background: none; border: none; cursor: pointer;
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.35); flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .hub-collapse-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }

        .hub-nav {
          flex: 1; padding: ${sidebarCollapsed ? '16px 8px' : '16px 12px'};
          display: flex; flex-direction: column; gap: 4px;
          transition: padding 0.3s ease; overflow-y: auto;
        }

        .hub-nav-label {
          font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(148,163,184,0.45);
          padding: ${sidebarCollapsed ? '12px 0 6px' : '12px 12px 6px'};
          white-space: nowrap; overflow: hidden;
          display: ${sidebarCollapsed ? 'none' : 'block'};
        }

        .hub-nav-link {
          display: flex; align-items: center;
          gap: 12px; text-decoration: none;
          padding: ${sidebarCollapsed ? '10px 0' : '11px 12px'};
          border-radius: 10px;
          justify-content: ${sidebarCollapsed ? 'center' : 'flex-start'};
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .hub-nav-link::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; border-radius: 0 3px 3px 0;
          background: #3B82F6;
          transform: scaleY(0); transition: transform 0.25s ease;
        }
        .hub-nav-link.active { background: rgba(59,130,246,0.1); }
        .hub-nav-link.active::before { transform: scaleY(1); }
        .hub-nav-link.active .hub-nav-icon { color: #3B82F6; }
        .hub-nav-link.active .hub-nav-text { color: #FFFFFF; }
        .hub-nav-link:not(.active):hover { background: rgba(255,255,255,0.04); }
        .hub-nav-link:not(.active):hover .hub-nav-icon { color: rgba(255,255,255,0.7); }
        .hub-nav-link:not(.active):hover .hub-nav-text { color: rgba(255,255,255,0.7); }

        .hub-nav-icon { color: rgba(255,255,255,0.38); transition: color 0.25s ease; flex-shrink: 0; }
        .hub-nav-text {
          color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 600;
          letter-spacing: 0.01em; transition: color 0.25s ease; white-space: nowrap;
        }
        .hub-nav-subtext {
          color: rgba(255,255,255,0.3); font-size: 10px; line-height: 1;
          display: ${sidebarCollapsed ? 'none' : 'block'};
        }
        .hub-nav-texts { display: flex; flex-direction: column; gap: 3px; }

        .hub-bottom {
          padding: ${sidebarCollapsed ? '12px 8px' : '12px 12px 20px'};
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column; gap: 8px;
          transition: padding 0.3s ease;
        }

        .hub-user-card {
          display: flex; align-items: center; gap: 10px;
          padding: ${sidebarCollapsed ? '8px 0' : '10px 12px'};
          border-radius: 10px; background: rgba(255,255,255,0.04);
          justify-content: ${sidebarCollapsed ? 'center' : 'flex-start'};
        }
        .hub-avatar {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #1E293B, #0F172A);
          display: flex; align-items: center; justify-content: center;
          color: #94A3B8; font-size: 13px; font-weight: 700;
          border: 1px solid rgba(148,163,184,0.2); flex-shrink: 0;
        }
        .hub-user-info { overflow: hidden; display: ${sidebarCollapsed ? 'none' : 'block'}; }
        .hub-user-name {
          font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.8);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .hub-logout-btn {
          display: flex; align-items: center; gap: 10px;
          background: none; border: none; cursor: pointer;
          padding: ${sidebarCollapsed ? '10px 0' : '10px 12px'};
          border-radius: 10px; width: 100%;
          justify-content: ${sidebarCollapsed ? 'center' : 'flex-start'};
          color: rgba(255,255,255,0.3); font-size: 12px; font-weight: 600;
          letter-spacing: 0.04em; transition: all 0.25s ease;
        }
        .hub-logout-btn:hover:not(:disabled) {
          background: rgba(239,68,68,0.1); color: #F87171;
        }

        /* ── Content area ── */
        .hub-content {
          margin-left: ${sidebarW};
          flex: 1; min-height: 100vh;
          display: flex; flex-direction: column;
          transition: margin-left 0.3s cubic-bezier(0.16,1,0.3,1);
          animation: contentFadeIn 0.4s ease both;
        }

        /* ── Top bar ── */
        .hub-topbar {
          height: 64px; background: rgba(255,255,255,0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(15,23,42,0.08);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; position: sticky; top: 0; z-index: 50;
        }
        .hub-breadcrumb {
          font-size: 12px; color: #64748B; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
          display: flex; align-items: center; gap: 8px;
        }
        .hub-breadcrumb-sep { color: #CBD5E1; }
        .hub-topbar-actions { display: flex; align-items: center; gap: 12px; }
        .hub-topbar-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 100px;
          background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
          font-size: 11px; font-weight: 700; color: #1D4ED8; letter-spacing: 0.04em;
        }
        .hub-topbar-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #3B82F6; animation: dashboardPulse 2s infinite;
        }
        @keyframes dashboardPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .hub-page-content {
          flex: 1; padding: 36px 40px 60px;
        }

        .hub-mobile-overlay { display: none; }
        .hub-mobile-hamburger { display: none; }

        @media (max-width: 768px) {
          .hub-sidebar {
            width: 260px !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .hub-sidebar.mobile-open { transform: translateX(0); }
          
          .hub-content { margin-left: 0; }
          .hub-topbar { padding: 0 16px; }
          .hub-page-content { padding: 24px 16px; }
          
          .hub-mobile-hamburger {
            display: block; background: none; border: none; cursor: pointer;
            padding: 8px; margin-right: 12px;
          }
          .hub-collapse-btn { display: none; }
          .hub-nav-label, .hub-nav-subtext, .hub-user-info, .hub-logout-btn span { display: block !important; }

          .hub-mobile-overlay {
            display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 90;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
          }
          .hub-mobile-overlay.mobile-open { opacity: 1; pointer-events: auto; }
        }
      `}</style>

      <div className="hub-root">
        <div className={`hub-mobile-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
        
        {/* ──── Sidebar ──── */}
        <aside className={`hub-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Logo & collapse */}
          <div className="hub-sidebar-top">
            {!sidebarCollapsed && (
              <Link href="/hub" style={{ textDecoration: 'none' }}>
                <BrandLogo size="md" color="#F8FAFC" accentColor="#94A3B8" align="left" showSubtitle={true} subtitle="QUALITY CONTROL HUB" />
              </Link>
            )}
            {sidebarCollapsed && (
              <Link href="/hub" style={{ textDecoration: 'none', fontSize: 20, color: '#94A3B8', fontFamily: 'var(--font-inter)', fontWeight: 800 }}>W</Link>
            )}
            <button className="hub-collapse-btn" onClick={() => setSidebarCollapsed(c => !c)} title="Toggle sidebar">
              {sidebarCollapsed
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18L15 12 9 6" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18L9 12 15 6" /></svg>
              }
            </button>
          </div>

          {/* Nav */}
          <nav className="hub-nav">
            <div className="hub-nav-label">Operations</div>
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={`hub-nav-link${isActive ? ' active' : ''}`}>
                  <span className="hub-nav-icon">{link.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="hub-nav-texts">
                      <span className="hub-nav-text">{link.label}</span>
                      <span className="hub-nav-subtext">{link.sublabel}</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="hub-bottom">
            {hubUser && (
              <div className="hub-user-card">
                <div className="hub-avatar">{hubUser.initials}</div>
                <div className="hub-user-info">
                  <div className="hub-user-name">{hubUser.name}</div>
                </div>
              </div>
            )}
            <button className="hub-logout-btn" onClick={handleLogout} disabled={loggingOut}>
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
        <div className="hub-content">
          <header className="hub-topbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button className="hub-mobile-hamburger" onClick={() => setMobileMenuOpen(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div className="hub-breadcrumb">
                <span>Wardrob Hub</span>
                <span className="hub-breadcrumb-sep">/</span>
                <span style={{ color: '#0F172A' }}>
                  {pathname === '/hub' ? 'Dashboard'
                    : pathname === '/hub/inspections' ? 'Inspections'
                    : 'Hub'}
                </span>
              </div>
            </div>
            <div className="hub-topbar-actions">
              {hubUser && (
                <div className="hub-topbar-badge">
                  <div className="hub-topbar-dot" />
                  Hub Center
                </div>
              )}
            </div>
          </header>
          
          <main className="hub-page-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
