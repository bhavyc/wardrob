import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function RenterFooter() {
  return (
    <footer style={{ background: 'var(--bg-warm)', borderTop: '1px solid var(--border)', marginTop: '0' }}>
      <style>{`
        .ft-grid {
          max-width: 1400px; margin: 0 auto; padding: 72px 40px 56px;
          display: grid; grid-template-columns: 1.5fr repeat(4, 1fr); gap: 48px;
        }
        .ft-bottom {
          border-top: 1px solid var(--border); padding: 20px 40px;
          max-width: 1400px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
        }
        @media (max-width: 1024px) {
          .ft-grid { grid-template-columns: repeat(3, 1fr); gap: 40px; }
          .ft-brand-col { grid-column: 1 / -1; margin-bottom: 24px; text-align: center; }
          .ft-brand-col p { margin: 0 auto !important; }
        }
        @media (max-width: 768px) {
          .ft-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px 16px !important; padding: 40px 20px 24px !important; }
          .ft-brand-col { grid-column: 1 / -1 !important; margin-bottom: 16px !important; text-align: center; }
          .ft-brand-col p { margin: 0 auto 16px !important; }
          .ft-bottom { flex-direction: column; gap: 12px; padding: 24px 20px 36px !important; text-align: center; }
        }
      `}</style>

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
              { label: 'Heritage Sarees', href: '/catalog?category=Saree' },
              { label: 'Bridal Lehengas', href: '/catalog?category=Lehenga' },
              { label: 'Designer Sherwanis', href: '/catalog?category=Kurta' },
              { label: 'Artisanal Stoles', href: '/catalog?category=Shawl' },
            ]
          },
          {
            title: 'Trust & Safety',
            links: [
              { label: 'Sanitization Protocol', href: '#' },
              { label: 'Hub Inspections', href: '#' },
              { label: 'Deposit Guarantee', href: '#' },
              { label: 'Eco Packaging', href: '#' },
            ]
          },
          {
            title: 'For Partners',
            links: [
              { label: 'Lend Garments', href: '/lister/login' },
              { label: 'Hub Operator', href: '#' },
              { label: 'Corporate', href: '#' },
            ]
          },
          {
            title: 'Company',
            links: [
              { label: 'About Us', href: '#' },
              { label: 'Careers', href: '#' },
              { label: 'Contact', href: '#' },
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
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
        </div>
      </div>
    </footer>
  );
}
