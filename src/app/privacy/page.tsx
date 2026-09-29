import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import BrandLogo from '@/components/BrandLogo';
import './privacy.css';

export const metadata = {
  title: 'Privacy Policy | Wardrob Luxury Fashion Rental',
  description: 'Learn how Wardrob protects your personal information, encrypted KYC documents, transactions, and account privacy under India DPDP Act and international standards.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="privacy-page-container">
      <RenterNavbar />

      <main>
        {/* Hero Section */}
        <section className="privacy-hero-section">
          <div className="privacy-badge-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Transparency &amp; Trust</span>
          </div>
          <h1 className="privacy-title">Privacy &amp; Data Protection Policy</h1>
          <p className="privacy-subtitle">
            At Wardrob, your personal privacy and high-value designer asset security are paramount. This policy details how we collect, safeguard, and respect your personal information across our web platform and mobile applications.
          </p>
          <div className="privacy-effective-date">
            Effective Date: January 1, 2026 • Compliant with DPDP Act (India) &amp; Global Standards
          </div>
        </section>

        {/* Content Card */}
        <article className="privacy-content-card">
          {/* Quick Nav Anchor Chips */}
          <nav className="privacy-quick-nav" aria-label="Table of Contents">
            <a href="#introduction" className="privacy-nav-chip">1. Introduction</a>
            <a href="#information-collected" className="privacy-nav-chip">2. Data We Collect</a>
            <a href="#how-we-use" className="privacy-nav-chip">3. How We Use Data</a>
            <a href="#kyc-encryption" className="privacy-nav-chip">4. KYC &amp; AES-256 Encryption</a>
            <a href="#payments" className="privacy-nav-chip">5. Financial &amp; Payments</a>
            <a href="#sharing" className="privacy-nav-chip">6. Hub &amp; Courier Sharing</a>
            <a href="#account-deletion" className="privacy-nav-chip">7. Account Deletion &amp; Retention</a>
            <a href="#contact" className="privacy-nav-chip">8. Grievance Officer</a>
          </nav>

          {/* Section 1 */}
          <section id="introduction" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">1</span>
              <span>Introduction &amp; Scope</span>
            </h2>
            <p className="privacy-paragraph">
              Wardrob Technologies Pvt. Ltd. (&quot;Wardrob&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates a luxury peer-to-peer fashion rental marketplace connecting discerning renters, verified garment curators/listers, and centralized sanitization inspection hubs.
            </p>
            <p className="privacy-paragraph">
              This Privacy Policy applies to our website (<Link href="/" style={{ color: 'var(--accent, #D4567A)', textDecoration: 'none' }}>wardrob.com</Link>), mobile applications (iOS &amp; Android), mobile capture inspection modules, and automated transactional notifications.
            </p>
          </section>

          {/* Section 2 */}
          <section id="information-collected" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">2</span>
              <span>Information We Collect</span>
            </h2>
            <p className="privacy-paragraph">
              To guarantee seamless garment transit, anti-theft security for high-value designer attire, and verifiable sanitization, we collect:
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Account Credentials:</strong> Full name, verified mobile phone number, and email address used for session verification and delivery coordination.
              </li>
              <li>
                <strong>Delivery &amp; Logistics Details:</strong> Shipping address, apartment/suite number, PIN code, and contact person names for secure door-to-door courier dispatch.
              </li>
              <li>
                <strong>Government Identity &amp; KYC:</strong> Aadhaar number, PAN card number, and identity verification photos for high-value rental security and boutique owner onboarding.
              </li>
              <li>
                <strong>Garment Inspection Imagery:</strong> Live pre-dispatch and post-rental inspection photographs captured by our central hub quality experts and boutique listers.
              </li>
              <li>
                <strong>Device &amp; Telemetry Data:</strong> IP address, device operating system, hardware tokens, and rate-limiting metadata used strictly to defend against automated fraud, unauthorized scraping, and brute-force attacks.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="how-we-use" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">3</span>
              <span>How We Use Your Information</span>
            </h2>
            <p className="privacy-paragraph">
              We process your personal information strictly for legitimate commercial and operational purposes:
            </p>
            <ul className="privacy-list">
              <li>Facilitating rental orders, security deposit management, and return pick-ups.</li>
              <li>Executing 3-leg logistics (Lister to Central Hub, Hub to Renter, Renter back to Hub).</li>
              <li>Conducting garment sanitization, dry-cleaning inspection, and damage dispute resolution.</li>
              <li>Sending transactional notifications, courier tracking links, and digital receipts via In-App Alerts and verified email.</li>
              <li>Protecting owners and users against fraud, lost attire, and identity impersonation.</li>
            </ul>

            <div className="privacy-highlight-box">
              <div className="privacy-highlight-title">Zero Advertising Monetization</div>
              <p className="privacy-highlight-text">
                Wardrob does not sell, rent, monetize, or trade your personal information, phone numbers, or identity documents to third-party advertisers or data brokers under any circumstances.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="kyc-encryption" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">4</span>
              <span>KYC Security &amp; AES-256-GCM Encryption</span>
            </h2>
            <p className="privacy-paragraph">
              Because our catalog features couture garments valued up to ₹5,00,000, verifiable identity checks are mandatory. To protect your privacy:
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Hardware-Derived AES-256 Encryption:</strong> All sensitive identity records (Aadhaar numbers, PAN cards, and bank account numbers) are encrypted at rest using industry-standard <code>AES-256-GCM</code> authenticated cryptographic ciphers with unique initialization vectors (IV).
              </li>
              <li>
                <strong>Role-Based Access Control:</strong> Only vetted, authorized compliance officers can inspect KYC documents during onboarding verification. No regular employee or peer user has access to raw identity credentials.
              </li>
              <li>
                <strong>Mobile Keystore Storage:</strong> Auth tokens on mobile devices are saved in secure hardware keystores (iOS Keychain / Android Keystore) via <code>FlutterSecureStorage</code>.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="payments" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">5</span>
              <span>Financial Data &amp; Payment Gateway</span>
            </h2>
            <p className="privacy-paragraph">
              All payment transactions, including rental charges, refundable security deposits, boutique onboarding fees, and extensions, are processed via <strong>Razorpay</strong>, an RBI-licensed, PCI-DSS Level 1 certified payment gateway.
            </p>
            <p className="privacy-paragraph">
              Wardrob servers <strong>never store or process</strong> raw credit/debit card numbers, CVVs, or Netbanking passwords. Refundable security deposits are escrowed and released back to your original payment method automatically upon successful post-rental hub quality inspection.
            </p>
          </section>

          {/* Section 6 */}
          <section id="sharing" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">6</span>
              <span>Hub &amp; Courier Data Sharing</span>
            </h2>
            <p className="privacy-paragraph">
              To execute your rental experience, limited data is shared strictly on a need-to-know basis:
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Certified Central Cleaning Hubs:</strong> Quality controllers receive order details, garment SKUs, and return timestamps to perform sanitization and defect checks.
              </li>
              <li>
                <strong>Courier &amp; Logistics Partners:</strong> Delivery executives receive recipient name, delivery address, and contact number solely to perform dispatch and pick-up.
              </li>
              <li>
                <strong>Statutory &amp; Legal Authorities:</strong> Disclosed only if compelled by a court of law or lawful enforcement agency in accordance with the laws of India.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="account-deletion" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">7</span>
              <span>Account Deletion &amp; Data Erasure (App Store &amp; Play Store Compliant)</span>
            </h2>
            <p className="privacy-paragraph">
              In full compliance with Google Play Store, Apple App Store, and the Digital Personal Data Protection (DPDP) Act of India, you maintain full control over your digital footprint.
            </p>
            <p className="privacy-paragraph">
              You may initiate account deletion at any time directly through the mobile application (<strong>Profile &gt; Account &amp; Data Privacy &gt; Delete Account</strong>) or by submitting a written request to our concierge.
            </p>
            <ul className="privacy-list">
              <li>
                <strong>Immediate Active Rental Guard:</strong> Accounts cannot be deleted while outfits are actively rented out, in transit, or awaiting security deposit settlement.
              </li>
              <li>
                <strong>Irreversible PII Anonymization:</strong> Once confirmed, all personal identifiable information (name, phone, email, password hash, KYC records, and push tokens) are permanently purged or irreversibly anonymized.
              </li>
              <li>
                <strong>Active Session Termination:</strong> All authentication sessions across all devices are immediately invalidated in real time.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section id="contact" className="privacy-section">
            <h2 className="privacy-section-heading">
              <span className="privacy-section-num">8</span>
              <span>Grievance Officer &amp; Concierge Contact</span>
            </h2>
            <p className="privacy-paragraph">
              In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, the details of our Grievance Redressal Officer are provided below:
            </p>

            <div className="privacy-contact-box">
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink, #1B1722)', marginBottom: '8px' }}>
                Wardrob Privacy &amp; Data Grievance Cell
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--ink-secondary, #6E6877)', lineHeight: 1.8 }}>
                <div><strong>Entity:</strong> Wardrob Technologies Private Limited</div>
                <div><strong>Email:</strong> <a href="mailto:inwardrob@gmail.com" style={{ color: 'var(--accent, #D4567A)', textDecoration: 'none' }}>inwardrob@gmail.com</a></div>
                <div><strong>Support &amp; Concierge:</strong> <a href="mailto:inwardrob@gmail.com" style={{ color: 'var(--accent, #D4567A)', textDecoration: 'none' }}>inwardrob@gmail.com</a></div>
                <div><strong>Response Window:</strong> All privacy and data erasure inquiries are addressed within 48 business hours.</div>
              </div>
            </div>
          </section>
        </article>
      </main>

      <RenterFooter />
    </div>
  );
}
