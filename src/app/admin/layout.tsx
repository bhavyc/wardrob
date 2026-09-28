'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './admin-layout.css';

interface AdminInfo {
  name: string;
  email: string;
  initials: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          router.replace('/admin/login');
          return;
        }
        const data = await res.json();
        if (!data.success || !data.user || data.user.role !== 'ADMIN') {
          router.replace('/admin/login');
          return;
        }
        const name = data.user.name || 'Administrator';
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        setAdmin({
          name,
          email: data.user.email,
          initials,
        });
      } catch {
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/admin/login');
  };

  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090D16',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid rgba(197, 168, 128, 0.2)',
              borderTopColor: '#C5A880',
              animation: 'adminSpin 0.7s linear infinite',
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: 'rgba(197, 168, 128, 0.6)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Loading WARDROB Admin
          </span>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      href: '/admin',
      label: 'Dashboard',
      sublabel: 'Rental metrics & overview',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      href: '/admin/bookings',
      label: 'Rental Bookings',
      sublabel: '4-leg movement & live status',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
    },
    {
      href: '/admin/shipments',
      label: 'Logistics Overview',
      sublabel: 'Active & past delivery tracking',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      href: '/admin/refunds',
      label: 'Renter Refunds',
      sublabel: 'Deposit returns (Razorpay/Wallet)',
      badge: 'Review',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 10h18M7 15h1m4 0h1m4 0h1M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
        </svg>
      ),
    },
    {
      href: '/admin/payouts',
      label: 'Lister Payouts',
      sublabel: 'Rental earnings & damages (Bank/UPI)',
      badge: 'Action',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      href: '/admin/transactions',
      label: 'Financial Ledger',
      sublabel: 'Granular audit & money flow',
      badge: 'Live',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <line x1="6" y1="15" x2="10" y2="15" />
          <line x1="14" y1="15" x2="18" y2="15" />
        </svg>
      ),
    },
    {
      href: '/admin/disputes',
      label: 'Damage Disputes',
      sublabel: 'A/B/C inspections & SLA',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      href: '/admin/listings',
      label: 'Rental Listings',
      sublabel: 'Live camera proof & catalog',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
    },
    {
      href: '/admin/listers',
      label: 'Listers & KYC',
      sublabel: 'Owner verification & bank info',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: '/admin/id-verifications',
      label: 'ID Verifications',
      sublabel: 'Identity proof & security',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <circle cx="8" cy="12" r="3" />
          <path d="M14 10h6" />
          <path d="M14 14h6" />
        </svg>
      ),
    },
    {
      href: '/admin/partners',
      label: 'Hub Partners',
      sublabel: 'Cleaning & inspection hubs',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
  ];

  const sidebarW = sidebarCollapsed ? '72px' : '260px';

  return (
    <>
      <div className="adm-root">
        {/* Mobile Backdrop */}
        <div className={`adm-mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />

        {/* Sidebar */}
        <aside className={`adm-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Brand header */}
          <div className="adm-brand">
            {!sidebarCollapsed ? (
              <Link href="/admin" style={{ textDecoration: 'none' }}>
                <BrandLogo size="sm" color="#F8FAFC" accentColor="#C5A880" align="left" showSubtitle={true} subtitle="ADMIN CONTROL CENTER" />
              </Link>
            ) : (
              <Link href="/admin" className="adm-brand-logo" style={{ justifyContent: 'center', width: '100%' }}>
                <span>W</span>
              </Link>
            )}
            <button
              className="adm-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarCollapsed ? (
                  <path d="M9 18l6-6-6-6" />
                ) : (
                  <path d="M15 18l-6-6 6-6" />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="adm-nav">
            {!sidebarCollapsed && (
              <div className="adm-nav-heading">P2P Operations</div>
            )}
            {navLinks.map((link) => {
              const isActive =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`adm-nav-item ${isActive ? 'active' : ''}`}
                  title={sidebarCollapsed ? link.label : undefined}
                >
                  <span className="adm-nav-icon">{link.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <div className="adm-nav-text">
                        <span className="adm-nav-label">{link.label}</span>
                        <span className="adm-nav-sublabel">{link.sublabel}</span>
                      </div>
                      {link.badge && (
                        <span className="adm-nav-badge">{link.badge}</span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Admin User Footer */}
          <div className="adm-sidebar-footer">
            <div className="adm-user-avatar">
              {admin?.initials || 'AD'}
            </div>
            {!sidebarCollapsed && (
              <div className="adm-user-info">
                <div className="adm-user-name">{admin?.name || 'Administrator'}</div>
                <div className="adm-user-role">Platform Admin</div>
              </div>
            )}
            <button
              className="adm-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="adm-main-wrap">
          {/* Top Header */}
          <header className="adm-topbar">
            <div className="adm-topbar-left">
              <button className="adm-mobile-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <span className="adm-topbar-title">WARDROB Admin</span>
              <span className="adm-topbar-badge">
                <span className="adm-topbar-dot" />
                Live
              </span>
            </div>
            <div className="adm-topbar-right">
              {/* <Link href="/" target="_blank" className="adm-topbar-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View Marketplace
              </Link> */}
            </div>
          </header>

          {/* Page Body */}
          <main className="adm-content">{children}</main>
        </div>
      </div>
    </>
  );
}
