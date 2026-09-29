'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './lister-layout.css';

interface ListerInfo {
  name: string;
  shopName: string;
  initials: string;
  registrationFeePaid: boolean;
  listerStatus: string;
}

export default function ListerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [Lister, setLister] = useState<ListerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Register, login, and mobile capture pages bypass the sidebar entirely
  const isPublicPage = pathname?.startsWith('/lister/register') || pathname?.startsWith('/lister/login') || pathname?.startsWith('/lister/mobile-capture');

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
        const profile = data.listerProfile || data.ListerProfile;
        setLister({
          name,
          shopName: profile?.shopName || 'My Shop',
          initials,
          registrationFeePaid: Boolean(profile?.registrationFeePaid),
          listerStatus: profile?.status || 'PENDING',
        });
      } catch {
        router.replace('/lister/login');
      } finally {
        setLoading(false);
      }
    }
    loadSession();

    const handleUpdate = () => loadSession();
    window.addEventListener('lister-updated', handleUpdate);
    return () => window.removeEventListener('lister-updated', handleUpdate);
  }, [router, isPublicPage]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.replace('/lister/login');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowDeleteModal(false);
        router.replace('/');
      } else {
        setDeleteError(data.error || 'Failed to delete account. Please ensure no outfits are active in rental.');
      }
    } catch {
      setDeleteError('Connection error. Please try again.');
    } finally {
      setDeleting(false);
    }
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
      </div>
    );
  }

  const navLinks = [
    {
      href: '/lister/listings',
      label: 'Listings',
      sublabel: !Lister?.registrationFeePaid ? '🔒 Fee required' : Lister?.listerStatus !== 'APPROVED' ? '⏳ KYC required' : 'Catalog & listings',
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
      label: 'Bookings',
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
      label: 'Payouts',
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
      sublabel: !Lister?.registrationFeePaid ? '⚠️ Pay ₹500 Fee' : Lister?.listerStatus === 'APPROVED' ? 'Verified Boutique' : 'Under Review',
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
      <div className="sd-root">
        <div className={`sd-mobile-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
        
        {/* ──── Sidebar ──── */}
        <aside className={`sd-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {/* Logo & collapse */}
          <div className="sd-sidebar-top">
            {!sidebarCollapsed && (
              <Link href="/" style={{ textDecoration: 'none' }}>
                <BrandLogo size="md" color="#FFFFFF" accentColor="#D4567A" align="left" showSubtitle={true} subtitle="ARTISAN COLLECTIVE" />
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
            <button className="sd-mobile-close-btn" onClick={() => setMobileMenuOpen(false)} title="Close menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="sd-nav">
            <div className="sd-nav-label">Workspace</div>
            {navLinks.map(link => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`sd-nav-link${isActive ? ' active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
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
            <button
              className="sd-logout-btn"
              onClick={() => setShowDeleteModal(true)}
              style={{ color: '#DC2626', marginTop: '4px' }}
              title="Delete Partner Account"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              {!sidebarCollapsed && <span>Delete Account</span>}
            </button>
          </div>
        </aside>

        {/* ──── Main content ──── */}
        <div className={`sd-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
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
                !Lister.registrationFeePaid ? (
                  <Link href="/lister/kyc" style={{
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '100px',
                    background: '#FEF3C7', border: '1px solid #FCD34D',
                    fontSize: '11.5px', fontWeight: 700, color: '#92400E',
                    boxShadow: '0 2px 8px rgba(217,119,6,0.15)',
                  }}>
                    <span>💳</span> Pay ₹500 Fee
                  </Link>
                ) : Lister.listerStatus !== 'APPROVED' ? (
                  <Link href="/lister/kyc" style={{
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '100px',
                    background: '#EFF6FF', border: '1px solid #BFDBFE',
                    fontSize: '11.5px', fontWeight: 700, color: '#1E40AF',
                  }}>
                    <span>⏳</span> KYC Pending
                  </Link>
                ) : (
                  <div className="sd-topbar-badge">
                    <div className="sd-topbar-dot" />
                    {Lister.shopName}
                  </div>
                )
              )}
            </div>
          </header>

          {/* Page content */}
          <div className="sd-page-content" key={pathname}>
            {children}
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              border: '1px solid #F3F4F6'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#DC2626'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', textAlign: 'center', margin: '0 0 8px 0' }}>
                Delete Lister Partner Account?
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                This action is permanent and cannot be undone. All personal identifying data will be removed or anonymized under DPDP Act 2023. You will not be able to delete your account if you have items currently rented out or in transit.
              </p>

              {deleteError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '10px',
                  color: '#991B1B',
                  fontSize: '12px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
