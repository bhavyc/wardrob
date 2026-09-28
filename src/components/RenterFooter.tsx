import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import './RenterFooter.css';

export default function RenterFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="ft-minimal-wrap">
      <div className="ft-minimal-container">
        {/* Brand & Clean Tagline */}
        <div className="ft-minimal-brand">
          <BrandLogo size="md" align="left" />
          <p className="ft-minimal-tagline">
            India&apos;s premier peer-to-peer luxury fashion rental.
          </p>
        </div>

        {/* Real Essential Links Only - No Hardcoded Collections */}
        <nav className="ft-minimal-nav" aria-label="Footer navigation">
          <Link href="/catalog" className="ft-minimal-link">
            Explore All Couture
          </Link>
          <Link href="/lister/login" className="ft-minimal-link">
            List Your Outfits
          </Link>
          <Link href="/hub/login" className="ft-minimal-link">
            Central Hub Portal
          </Link>
          <Link href="/profile" className="ft-minimal-link">
            My Wardrobe
          </Link>
        </nav>
      </div>

      {/* Sleek Lower Bar */}
      <div className="ft-minimal-bottom">
        <span>© {currentYear} Wardrob Technologies Pvt. Ltd. All rights reserved.</span>
        <div className="ft-minimal-legal">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
      </div>
    </footer>
  );
}
