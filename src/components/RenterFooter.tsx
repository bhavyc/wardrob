import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './RenterFooter.css';

export default function RenterFooter() {
  return (
    <footer style={{ background: 'var(--bg-warm)', borderTop: '1px solid var(--border)', marginTop: '0' }}>
      {/* Upper Footer */}
      <div className="ft-grid">
        {/* Brand Column */}
        <div className="ft-brand-col">
          <div style={{ marginBottom: '16px' }}>
            <BrandLogo size="md" align="left" />
          </div>
          <p style={{
            fontSize: '14px', lineHeight: 1.8, color: 'var(--text-muted)',
            maxWidth: '300px', marginBottom: '24px',
          }}>
            India&apos;s premier peer-to-peer luxury fashion rental. Connecting heritage artisans with modern celebration.
          </p>
        </div>

        {/* Link Columns */}
        {[
          {
            title: 'Collections',
            links: [
              { label: 'All Collections', href: '/catalog' },
              { label: 'Bridal & Couture', href: '/catalog?q=bridal' },
              { label: 'Festive & Occasions', href: '/catalog?q=wedding' },
              { label: 'View All Categories', href: '/catalog' },
            ]
          },
          {
            title: 'Trust & Safety',
            links: [
              { label: 'Sanitization Protocol', href: '/catalog' },
              { label: 'Hub Quality Check', href: '/catalog' },
              { label: 'Deposit Guarantee', href: '/catalog' },
              { label: 'Eco Packaging', href: '/catalog' },
            ]
          },
          {
            title: 'Company',
            links: [
              { label: 'About Wardrob', href: '/' },
              { label: 'How It Works', href: '/#how-it-works' },
              { label: 'Contact Us', href: 'mailto:inwardrob@gmail.com' },
            ]
          }
        ].map((col, i) => (
          <div key={i}>
            <h4 style={{
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--accent)',
              marginBottom: '20px',
            }}>{col.title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {col.links.map((link, j) => (
                <Link key={j} href={link.href} className="hover-gold-underline" style={{
                  fontSize: '14px', color: 'var(--ink-secondary)', textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}>{link.label}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lower Bar */}
      <div className="ft-bottom">
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Wardrob Technologies Pvt. Ltd.
        </span>
        <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
