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
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    fetch('/api/products')
      .then(r => r.json())
      .then(d => { if (d.success && d.products) setListings(d.products); })
      .catch(() => {})
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
        img: p.images && p.images.length > 0 ? p.images[0] : (predefined ? predefined.img : 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800'),
        emoji: predefined ? predefined.emoji : '✨'
      };
    }
  });

  let dynamicCategories = Object.values(groupedCategories);

  // If loading or no listings yet, show default curated ones
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
          from { transform: scale(1.08); }
          to { transform: scale(1); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .hero-image-mask {
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(212, 86, 122, 0.15);
        }
        .hero-image-mask img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          animation: subtleZoom 8s ease-out forwards;
        }

        .hover-scale-card {
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 16px;
          overflow: hidden;
        }
        .hover-scale-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(30, 30, 45, 0.1);
        }

        .hover-scale-img img {
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-scale-img:hover img {
          transform: scale(1.05);
        }

        .category-pill {
          border: none;
          cursor: pointer;
          padding: 10px 24px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-sans);
          transition: all 0.3s ease;
          letter-spacing: 0.02em;
        }
        .category-pill.active {
          background: var(--ink);
          color: #FFF;
        }
        .category-pill:not(.active) {
          background: transparent;
          color: var(--ink-secondary);
          border: 1px solid var(--border);
        }
        .category-pill:not(.active):hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: marquee 35s linear infinite;
        }

        /* ═══ HOMEPAGE RESPONSIVE ═══ */
        .hp-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .hp-trust { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .hp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; }
        .hp-categories { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .hp-products { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; }
        .hp-section { padding: 100px 40px; }
        .hp-section-sm { padding: 0 40px 100px; }
        .hp-cta-heading { font-size: 48px !important; }

        @media (max-width: 1024px) {
          .hp-hero { grid-template-columns: 1fr; gap: 48px; }
          .hp-steps { grid-template-columns: repeat(2, 1fr); }
          .hp-categories { grid-template-columns: repeat(2, 1fr); }
          .hp-products { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .hp-hero { grid-template-columns: 1fr; gap: 32px; padding: 40px 20px 60px !important; }
          .hp-trust { grid-template-columns: 1fr; }
          .hp-steps { grid-template-columns: 1fr; }
          .hp-categories { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .hp-products { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .hp-section { padding: 60px 20px; }
          .hp-section-sm { padding: 0 20px 60px; }
          .hp-cta-heading { font-size: 28px !important; }
          .hp-float-badge { display: none; }
          .hp-hero-image { order: -1; }
        }

        @media (max-width: 480px) {
          .hp-categories { grid-template-columns: 1fr; }
          .hp-products { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ━━━ MARQUEE TICKER ━━━ */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1E2D 0%, #2A2A3D 100%)',
        color: '#FFFFFF', overflow: 'hidden', padding: '11px 0',
      }}>
        <div className="marquee-track">
          {[...Array(4)].map((_, rep) => (
            <div key={rep} style={{ display: 'flex', alignItems: 'center', gap: '56px', paddingRight: '56px', flexShrink: 0 }}>
              {[
                'Complimentary 60°C Ozone Sanitization',
                '72-Hour Express Delivery Buffer',
                '100% Deposit Refund Guarantee',
                'Hub-Verified Weave Authenticity',
              ].map((text, i) => (
                <span key={i} style={{
                  fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.85)',
                  display: 'flex', alignItems: 'center', gap: '14px', letterSpacing: '0.06em',
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
        background: scrolled ? 'rgba(255, 250, 245, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(240,230,224,0.5)' : '1px solid transparent',
      }}>
        <RenterNavbar />
      </div>

      <main style={{ flex: 1 }}>

        {/* ━━━━━━━━ HERO — SPLIT LAYOUT ━━━━━━━━ */}
        <section className="hp-hero" style={{
          maxWidth: '1400px', margin: '0 auto', padding: '80px 40px 100px',
        }}>
          {/* Left — Text */}
          <div style={{
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'var(--accent-light)', padding: '8px 20px',
              borderRadius: 'var(--radius-full)', marginBottom: '32px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em' }}>
                India's Premier Rental Platform
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(42px, 5vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--ink)',
              marginBottom: '28px',
              letterSpacing: '-0.01em',
            }}>
              Wear Designer.<br />
              Don&apos;t Buy It.
            </h1>

            <p style={{
              fontSize: '17px', color: 'var(--ink-secondary)', lineHeight: 1.8,
              maxWidth: '480px', marginBottom: '48px',
            }}>
              Access master-crafted designer archives from ateliers across India. Every garment is hub-inspected, ozone sterilized, and delivered with a complimentary event buffer.
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/catalog" style={{
                fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
                padding: '16px 40px', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)',
                textDecoration: 'none', transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(212, 86, 122, 0.3)',
                display: 'inline-block',
              }}>
                Explore Collection
              </Link>
              <Link href="/lister/login" style={{
                fontSize: '14px', fontWeight: 600, color: 'var(--ink)',
                padding: '16px 40px', borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--border-strong)', textDecoration: 'none',
                transition: 'all 0.3s ease', display: 'inline-block',
              }}>
                List Your Wardrobe
              </Link>
            </div>
          </div>

          {/* Right — Hero Image */}
          <div className="hp-hero-image" style={{
            position: 'relative',
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
          }}>
            <div className="hero-image-mask" style={{ aspectRatio: '4/5', position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1583391733958-6115fa016e7d?auto=format&fit=crop&q=80&w=1200" alt="Luxury Indian Couture" />
            </div>
            
            {/* Floating badge */}
            <div className="hp-float-badge" style={{
              position: 'absolute', bottom: '-24px', left: '-24px',
              background: '#FFFFFF', borderRadius: 'var(--radius-lg)',
              padding: '20px 28px', boxShadow: 'var(--shadow-lg)',
              animation: 'floatBadge 3s ease-in-out infinite',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: '6px' }}>FEATURED</p>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--ink)', lineHeight: 1.2, marginBottom: '8px' }}>Banarasi Zari Silk</h4>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--ink)' }}>₹3,800</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>/ 4 days</span>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━ TRUST METRICS ━━━━━━━━ */}
        <section className="hp-section-sm" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="hp-trust">
            {[
              { icon: '🛡️', title: '₹0 Security Hold', desc: 'On eligible trusted profiles' },
              { icon: '🧼', title: '60°C Sterilization', desc: 'Hospital-grade ozone cleaning' },
              { icon: '📦', title: '72-Hour Buffer', desc: 'Complimentary extra transit days' },
            ].map((item, i) => (
              <div key={i} className="hover-scale-card" style={{
                background: '#FFFFFF', padding: '36px 32px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                display: 'flex', alignItems: 'flex-start', gap: '20px',
                cursor: 'default',
              }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{item.icon}</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>{item.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ━━━━━━━━ HOW IT WORKS ━━━━━━━━ */}
        <section className="hp-section" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <span style={{
              display: 'inline-block', fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
              background: 'var(--accent-light)', padding: '6px 18px', borderRadius: 'var(--radius-full)',
            }}>How It Works</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '44px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15 }}>
              Four Simple Steps
            </h2>
          </div>

          <div className="hp-steps">
            {[
              { num: '01', title: 'Browse & Reserve', desc: 'Select from our curated archive. Auto-calculated delivery buffers guarantee on-time arrival.', color: '#D4567A' },
              { num: '02', title: 'Hub Verified', desc: 'Each garment is routed through our hubs for weave checks and 60°C ozone sterilization.', color: '#0D9488' },
              { num: '03', title: 'Wear & Shine', desc: 'Enjoy your designer piece for 4 full days. No dry-cleaning or maintenance worries.', color: '#E5954B' },
              { num: '04', title: 'Easy Return', desc: 'Repack in the eco-box. A courier retrieves it from your doorstep — zero hassle.', color: '#7C5CFC' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '40px 28px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', transition: 'all 0.4s ease',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: 'var(--radius-md)',
                  background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '24px',
                }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: s.color }}>{s.num}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ━━━━━━━━ CATEGORY GALLERY ━━━━━━━━ */}
        <section className="hp-section-sm" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '120px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{
              display: 'inline-block', fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
              background: 'var(--accent-light)', padding: '6px 18px', borderRadius: 'var(--radius-full)',
            }}>Explore</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '44px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '16px' }}>
              Categories
            </h2>
            <Link href="/categories" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: 600, color: 'var(--accent)',
              textDecoration: 'none', letterSpacing: '0.04em',
              borderBottom: '1px solid var(--accent)', paddingBottom: '2px',
              transition: 'opacity 0.2s ease',
            }}>
              View All Categories →
            </Link>
          </div>

          <div className="hp-categories">
            {categories.slice(0, categories.length > 4 ? 3 : 4).map((cat, i) => (
              <Link href={`/catalog?category=${cat.val}`} key={i} className="hover-scale-img" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  aspectRatio: '3/4', background: 'var(--bg-warm)', marginBottom: '16px',
                  position: 'relative',
                }}>
                  <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', bottom: '16px', left: '16px',
                    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                    padding: '8px 16px', borderRadius: 'var(--radius-full)',
                    fontSize: '12px', fontWeight: 600, color: 'var(--ink)',
                  }}>
                    {cat.emoji} {cat.name}
                  </div>
                </div>
              </Link>
            ))}
            {categories.length > 4 && (
              <Link href="/categories" className="hover-scale-img" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  aspectRatio: '3/4', background: 'var(--bg-warm)', marginBottom: '16px',
                  position: 'relative',
                }}>
                  <img src={categories[3].img} alt="More Categories" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(30, 30, 45, 0.65)', backdropFilter: 'blur(6px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '12px',
                    color: '#FFFFFF', transition: 'all 0.4s ease',
                  }}>
                    <span style={{ fontSize: '32px', marginBottom: '8px' }}>✨</span>
                    <div style={{ textAlign: 'center', padding: '0 20px' }}>
                      <p style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>+{categories.length - 3} More</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Explore All</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span style={{
                  display: 'inline-block', fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px',
                  background: 'var(--accent-light)', padding: '6px 18px', borderRadius: 'var(--radius-full)',
                }}>New Arrivals</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', fontWeight: 700, color: 'var(--ink)' }}>The Vault</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['All', ...Array.from(new Set(listings.map(l => l.category).filter(Boolean)))].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCat(cat)}
                    className={`category-pill ${activeCat === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '100px 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>Loading collection...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '100px 0', textAlign: 'center', fontSize: '15px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No garments found in this category.</div>
            ) : (
              <>
                <div className="hp-products">
                  {filtered.slice(0, 4).map(product => (
                    <Link href={`/product/${product.id}`} key={product.id} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', minWidth: 0, height: '100%' }}>
                      <div className="prod-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div className="img-zoom-container" style={{ aspectRatio: '3/4', background: 'var(--bg)', position: 'relative' }}>
                          <img src={product.images[0] || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800'} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute', top: '12px', left: '12px',
                            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
                            padding: '5px 12px', borderRadius: 'var(--radius-full)',
                            fontSize: '10px', fontWeight: 600, color: 'var(--success)', letterSpacing: '0.04em',
                          }}>
                            ● Verified
                          </div>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.category}</p>
                          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginBottom: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</h3>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: 'auto' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>4-Day Rental</span>
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>₹{product.rentalPrice}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {filtered.length > 4 && (
                  <div style={{ textAlign: 'center', marginTop: '48px' }}>
                    <Link href={activeCat === 'All' ? '/catalog' : `/catalog?category=${activeCat}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '10px',
                      background: 'var(--ink)', color: '#FFFFFF',
                      padding: '14px 36px', borderRadius: 'var(--radius-full)',
                      fontSize: '14px', fontWeight: 600, letterSpacing: '0.04em',
                      textDecoration: 'none', transition: 'all 0.3s ease',
                    }}>
                      View All {activeCat === 'All' ? 'Products' : activeCat} ({filtered.length}) →
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
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <span style={{
              display: 'inline-block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px',
              background: 'rgba(255,255,255,0.15)', padding: '6px 18px', borderRadius: 'var(--radius-full)',
            }}>For Designers & Owners</span>
            <h2 className="hp-cta-heading" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.15, marginBottom: '24px' }}>
              Let Your Couture<br />Work For You.
            </h2>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.8, marginBottom: '48px' }}>
              List your designer archives on Wardrob. We handle logistics, hub-verified authentication, damage coverage, and direct-to-bank payouts.
            </p>
            <Link href="/lister/login" style={{
              fontSize: '14px', fontWeight: 600, color: 'var(--accent)',
              padding: '18px 48px', borderRadius: 'var(--radius-full)',
              background: '#FFFFFF', textDecoration: 'none',
              display: 'inline-block', transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
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
