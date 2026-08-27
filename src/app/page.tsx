'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';

export default function Storefront() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setHeroLoaded(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);

    fetch('/api/products')
      .then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null)
      .then(d => { if (d?.success && d?.products) setListings(d.products); })
      .catch(() => { })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const predefinedCategories: Record<string, { name: string; img: string; emoji: string }> = {
    'Lehenga': { name: 'Bridal Lehengas', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800', emoji: '👰' },
    'Saree': { name: 'Banarasi Sarees', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', emoji: '🪷' },
    'Kurta': { name: 'Sherwanis & Sets', img: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&q=80&w=800', emoji: '🤵' },
    'Shawl': { name: 'Pashmina Shawls', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800', emoji: '🧣' },
    'Dupatta': { name: 'Festive Dupattas', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800', emoji: '✨' },
    'IndoWestern': { name: 'Indo-Western', img: 'https://images.unsplash.com/photo-1536766820879-059fec98ec0a?auto=format&fit=crop&q=80&w=800', emoji: '🌟' },
    'Gown': { name: 'Cocktail Gowns', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800', emoji: '🥂' },
  };

  const groupedCategories: Record<string, { name: string; val: string; img: string; emoji: string }> = {};

  listings.forEach((p: any) => {
    if (!p.category) return;
    const catName = p.category;
    if (!groupedCategories[catName]) {
      const predefined = predefinedCategories[catName];
      groupedCategories[catName] = {
        name: predefined ? predefined.name : catName,
        val: catName,
        img: predefined ? predefined.img : (p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800'),
        emoji: predefined ? predefined.emoji : '✨'
      };
    }
  });

  let dynamicCategories = Object.values(groupedCategories);

  if (dynamicCategories.length === 0) {
    dynamicCategories = ['Lehenga', 'Saree', 'Kurta', 'Shawl'].map(val => ({ ...predefinedCategories[val], val }));
  }

  const categories = dynamicCategories;

  const filtered = listings.filter(p => {
    if (activeCat === 'All') return true;
    return p.category?.toLowerCase() === activeCat.toLowerCase();
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowX: 'hidden' }}>
      <style jsx global>{`
        @keyframes subtleZoom {
          from { transform: scale(1.06); }
          to { transform: scale(1); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
          width: max-content;
        }

        .hover-scale-card {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
          border-radius: 16px;
        }
        .hover-scale-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(30, 30, 45, 0.08);
        }

        .hover-scale-img img {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-scale-img:hover img {
          transform: scale(1.04);
        }

        /* ═══ DESKTOP & BASE GRID ═══ */
        .hp-section { padding: 80px 32px; }
        .hp-section-sm { padding: 40px 32px 60px; }
        .hp-header-flex { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; gap: 16px; }
        .hp-trust { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .hp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .hp-categories { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .hp-products { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .hp-hero-card {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          background-color: var(--bg);
          min-height: 600px;
          display: flex;
          align-items: center;
          box-shadow: 0 20px 50px -10px rgba(212,86,122,0.12);
        }
        .hp-hero-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #FFFAF5 0%, #FFFAF5 42%, rgba(255,250,245,0.75) 60%, rgba(255,250,245,0.1) 85%);
        }
        .hp-hero-content { padding: 60px 70px; }
        .hp-hero-cta-group { display: flex; gap: 14px; align-items: center; }
        .hp-stats-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 60px;
          padding: 28px 40px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 12px 32px rgba(0,0,0,0.04);
          max-width: 900px;
          margin: 32px auto 0;
        }
        .hp-stats-divider { width: 1px; height: 36px; background: var(--border); }

        /* ═══ TABLET VIEW (<= 1024px) ═══ */
        @media (max-width: 1024px) {
          .hp-steps { grid-template-columns: repeat(2, 1fr); }
          .hp-categories { grid-template-columns: repeat(2, 1fr); }
          .hp-products { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .hp-hero-content { padding: 48px 40px; }
        }

        /* ═══ MOBILE OPTIMIZATIONS (<= 768px) ═══ */
        @media (max-width: 768px) {
          .hp-section { padding: 48px 16px !important; }
          .hp-section-sm { padding: 24px 16px 40px !important; }
          .hp-header-flex {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 20px !important;
          }
          .hp-header-flex h2 {
            font-size: 24px !important;
          }
          
          /* Hero Mobile */
          .hp-hero-card {
            min-height: auto !important;
            border-radius: 20px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.06) !important;
          }
          .hp-hero-bg-overlay {
            background: linear-gradient(180deg, rgba(255,250,245,0.94) 0%, rgba(255,250,245,0.9) 70%, rgba(255,250,245,0.98) 100%) !important;
          }
          .hp-hero-content {
            padding: 36px 20px !important;
            text-align: center !important;
          }
          .hp-hero-content p {
            margin-left: auto !important;
            margin-right: auto !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
            margin-bottom: 24px !important;
          }
          .hp-hero-cta-group {
            flex-direction: column !important;
            width: 100% !important;
            gap: 10px !important;
          }
          .hp-hero-cta-group a {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            padding: 13px 20px !important;
          }
          .hp-hero-badge-float, .hp-hero-badge-top {
            display: none !important;
          }

          /* Stats Mobile */
          .hp-stats-bar {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
            padding: 16px 10px !important;
            margin-top: 16px !important;
            border-radius: 16px !important;
          }
          .hp-stats-divider { display: none !important; }
          .hp-stat-val { font-size: 18px !important; }
          .hp-stat-lbl { font-size: 10px !important; }

          /* Category Grid Mobile */
          .hp-categories {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .cat-badge-box {
            padding: 8px 10px !important;
            bottom: 8px !important;
            left: 8px !important;
            right: 8px !important;
          }
          .cat-badge-box span:first-child {
            font-size: 11px !important;
          }
          .cat-badge-box span:last-child {
            font-size: 10px !important;
          }

          /* Products Mobile (2-column e-commerce cards) */
          .hp-products {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .prod-card {
            border-radius: 14px !important;
            overflow: hidden !important;
            border: 1px solid var(--border) !important;
            background: #FFFFFF !important;
          }
          .prod-card-body {
            padding: 12px 10px !important;
          }
          .prod-title {
            font-size: 13px !important;
            margin-bottom: 8px !important;
          }
          .prod-price {
            font-size: 15px !important;
          }

          /* Trust & Steps Mobile */
          .hp-trust {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .hp-trust-item {
            padding: 18px 16px !important;
          }
          .hp-steps {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .hp-step-item {
            padding: 20px 14px !important;
          }
          .hp-step-item h3 {
            font-size: 15px !important;
            margin-bottom: 6px !important;
          }
          .hp-step-item p {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }

          /* Footer CTA Mobile */
          .hp-cta-heading {
            font-size: 26px !important;
          }
          .hp-cta-desc {
            font-size: 14px !important;
            margin-bottom: 30px !important;
          }
        }

        @media (max-width: 380px) {
          .hp-steps {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ━━━ MARQUEE TICKER ━━━ */}
      <div style={{
        background: 'var(--accent-light)',
        borderBottom: '1px solid rgba(212,86,122,0.15)',
        color: 'var(--accent)', overflow: 'hidden', padding: '9px 0',
      }}>
        <div className="marquee-track">
          {[...Array(6)].map((_, rep) => (
            <div key={rep} style={{ display: 'flex', alignItems: 'center', gap: '36px', paddingRight: '36px', flexShrink: 0 }}>
              {[
                'Complimentary 60°C Ozone Sanitization',
                '72-Hour Express Delivery Buffer',
                '100% Deposit Refund Guarantee',
                'Hub-Verified Weave Authenticity',
              ].map((text, i) => (
                <span key={i} style={{
                  fontSize: '11px', fontWeight: 600, color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '0.04em', textTransform: 'uppercase'
                }}>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0,
                  }} />
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'sticky', top: 0, zIndex: 100, transition: 'all 0.3s',
        background: scrolled ? 'rgba(255, 250, 245, 0.96)' : 'rgba(255, 250, 245, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid rgba(240,230,224,0.7)' : '1px solid transparent',
      }}>
        <RenterNavbar />
      </div>

      <main style={{ flex: 1 }}>

        {/* ━━━━━━━━ HERO ━━━━━━━━ */}
        <section style={{ maxWidth: '1440px', margin: '16px auto 0', padding: '0 16px' }}>
          <div className="hp-hero-card">
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/images/hero-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
            }} />
            <div className="hp-hero-bg-overlay" />

            <div className="hp-hero-content" style={{
              position: 'relative', zIndex: 10, maxWidth: '760px',
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'var(--accent-light)', padding: '5px 14px',
                borderRadius: 'var(--radius-full)', marginBottom: '18px',
                border: '1px solid rgba(212,86,122,0.2)',
              }}>
                <span style={{ fontSize: '11px' }}>✨</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  India&apos;s Premier Luxury Rental Platform
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 5.5vw, 76px)',
                fontWeight: 700,
                lineHeight: 1.1,
                color: 'var(--ink)',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}>
                Wear <span style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 600 }}>Designer.</span><br />
                Don&apos;t Buy It.
              </h1>

              <p style={{
                fontSize: '15px', color: 'var(--ink-secondary)', lineHeight: 1.65,
                maxWidth: '520px', marginBottom: '28px', fontWeight: 400,
              }}>
                Access master-crafted designer archives from top ateliers across India. Hub-inspected, 60°C ozone sterilized, with a complimentary 72-hour event buffer.
              </p>

              <div className="hp-hero-cta-group">
                <Link href="/catalog" style={{
                  fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
                  padding: '14px 28px', borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)', textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(212,86,122,0.28)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}>
                  Explore Collection <span>→</span>
                </Link>
                <Link href="/lister/login" style={{
                  fontSize: '14px', fontWeight: 600, color: 'var(--ink)',
                  padding: '14px 28px', borderRadius: 'var(--radius-full)',
                  background: '#FFFFFF', border: '1px solid var(--border)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  List Your Wardrobe
                </Link>
              </div>
            </div>

            {/* Desktop Badges */}
            <div className="hp-hero-badge-float" style={{
              position: 'absolute', bottom: '50px', right: '50px',
              background: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(16px)',
              borderRadius: '20px', padding: '20px 28px',
              boxShadow: '0 16px 36px rgba(0,0,0,0.08)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              animation: 'floatBadge 6s ease-in-out infinite',
              maxWidth: '260px',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>VERIFIED COUTURE</p>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--ink)', lineHeight: 1.3, marginBottom: '8px', fontWeight: 600 }}>
                Authentic Banarasi Elegance
              </h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Starts at</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>₹5,000</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 4 days</span>
              </div>
            </div>

            <div className="hp-hero-badge-top" style={{
              position: 'absolute', top: '32px', right: '32px',
              background: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(14px)',
              padding: '10px 20px', borderRadius: 'var(--radius-full)',
              fontSize: '11px', fontWeight: 600, color: 'var(--accent)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>✨</span> Hub-Inspected & Ozone Cleaned
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="hp-stats-bar">
            <div style={{ textAlign: 'center' }}>
              <p className="hp-stat-val" style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>4 Days</p>
              <p className="hp-stat-lbl" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>Base Rental</p>
            </div>
            <div className="hp-stats-divider" />
            <div style={{ textAlign: 'center' }}>
              <p className="hp-stat-val" style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>72 Hrs</p>
              <p className="hp-stat-lbl" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>Buffer Days</p>
            </div>
            <div className="hp-stats-divider" />
            <div style={{ textAlign: 'center' }}>
              <p className="hp-stat-val" style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>100%</p>
              <p className="hp-stat-lbl" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>Authentic</p>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━ CATEGORIES ━━━━━━━━ */}
        <section className="hp-section-sm" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="hp-header-flex">
            <div>
              <span style={{
                display: 'inline-block', fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px',
                background: 'var(--accent-light)', padding: '3px 10px', borderRadius: 'var(--radius-full)',
              }}>Curated Collections</span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>
                Explore Categories
              </h2>
            </div>
            <Link href="/categories" style={{
              fontSize: '12.5px', fontWeight: 600, color: 'var(--accent)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
            }}>
              View All →
            </Link>
          </div>

          <div className="hp-categories">
            {categories.slice(0, categories.length > 4 ? 3 : 4).map((cat, i) => (
              <Link href={`/catalog?category=${cat.val}`} key={i} className="hover-scale-img" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  borderRadius: '16px', overflow: 'hidden',
                  aspectRatio: '3/4', background: 'var(--bg-warm)',
                  position: 'relative', boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                }}>
                  <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className="cat-badge-box" style={{
                    position: 'absolute', bottom: '12px', left: '12px', right: '12px',
                    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                    padding: '8px 12px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.emoji} {cat.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, marginLeft: '6px' }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
            {categories.length > 4 && (
              <Link href="/categories" className="hover-scale-img" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  borderRadius: '16px', overflow: 'hidden',
                  aspectRatio: '3/4', background: 'var(--bg-warm)',
                  position: 'relative', boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                }}>
                  <img src={categories[3].img} alt="More Categories" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(30, 30, 45, 0.72)', backdropFilter: 'blur(4px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '6px',
                    color: '#FFFFFF',
                  }}>
                    <span style={{ fontSize: '24px' }}>✨</span>
                    <div style={{ textAlign: 'center', padding: '0 10px' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-serif)', marginBottom: '2px' }}>+{categories.length - 3} More</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Explore All</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ━━━━━━━━ THE VAULT (PRODUCTS) ━━━━━━━━ */}
        <section className="hp-section" style={{ background: 'var(--bg-warm)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="hp-header-flex">
              <div>
                <span style={{
                  display: 'inline-block', fontSize: '10.5px', fontWeight: 600, color: 'var(--accent)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px',
                  background: 'var(--accent-light)', padding: '3px 10px', borderRadius: 'var(--radius-full)',
                }}>New Arrivals</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: 'var(--ink)' }}>The Vault</h2>
              </div>
              <Link href="/catalog" style={{
                fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF', background: 'var(--ink)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: 'var(--radius-full)', flexShrink: 0,
                boxShadow: '0 3px 10px rgba(30,30,45,0.08)'
              }}>
                View All →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Loading collection...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No garments found in this category.</div>
            ) : (
              <>
                <div className="hp-products">
                  {filtered.slice(0, 8).map(product => (
                    <Link href={`/product/${product.id}`} key={product.id} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', minWidth: 0, height: '100%' }}>
                      <div className="prod-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ aspectRatio: '3/4', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
                          <img
                            src={product.images && product.images.length > 0 && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'}
                            alt={product.title}
                            onError={(e: any) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{
                            position: 'absolute', top: '8px', left: '8px',
                            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                            padding: '3px 8px', borderRadius: 'var(--radius-full)',
                            fontSize: '9px', fontWeight: 700, color: 'var(--success)', letterSpacing: '0.02em',
                          }}>
                            ● Verified
                          </div>
                        </div>
                        <div className="prod-card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.category}</p>
                          <h3 className="prod-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</h3>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: 'auto' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>4-Day</span>
                            <span className="prod-price" style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>₹{product.rentalPrice}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {filtered.length > 8 && (
                  <div style={{ textAlign: 'center', marginTop: '36px' }}>
                    <Link href={activeCat === 'All' ? '/catalog' : `/catalog?category=${activeCat}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'var(--ink)', color: '#FFFFFF',
                      padding: '12px 28px', borderRadius: 'var(--radius-full)',
                      fontSize: '13px', fontWeight: 600,
                      textDecoration: 'none',
                    }}>
                      View All Products ({filtered.length}) →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>



        {/* ━━━━━━━━ LEND CTA ━━━━━━━━ */}
        <section className="hp-section" style={{
          background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 50%, #9E3350 100%)',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <span style={{
              display: 'inline-block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px',
              background: 'rgba(255,255,255,0.15)', padding: '4px 14px', borderRadius: 'var(--radius-full)',
            }}>For Designers & Wardrobe Owners</span>
            <h2 className="hp-cta-heading" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '16px', fontSize: '38px' }}>
              Let Your Couture<br />Work For You.
            </h2>
            <p className="hp-cta-desc" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.65, marginBottom: '32px' }}>
              List your designer archives on Wardrob. We handle logistics, verification, cleaning, and direct payouts.
            </p>
            <Link href="/lister/login" style={{
              fontSize: '14px', fontWeight: 600, color: 'var(--accent)',
              padding: '14px 36px', borderRadius: 'var(--radius-full)',
              background: '#FFFFFF', textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            }}>
              Become A Lister
            </Link>
          </div>
        </section>

      </main>

      <RenterFooter />
    </div>
  );
}