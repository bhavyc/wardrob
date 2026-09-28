'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './hub-layout.css';

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

  // Register, login, and mobile camera capture pages bypass the sidebar and auth check entirely
  const isPublicPage = pathname?.startsWith('/hub/login') || pathname?.startsWith('/hub/mobile-capture');

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
    } catch { }
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
      <div className="hub-root">
        <div className={`hub-mobile-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

        {/* ──── Sidebar ──── */}
        <aside className={`hub-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
                <Link
                  key={link.href}
                  href={link.href}
                  className={`hub-nav-link${isActive ? ' active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
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
        <div className={`hub-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
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
                    : pathname === '/hub/inspections' ? 'Inspections & Quality'
                      : pathname === '/hub/shipments' ? 'Deliveries & Logistics'
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
