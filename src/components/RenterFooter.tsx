import Link from 'next/link';

export default function RenterFooter() {
  return (
    <footer style={{ background: 'var(--bg-warm)', borderTop: '1px solid var(--border)', marginTop: '0' }}>
      <style>{`
        .ft-grid {
          max-width: 1400px; margin: 0 auto; padding: 72px 40px 56px;
          display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 48px;
        }
        .ft-bottom {
          border-top: 1px solid var(--border); padding: 20px 40px;
          max-width: 1400px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: center;
        }
        @media (max-width: 1024px) {
          .ft-grid { grid-template-columns: 1fr 1fr; gap: 40px; }
        }
        @media (max-width: 768px) {
          .ft-grid { grid-template-columns: 1fr; gap: 32px; padding: 48px 20px 40px; }
          .ft-bottom { flex-direction: column; gap: 12px; padding: 20px; text-align: center; }
        }
      `}</style>

      {/* Upper Footer */}
      <div className="ft-grid">
        {/* Brand Column */}
        <div>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700,
            color: 'var(--ink)', letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: '16px',
          }}>Wardrob</h2>
          <p style={{
            fontSize: '14px', lineHeight: 1.8, color: 'var(--text-muted)',
            maxWidth: '300px', marginBottom: '24px',
          }}>
            India&apos;s premier peer-to-peer luxury fashion rental. Connecting heritage artisans with modern celebration.
          </p>
          {/* Social Row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['Instagram', 'Twitter', 'Pinterest'].map(social => (
              <a key={social} href="#" style={{
                fontSize: '12px', fontWeight: 500, color: 'var(--ink-secondary)',
                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)', transition: 'all 0.3s ease',
                textDecoration: 'none',
              }}>
                {social}
              </a>
            ))}
          </div>
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
              { label: 'Hub Operator Program', href: '#' },
              { label: 'Corporate Enquiries', href: '#' },
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
