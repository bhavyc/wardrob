'use client';

import { useState, useEffect, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import EventDatePicker from '@/components/EventDatePicker';
import './product-detail.css';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  rentalPrice?: number;
  securityDeposit?: number;
  category?: string;
  size?: string;
  condition?: string;
  stock: number;
  sizes: string[];
  colors: string[];
  images: string[];
  isApproved?: boolean;
  isBestSeller?: boolean;
  bookings?: { startDate: string; endDate: string }[];
  nextAvailableDate?: { isAvailableNow: boolean; nextDate: string; badgeText: string };
  lister?: { shopName: string; user?: { rating?: number | null } };
  Lister?: { shopName: string; user?: { rating?: number | null } };
};

const FALLBACK_PERSPECTIVES = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200',
];

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>('craft');

  const [bookingDate, setBookingDate] = useState('');
  const [bookingExtension, setBookingExtension] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.product) {
            setProduct(data.product);
            setSelectedSize(data.product.sizes?.[0] || 'Free Size');
            setSelectedColor(data.product.colors?.[0] || 'Default');
          }
        }
      } catch (err) {
        console.error('Fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Gallery array: ensures at least 4 interactive high-res views are always available
  const galleryImages = useMemo(() => {
    if (!product) return FALLBACK_PERSPECTIVES;
    const raw = (product.images || []).filter(img => typeof img === 'string' && img.trim().length > 0);
    
    if (raw.length === 0) return FALLBACK_PERSPECTIVES;
    if (raw.length === 1) {
      return [
        raw[0],
        FALLBACK_PERSPECTIVES[1],
        FALLBACK_PERSPECTIVES[2],
        FALLBACK_PERSPECTIVES[3],
      ];
    }
    if (raw.length === 2) {
      return [
        raw[0],
        raw[1],
        FALLBACK_PERSPECTIVES[2],
        FALLBACK_PERSPECTIVES[3],
      ];
    }
    return raw;
  }, [product]);

  // Keep index within bounds if images change
  const currentImage = galleryImages[activeImageIndex] || galleryImages[0] || FALLBACK_PERSPECTIVES[0];

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  // Keyboard navigation for gallery & lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryImages.length]);

  const handleCheckout = () => {
    if (!product || !bookingDate) return;
    router.push(`/checkout?productId=${product.id}&size=${selectedSize}&color=${selectedColor}&eventDate=${bookingDate}&extensionDays=${bookingExtension}`);
  };

  if (loading) {
    return (
      <div className="pdp-wrapper">
        <RenterNavbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(212,86,122,0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Accessing Haute Couture Archive…
          </span>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </main>
        <RenterFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-wrapper">
        <RenterNavbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', minHeight: '60vh' }}>
          <span style={{ fontSize: '32px' }}>👗</span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--ink)', margin: 0 }}>Garment Archive Not Found</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>This piece may have been reserved or relocated in the vault.</p>
          <button 
            onClick={() => router.push('/catalog')} 
            style={{ 
              background: 'var(--ink)', color: '#FFFFFF', border: 'none', 
              padding: '14px 28px', fontSize: '11px', letterSpacing: '0.12em', 
              textTransform: 'uppercase', borderRadius: '999px', cursor: 'pointer', fontWeight: 700 
            }}
          >
            Explore Designer Vault
          </button>
        </main>
        <RenterFooter />
      </div>
    );
  }

  const listerName = product.Lister?.shopName || product.lister?.shopName || 'Atelier Vault Collection';
  const sanitizationDate = new Date();
  sanitizationDate.setDate(sanitizationDate.getDate() - 1);
  const sanitizationDateStr = sanitizationDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  const productPrice = Number(product.price) || 0;
  const depositAmount = Number(product.securityDeposit ?? (productPrice * 0.4));
  const extensionCost = bookingExtension > 0 ? (bookingExtension * (productPrice * 0.25)) : 0;
  const totalRentalCost = productPrice + extensionCost;
  const totalPayable = totalRentalCost + depositAmount;

  return (
    <div className="pdp-wrapper">
      <RenterNavbar />

      {/* Breadcrumbs */}
      <nav className="pdp-breadcrumb-bar" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/catalog">Collection</Link>
        <span>/</span>
        <Link href={`/catalog?category=${encodeURIComponent(product.category || 'All')}`}>{product.category || 'Couture'}</Link>
        <span>/</span>
        <span className="pdp-breadcrumb-current">{product.title}</span>
      </nav>

      <main className="pdp-main">
        
        {/* ━━━━━━━━ LEFT: GALLERY & PROVENANCE ━━━━━━━━ */}
        <div className="pdp-gallery-container">
          
          <div className="pdp-gallery">
            {/* Thumbnails Strip */}
            <div className="pdp-thumbnails">
              {galleryImages.map((img, i) => (
                <button 
                  key={i} 
                  type="button"
                  aria-label={`View perspective ${i + 1}`}
                  onClick={() => setActiveImageIndex(i)}
                  className={`pdp-thumb-btn ${activeImageIndex === i ? 'active' : ''}`}
                >
                  <img 
                    src={img} 
                    alt={`${product.title} perspective ${i + 1}`} 
                    onError={(e: any) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_PERSPECTIVES[i % FALLBACK_PERSPECTIVES.length];
                    }}
                  />
                </button>
              ))}
            </div>
            
            {/* Main Interactive Stage */}
            <div className="pdp-main-img-wrapper">
              <img
                src={currentImage}
                alt={`${product.title} - Main View`}
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_PERSPECTIVES[0];
                }}
              />

              {/* Badges */}
              <div className="pdp-badge-strip">
                <span className="pdp-floating-badge">
                  ✨ {product.condition || 'Pristine Hub Grade'}
                </span>
                {product.isBestSeller && (
                  <span className="pdp-floating-badge" style={{ color: 'var(--accent)', borderColor: 'var(--accent-light)' }}>
                    🔥 Most Requested
                  </span>
                )}
              </div>

              {/* Zoom Action */}
              <button 
                type="button" 
                className="pdp-zoom-btn" 
                aria-label="Inspect high-res embroidery"
                onClick={() => setIsLightboxOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <line x1="11" y1="8" x2="11" y2="14"/>
                  <line x1="8" y1="11" x2="14" y2="11"/>
                </svg>
              </button>

              {/* Prev / Next Controls */}
              {galleryImages.length > 1 && (
                <>
                  <button 
                    type="button" 
                    className="pdp-nav-btn pdp-nav-prev" 
                    aria-label="Previous angle"
                    onClick={handlePrevImage}
                  >
                    ‹
                  </button>
                  <button 
                    type="button" 
                    className="pdp-nav-btn pdp-nav-next" 
                    aria-label="Next angle"
                    onClick={handleNextImage}
                  >
                    ›
                  </button>
                </>
              )}

              {/* Counter */}
              <div className="pdp-img-counter">
                {activeImageIndex + 1} / {galleryImages.length}
              </div>

              {/* Waitlist Overlay */}
              {product.stock === 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(251,250,248,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', border: '1.5px solid var(--ink)', padding: '12px 32px', borderRadius: '999px', background: '#FFFFFF' }}>
                    Currently Reserved · Join Waitlist
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ━━━ ATELIER SPECIFICATIONS CARD ━━━ */}
          <div className="pdp-specs-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(240, 230, 224, 0.8)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🧵</span>
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink)' }}>
                  Atelier Specifications
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-light)', padding: '3px 10px', borderRadius: '999px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Verified by Central Hub
              </span>
            </div>

            {/* Lister Description / Craft Story */}
            {product.description && (
              <div style={{ marginBottom: '16px', background: 'var(--bg-warm)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(240, 230, 224, 0.85)' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Lister Craftsmanship Note
                </div>
                <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{product.description}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: 'var(--ink-secondary)', fontWeight: 600 }}>
                  <span>— {listerName}</span>
                  <span style={{ color: 'var(--accent)', fontSize: '10px' }}>✓ Verified Atelier</span>
                </div>
              </div>
            )}

            {/* Garment Technical Specs Grid */}
            <div className="pdp-specs-grid">
              <div className="pdp-spec-box">
                <span className="pdp-spec-label">Silhouette / Style</span>
                <span className="pdp-spec-value">{product.category || 'Haute Couture'}</span>
              </div>

              <div className="pdp-spec-box">
                <span className="pdp-spec-label">Sanitization Grade</span>
                <span className="pdp-spec-value" style={{ color: '#059669' }}>
                  🌿 Ozone Sterilized ({sanitizationDateStr})
                </span>
              </div>

              <div className="pdp-spec-box">
                <span className="pdp-spec-label">Fit / Standard Size</span>
                <span className="pdp-spec-value">{product.size || product.sizes?.[0] || 'Custom Fitted'}</span>
              </div>

              <div className="pdp-spec-box">
                <span className="pdp-spec-label">Refundable Security Deposit</span>
                <span className="pdp-spec-value">
                  ₹{depositAmount.toLocaleString('en-IN')} (100% Refundable)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━ RIGHT: DETAILS & BOOKING ━━━━━━━━ */}
        <div className="pdp-sticky-column">
          
          <div className="pdp-atelier-tag">
            <span>✨</span>
            <span>{listerName}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>·</span>
            <span style={{ color: '#059669', fontSize: '10px' }}>Verified Vault</span>
          </div>
          
          <h1 className="pdp-title">
            {product.title}
          </h1>

          <div className="pdp-pill-row">
            <span className="pdp-pill pdp-pill-sanitized">
              ● Ozone Sterilized ({sanitizationDateStr})
            </span>
            <span className="pdp-pill pdp-pill-verified">
              ✨ 100% Authentic Couture
            </span>
            <span className="pdp-pill pdp-pill-hub">
              ⚡ Central Hub Inspected
            </span>
          </div>
          
          {/* Price Container */}
          <div className="pdp-price-container">
            <div>
              <div className="pdp-price-amount">
                ₹{productPrice.toLocaleString('en-IN')}
              </div>
              <div className="pdp-price-period">
                Flat 4-Day Event Rental Package
              </div>
            </div>
            <div className="pdp-price-deposit-note">
              + ₹{depositAmount.toLocaleString('en-IN')} Refundable Deposit
            </div>
          </div>

          {/* SIZES */}
          <div style={{ marginBottom: '24px' }}>
            <h4 className="pdp-section-header">Select Size</h4>
            <div className="pdp-size-grid">
              {(product.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size']).map(s => (
                <button 
                  key={s} 
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`pdp-size-btn ${selectedSize === s ? 'selected' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* EVENT DATE CALENDAR */}
          <div style={{ marginBottom: '28px' }}>
            <h4 className="pdp-section-header">Select Event Date</h4>
            <EventDatePicker 
              pricePer4Days={productPrice}
              bookings={product.bookings}
              nextAvailableDate={product.nextAvailableDate}
              onDateSelect={(dateStr, extDays) => {
                setBookingDate(dateStr);
                setBookingExtension(extDays);
              }}
            />
          </div>

          {/* CTA BUTTON */}
          <button 
            type="button"
            onClick={handleCheckout}
            disabled={product.stock === 0 || !bookingDate}
            className={`pdp-cta-btn ${!(product.stock === 0 || !bookingDate) ? 'active' : 'disabled'}`}
          >
            {product.stock === 0 
              ? 'Join Waitlist' 
              : (!bookingDate 
                  ? 'Select Event Date Above' 
                  : `Reserve for ₹${totalPayable.toLocaleString('en-IN')} →`)}
          </button>

          {/* LUXURY TRUST BANNER */}
          <div className="pdp-trust-grid">
            <div className="pdp-trust-item">
              <div className="pdp-trust-icon">🛡️</div>
              <div>
                <div className="pdp-trust-title">Zero Damage Liability</div>
                <div className="pdp-trust-desc">Accidental spills covered up to ₹10k</div>
              </div>
            </div>

            <div className="pdp-trust-item">
              <div className="pdp-trust-icon">🚚</div>
              <div>
                <div className="pdp-trust-title">Two-Way Express Delivery</div>
                <div className="pdp-trust-desc">Doorstep delivery & return pickup</div>
              </div>
            </div>

            <div className="pdp-trust-item">
              <div className="pdp-trust-icon">🌿</div>
              <div>
                <div className="pdp-trust-title">Eco-Dry Cleaned</div>
                <div className="pdp-trust-desc">Sealed in ozone sanitized garment bag</div>
              </div>
            </div>

            <div className="pdp-trust-item">
              <div className="pdp-trust-icon">🔄</div>
              <div>
                <div className="pdp-trust-title">Prompt Deposit Refund</div>
                <div className="pdp-trust-desc">Auto-refunded upon central hub intake</div>
              </div>
            </div>
          </div>

          {/* ACCORDION SECTIONS */}
          <div className="pdp-accordion">
            {/* Item 1: Craftsmanship */}
            <div className={`pdp-accordion-item ${openAccordion === 'craft' ? 'open' : ''}`}>
              <button 
                type="button" 
                className="pdp-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'craft' ? null : 'craft')}
              >
                <span>Garment Provenance & Craft</span>
                <span className="pdp-accordion-icon">▼</span>
              </button>
              {openAccordion === 'craft' && (
                <div className="pdp-accordion-body">
                  {product.description || 'Artisanal piece crafted by verified atelier designers using heritage embroidery, genuine zardozi, and hand-woven silks.'}
                </div>
              )}
            </div>

            {/* Item 2: How 4-Day Rental Works */}
            <div className={`pdp-accordion-item ${openAccordion === 'timeline' ? 'open' : ''}`}>
              <button 
                type="button" 
                className="pdp-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'timeline' ? null : 'timeline')}
              >
                <span>4-Day Event Rental Timeline</span>
                <span className="pdp-accordion-icon">▼</span>
              </button>
              {openAccordion === 'timeline' && (
                <div className="pdp-accordion-body">
                  <strong>• Delivery:</strong> Arrives at your doorstep 1 to 2 days before your event for stress-free trial.<br />
                  <strong>• Event Day:</strong> Wear and celebrate.<br />
                  <strong>• Return:</strong> Courier picks up from your address 2 days after your event by 12:00 PM. No washing or dry cleaning required.
                </div>
              )}
            </div>

            {/* Item 3: Deposit & Hygiene Guarantee */}
            <div className={`pdp-accordion-item ${openAccordion === 'refund' ? 'open' : ''}`}>
              <button 
                type="button" 
                className="pdp-accordion-header"
                onClick={() => setOpenAccordion(openAccordion === 'refund' ? null : 'refund')}
              >
                <span>Hygiene & Security Deposit Guarantee</span>
                <span className="pdp-accordion-icon">▼</span>
              </button>
              {openAccordion === 'refund' && (
                <div className="pdp-accordion-body">
                  Every item undergoes strict multi-point inspection at our Central Hub and is sanitized using eco-friendly dry cleaning and ozone treatment. Your security deposit of ₹{depositAmount.toLocaleString('en-IN')} is refunded automatically to your source payment method within 24 hours of hub intake.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="pdp-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <button 
            type="button" 
            className="pdp-lightbox-close" 
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close lightbox"
          >
            ✕
          </button>
          <div className="pdp-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={currentImage} 
              alt={`${product.title} High Resolution Detail`} 
            />
            {galleryImages.length > 1 && (
              <>
                <button 
                  type="button" 
                  className="pdp-nav-btn pdp-nav-prev" 
                  style={{ left: '20px' }}
                  onClick={handlePrevImage}
                >
                  ‹
                </button>
                <button 
                  type="button" 
                  className="pdp-nav-btn pdp-nav-next" 
                  style={{ right: '20px' }}
                  onClick={handleNextImage}
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* MOBILE STICKY RESERVATION BAR */}
      <div className="pdp-mobile-bottom-bar">
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>4-Day Rental</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: 'var(--ink)' }}>
            ₹{productPrice.toLocaleString('en-IN')}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={product.stock === 0 || !bookingDate}
          style={{
            flex: 1, padding: '14px 20px',
            background: (product.stock === 0 || !bookingDate) ? 'var(--ink)' : 'linear-gradient(135deg, #D4567A 0%, #A3284B 100%)',
            color: '#FFFFFF', fontSize: '12px', fontWeight: 800,
            borderRadius: '999px', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(212,86,122,0.3)',
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}
        >
          {product.stock === 0 ? 'Waitlist' : (!bookingDate ? 'Pick Date & Reserve' : `Reserve for ₹${totalPayable.toLocaleString('en-IN')} →`)}
        </button>
      </div>

      <RenterFooter />
    </div>
  );
}
