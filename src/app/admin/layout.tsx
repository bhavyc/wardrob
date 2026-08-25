'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

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
        <style>{`@keyframes adminSpin { to { transform: rotate(360deg); } }`}</style>
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
      href: '/admin/payouts',
      label: 'Lister Payouts',
      sublabel: 'Manual settlement & transfers',
      badge: 'Action',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
      <style>{`
        @keyframes adminSpin { to { transform: rotate(360deg); } }
        @keyframes adminContentIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .adm-root {
          display: flex;
          min-height: 100vh;
          background: #F1F4F9;
        }

        /* ── Sidebar ── */
        .adm-sidebar {
          width: ${sidebarW};
          flex-shrink: 0;
          background: #090D16;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 40;
          overflow: hidden;
        }

        .adm-brand {
          padding: 22px 20px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 72px;
          box-sizing: border-box;
        }
        .adm-brand-logo {
          font-family: 'Cinzel', serif, Georgia;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: #F8FAFC;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }
        .adm-brand-tag {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #C5A880;
          background: rgba(197, 168, 128, 0.12);
          border: 1px solid rgba(197, 168, 128, 0.3);
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        .adm-collapse-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .adm-collapse-btn:hover { color: #C5A880; }

        /* Nav section */
        .adm-nav {
          flex: 1;
          padding: 14px 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .adm-nav-heading {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
          padding: 8px 10px 4px;
          white-space: nowrap;
        }
        .adm-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s;
          white-space: nowrap;
          position: relative;
        }
        .adm-nav-item:hover {
          color: #F8FAFC;
          background: rgba(255, 255, 255, 0.05);
        }
        .adm-nav-item.active {
          color: #C5A880;
          background: rgba(197, 168, 128, 0.1);
          font-weight: 600;
        }
        .adm-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          bottom: 6px;
          width: 3px;
          background: #C5A880;
          border-radius: 0 3px 3px 0;
        }
        .adm-nav-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }
        .adm-nav-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow: hidden;
        }
        .adm-nav-label {
          font-size: 13px;
          line-height: 1.2;
        }
        .adm-nav-sublabel {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.35);
          font-weight: 400;
        }
        .adm-nav-badge {
          margin-left: auto;
          font-size: 9px;
          background: #E67E22;
          color: #FFF;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          text-transform: uppercase;
        }

        /* User footer in sidebar */
        .adm-sidebar-footer {
          padding: 14px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 64px;
          box-sizing: border-box;
        }
        .adm-user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(197, 168, 128, 0.15);
          border: 1.5px solid #C5A880;
          color: #C5A880;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .adm-user-info {
          flex: 1;
          min-width: 0;
        }
        .adm-user-name {
          font-size: 12px;
          font-weight: 600;
          color: #F8FAFC;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .adm-user-role {
          font-size: 10px;
          color: #C5A880;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .adm-logout-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .adm-logout-btn:hover {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
        }

        /* ── Main Layout ── */
        .adm-main-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .adm-topbar {
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          padding: 0 28px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .adm-topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .adm-topbar-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
        }
        .adm-topbar-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: #059669;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .adm-topbar-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          animation: adminPulse 2s infinite;
        }
        @keyframes adminPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .adm-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .adm-topbar-link {
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          transition: all 0.15s;
        }
        .adm-topbar-link:hover {
          color: #0F172A;
          background: #F1F5F9;
          border-color: #CBD5E1;
        }

        .adm-content {
          flex: 1;
          padding: 28px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          animation: adminContentIn 0.3s ease-out;
        }

        @media (max-width: 768px) {
          .adm-sidebar { display: none; }
          .adm-content { padding: 16px; }
          .adm-topbar { padding: 0 16px; }
        }
      `}</style>

      <div className="adm-root">
        {/* Sidebar */}
        <aside className="adm-sidebar">
          {/* Brand header */}
          <div className="adm-brand">
            {!sidebarCollapsed ? (
              <Link href="/admin" className="adm-brand-logo">
                <span>WARDROB</span>
                <span className="adm-brand-tag">P2P RENTAL</span>
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
              <span className="adm-topbar-title">WARDROB Operations Center</span>
              <span className="adm-topbar-badge">
                <span className="adm-topbar-dot" />
                P2P Rental Live
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
