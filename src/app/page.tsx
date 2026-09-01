'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';

export default function Storefront() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [heroSlide, setHeroSlide] = useState(0);

  const heroSlides = useMemo(() => [
    {
      id: 'bridal',
      label: "India's Premier Luxury Rental",
      desc: "Access master-crafted designer archives from top ateliers across India. Hub-inspected, 60°C ozone sterilized, with a complimentary 72-hour event buffer.",
      image: '/images/hero-bg.png',
      badgeCat: 'VERIFIED COUTURE',
      badgeTitle: 'Blush Zardozi Bridal Lehenga',
      badgePrice: '₹7,500',
      badgeUnit: '/ 4 days',
      bgPos: '68% center',
      tabName: 'Womenswear',
    },
    {
      id: 'groom',
      label: "India's Premier Luxury Rental",
      desc: "Access master-crafted designer archives from top ateliers across India. Hub-inspected, 60°C ozone sterilized, with a complimentary 72-hour event buffer.",
      image: '/images/hero-sherwani.png',
      badgeCat: 'BESPOKE ATELIER',
      badgeTitle: 'Royal Embroidered Groom Sherwani',
      badgePrice: '₹6,200',
      badgeUnit: '/ 4 days',
      bgPos: '75% center',
      tabName: 'Menswear',
    }
  ], []);

  useEffect(() => {
    setHeroLoaded(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);

    const slideTimer = setInterval(() => {
      setHeroSlide(prev => (prev === 0 ? 1 : 0));
    }, 5000);

    fetch('/api/products')
      .then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null)
      .then(d => { if (d?.success && d?.products) setListings(d.products); })
      .catch(() => { })
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(slideTimer);
    };
  }, []);

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const predefinedCategories: Record<string, { name: string; img: string; emoji: string }> = {
    'Lehenga': { name: 'Bridal Lehengas', img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800', emoji: '👑' },
    'Saree': { name: 'Banarasi Sarees', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', emoji: '✨' },
    'Kurta': { name: 'Sherwanis & Sets', img: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&q=80&w=800', emoji: '🤵' },
    'Shawl': { name: 'Pashmina Archives', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800', emoji: '🧣' },
    'Sharara': { name: 'Sharara & Anarkali', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800', emoji: '🪷' },
    'Dupatta': { name: 'Festive Dupattas', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800', emoji: '🌟' },
    'IndoWestern': { name: 'Indo-Western', img: 'https://images.unsplash.com/photo-1536766820879-059fec98ec0a?auto=format&fit=crop&q=80&w=800', emoji: '💎' },
    'Gown': { name: 'Cocktail Gowns', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', emoji: '🥂' },
  };

  const luxuryProductGallery = [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800', // Banarasi Saree
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800', // Bridal Lehenga
    'https://images.unsplash.com/photo-1585422709289-56fb082101fa?auto=format&fit=crop&q=80&w=800', // Sherwani replacement
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800', // Sharara
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', // Gown
    'https://images.unsplash.com/photo-1536766820879-059fec98ec0a?auto=format&fit=crop&q=80&w=800', // Indo Western
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800', // Dupatta
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800', // Pashmina
  ];

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
        @keyframes cardPop {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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

        /* ═══ LUXURY PRODUCT CARDS (THE VAULT) ═══ */
        .prod-card {
          background: #FFFFFF;
          border: 1px solid rgba(240, 230, 224, 0.9);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(30, 30, 45, 0.04);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .prod-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 44px -8px rgba(212, 86, 122, 0.18);
          border-color: rgba(212, 86, 122, 0.3);
        }
        .prod-img-wrap {
          position: relative;
          overflow: hidden;
          background: #F4EBE3;
        }
        .prod-img-wrap img {
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .prod-card:hover .prod-img-wrap img {
          transform: scale(1.05);
        }
        .prod-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          color: var(--accent);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          z-index: 2;
        }
        .prod-wishlist {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border: 1px solid rgba(255, 255, 255, 0.9);
          cursor: pointer;
          z-index: 3;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .prod-wishlist:hover { transform: scale(1.12); background: #FFFFFF; }
        .prod-wishlist:active { transform: scale(0.9); }
        .prod-quick-cta {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: -46px;
          background: linear-gradient(135deg, #1E1E2D 0%, #13131F 100%);
          color: #FFFFFF;
          text-align: center;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 11px 0;
          border-radius: var(--radius-full);
          transition: bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2;
          box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        }
        .prod-card:hover .prod-quick-cta {
          bottom: 12px;
        }
        .prod-card-body {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
          justify-content: space-between;
        }
        .prod-cat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .prod-cat-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .prod-sub-tag {
          font-size: 9.5px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
        .prod-title {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.35;
          margin: 0 0 10px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 42px;
        }
        .prod-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid rgba(240, 230, 224, 0.85);
          margin-top: auto;
        }
        .prod-price-col {
          display: flex;
          flex-direction: column;
        }
        .prod-price-lbl {
          font-size: 9px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 1px;
        }
        .prod-price-wrap {
          display: flex;
          align-items: baseline;
          gap: 3px;
          white-space: nowrap;
        }
        .prod-price {
          font-family: var(--font-serif);
          font-size: 19px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.01em;
        }
        .prod-price-unit {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .prod-rent-btn {
          color: #FFF;
        }

        /* ═══ DESKTOP & BASE GRID ═══ */
        .hp-section { padding: 80px 32px; }
        .hp-section-sm { padding: 48px 32px 64px; }
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
          min-height: 560px;
          display: flex;
          align-items: center;
          box-shadow: 0 20px 50px -10px rgba(212,86,122,0.12);
        }
        .hp-hero-bg-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, #FFFAF5 0%, #FFFAF5 45%, rgba(255,250,245,0.8) 65%, rgba(255,250,245,0.15) 88%);
        }
        .hp-hero-content { padding: 60px 70px; }
        .hp-hero-cta-group { display: flex; gap: 14px; align-items: center; }
        .hp-stats-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 60px;
          padding: 24px 40px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 12px 32px rgba(0,0,0,0.04);
          max-width: 900px;
          margin: 28px auto 0;
        }
        .hp-stats-divider { width: 1px; height: 36px; background: var(--border); }

        /* ═══ TABLET VIEW (<= 1024px) ═══ */
        @media (max-width: 1024px) {
          .hp-steps { grid-template-columns: repeat(2, 1fr); }
          .hp-categories { grid-template-columns: repeat(2, 1fr); }
          .hp-products { grid-template-columns: repeat(3, 1fr); gap: 18px; }
          .hp-hero-content { padding: 48px 40px; }
        }

        /* ═══ LUXURY MOBILE VIEW (<= 768px) ═══ */
        @media (max-width: 768px) {
          .hp-section { padding: 36px 14px !important; }
          .hp-section-sm { padding: 24px 14px 36px !important; }
          .hp-header-flex {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 18px !important;
          }
          .hp-header-flex h2 {
            font-size: 24px !important;
            line-height: 1.15 !important;
          }
          
          /* Hero Mobile: Warm Rose-Cream Luxury */
          .hp-hero-wrapper {
            padding: 0 12px !important;
            margin-top: 10px !important;
          }
          .hp-hero-card {
            min-height: auto !important;
            border-radius: 24px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.06) !important;
            border: 1px solid var(--border) !important;
            background: #FFFFFF !important;
          }
          .hp-hero-bg-overlay {
            background: linear-gradient(180deg, rgba(255,250,245,0.95) 0%, rgba(255,250,245,0.9) 65%, rgba(255,250,245,0.98) 100%) !important;
          }
          .hp-hero-content {
            padding: 32px 18px !important;
            text-align: center !important;
            width: 100% !important;
          }
          .hp-hero-pill-badge {
            background: var(--accent-light) !important;
            border: 1px solid rgba(212,86,122,0.25) !important;
            margin-bottom: 14px !important;
          }
          .hp-hero-pill-badge span {
            color: var(--accent) !important;
          }
          .hp-hero-content h1 {
            color: var(--ink) !important;
            font-size: 32px !important;
            line-height: 1.15 !important;
            margin-bottom: 12px !important;
          }
          .hp-hero-content h1 .hp-designer-italic {
            color: var(--accent) !important;
            font-style: italic !important;
          }
          .hp-hero-content p {
            margin-left: auto !important;
            margin-right: auto !important;
            font-size: 13.5px !important;
            line-height: 1.6 !important;
            margin-bottom: 22px !important;
            color: var(--ink-secondary) !important;
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
            font-size: 13.5px !important;
            border-radius: var(--radius-full) !important;
          }
          .hp-hero-badge-float, .hp-hero-badge-top {
            display: none !important;
          }

          /* Stats Mobile (Sleek Glassmorphic 3-column pill) */
          .hp-stats-bar {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 4px !important;
            padding: 16px 8px !important;
            margin-top: 14px !important;
            border-radius: 20px !important;
            background: #FFFFFF !important;
            border: 1px solid rgba(240, 230, 224, 0.9) !important;
            box-shadow: 0 4px 16px rgba(30,30,45,0.04) !important;
          }
          .hp-stats-divider { display: block !important; height: 28px !important; }
          .hp-stat-val { font-size: 17px !important; font-weight: 700 !important; }
          .hp-stat-lbl { font-size: 9.5px !important; letter-spacing: 0.06em !important; }

          /* Category Grid Mobile -> Slider */
          .hp-categories {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            gap: 12px !important;
            padding-bottom: 12px !important;
            -webkit-overflow-scrolling: touch;
            /* Hide scrollbar for Chrome, Safari and Opera */
          }
          .hp-categories::-webkit-scrollbar {
            display: none;
          }
          .hp-categories > a {
            flex: 0 0 60% !important;
            scroll-snap-align: start !important;
          }
          .cat-title {
            font-size: 13.5px !important;
            line-height: 1.2 !important;
          }
          .cat-tag {
            font-size: 8.5px !important;
            letter-spacing: 0.08em !important;
          }

          /* Products Mobile -> Slider */
          .hp-products {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            gap: 12px !important;
            padding-bottom: 24px !important;
            -webkit-overflow-scrolling: touch;
          }
          .hp-products::-webkit-scrollbar {
            display: none;
          }
          .hp-products > a {
            flex: 0 0 75% !important;
            scroll-snap-align: start !important;
          }
          .prod-card {
            border-radius: 18px !important;
            box-shadow: 0 4px 16px rgba(30,30,45,0.04) !important;
            border: 1px solid rgba(240, 230, 224, 0.85) !important;
          }
          .prod-card:hover {
            transform: none !important;
          }
          .prod-quick-cta {
            display: none !important;
          }
          .prod-wishlist {
            width: 28px !important;
            height: 28px !important;
            top: 8px !important;
            right: 8px !important;
          }
          .prod-badge {
            font-size: 8px !important;
            padding: 3.5px 8px !important;
            top: 8px !important;
            left: 8px !important;
          }
          .prod-card-body {
            padding: 12px 10px 12px !important;
          }
          .prod-cat-row {
            margin-bottom: 2px !important;
          }
          .prod-cat-label {
            font-size: 8.5px !important;
            letter-spacing: 0.08em !important;
          }
          .prod-sub-tag {
            font-size: 7.5px !important;
          }
          .prod-title {
            font-family: var(--font-serif) !important;
            font-size: 13px !important;
            line-height: 1.3 !important;
            margin: 0 0 6px 0 !important;
            min-height: 34px !important;
            font-weight: 600 !important;
          }
          .prod-footer {
            padding-top: 8px !important;
          }
          .prod-price-lbl {
            font-size: 7.5px !important;
          }
          .prod-price-wrap {
            white-space: nowrap !important;
          }
          .prod-price {
            font-size: 15px !important;
            font-weight: 700 !important;
          }
          .prod-price-unit {
            font-size: 9.5px !important;
          }
          .prod-rent-btn {
            font-size: 9.5px !important;
            padding: 5px 12px !important;
            font-weight: 700 !important;
          }

          /* Trust & Steps Mobile */
          .hp-trust {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .hp-trust-item {
            padding: 16px 14px !important;
            border-radius: 16px !important;
          }
          .hp-steps {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .hp-step-item {
            padding: 16px 12px !important;
            border-radius: 16px !important;
          }
          .hp-step-item h3 {
            font-size: 14px !important;
            margin-bottom: 4px !important;
          }
          .hp-step-item p {
            font-size: 11.5px !important;
            line-height: 1.45 !important;
          }

          /* Footer CTA Mobile */
          .hp-cta-heading {
            font-size: 24px !important;
            line-height: 1.18 !important;
          }
          .hp-cta-desc {
            font-size: 13px !important;
            margin-bottom: 24px !important;
          }
        }

        @media (max-width: 380px) {
          .hp-steps {
            grid-template-columns: 1fr !important;
          }
          .hp-products {
            gap: 8px !important;
          }
          .prod-title {
            font-size: 11px !important;
          }
          .prod-card-body {
            padding: 8px 8px 10px !important;
          }
        }
      `}</style>


      {/* ━━━ TOP NAVBAR ━━━ */}
      <RenterNavbar />

      <main style={{ flex: 1 }}>

        {/* ━━━━━━━━ HERO (DUAL-SLIDE UNISEX COUTURE HERO) ━━━━━━━━ */}
        <section className="hp-hero-wrapper" style={{ maxWidth: '1440px', margin: '8px auto 0', padding: '0 16px' }}>
          <div className="hp-hero-card">

            {/* Background Slides with 1s Cross-Fade Transition */}
            {heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: slide.bgPos,
                  opacity: heroSlide === idx ? 1 : 0,
                  transform: heroSlide === idx ? 'scale(1.02)' : 'scale(1)',
                  transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 7s ease',
                  zIndex: heroSlide === idx ? 2 : 1,
                }}
              />
            ))}

            {/* Seamless Soft Cream Overlay */}
            <div className="hp-hero-bg-overlay" style={{ zIndex: 3 }} />

            {/* Left Content Area */}
            <div className="hp-hero-content" style={{
              position: 'relative', zIndex: 10, maxWidth: '720px',
              opacity: heroLoaded ? 1 : 0,
              transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div className="hp-hero-pill-badge" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'var(--accent-light)', padding: '5px 14px',
                borderRadius: '24px', marginBottom: '16px',
                border: '1px solid rgba(212,86,122,0.25)',
                transition: 'all 0.4s ease',
              }}>
                <span style={{ fontSize: '11px', flexShrink: 0 }}>✨</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {heroSlides[heroSlide].label}
                </span>
              </div>

              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(32px, 5.5vw, 72px)',
                fontWeight: 700,
                lineHeight: 1.12,
                color: 'var(--ink)',
                marginBottom: '14px',
                letterSpacing: '-0.02em',
              }}>
                Wear <span className="hp-designer-italic" style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 600 }}>Designer.</span><br />
                Don&apos;t Buy It.
              </h1>

              <p style={{
                fontSize: '14.5px', color: 'var(--ink-secondary)', lineHeight: 1.6,
                maxWidth: '480px', marginBottom: '24px', fontWeight: 400,
                minHeight: '46px',
              }}>
                {heroSlides[heroSlide].desc}
              </p>

              <div className="hp-hero-cta-group">
                <Link href="/catalog" style={{
                  fontSize: '13.5px', fontWeight: 600, color: '#FFFFFF',
                  padding: '14px 28px', borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)', textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(212,86,122,0.28)',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}>
                  Explore Collection <span>→</span>
                </Link>
                <Link href="/lister/login" style={{
                  fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)',
                  padding: '14px 28px', borderRadius: 'var(--radius-full)',
                  background: '#FFFFFF', border: '1px solid var(--border)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  List Your Wardrobe
                </Link>
              </div>

              {/* Minimal Slide Indicators (Auto-switch progress pills) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '22px' }}>
                {heroSlides.map((slide, sIdx) => (
                  <button
                    key={slide.id}
                    onClick={() => setHeroSlide(sIdx)}
                    style={{
                      height: '6px',
                      width: heroSlide === sIdx ? '28px' : '8px',
                      borderRadius: '100px',
                      background: heroSlide === sIdx ? 'var(--accent)' : 'rgba(30, 30, 45, 0.22)',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    aria-label={`Switch to ${slide.tabName}`}
                    title={slide.tabName}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Badges (Dynamic to current slide) */}
            <div className="hp-hero-badge-float" style={{
              position: 'absolute', bottom: '50px', right: '50px',
              background: 'rgba(255, 255, 255, 0.90)', backdropFilter: 'blur(16px)',
              borderRadius: '20px', padding: '20px 28px',
              boxShadow: '0 16px 36px rgba(0,0,0,0.08)',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              animation: 'floatBadge 6s ease-in-out infinite',
              maxWidth: '280px',
              zIndex: 10,
              transition: 'all 0.4s ease',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>
                {heroSlides[heroSlide].badgeCat}
              </p>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--ink)', lineHeight: 1.3, marginBottom: '8px', fontWeight: 600 }}>
                {heroSlides[heroSlide].badgeTitle}
              </h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Starts at</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
                  {heroSlides[heroSlide].badgePrice}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{heroSlides[heroSlide].badgeUnit}</span>
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
              zIndex: 10,
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
                  borderRadius: '18px', overflow: 'hidden',
                  aspectRatio: '3/4', background: '#1E1E2D',
                  position: 'relative', boxShadow: '0 4px 16px rgba(30, 30, 45, 0.08)',
                  border: '1px solid var(--border)',
                }}>
                  <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {/* Top Right Arrow Badge */}
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.4)',
                    zIndex: 2,
                  }}>→</div>
                  {/* Bottom Gradient Overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(30,30,45,0) 35%, rgba(15,15,26,0.85) 85%, rgba(15,15,26,0.96) 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '16px 14px', color: '#FFFFFF',
                  }}>
                    <span className="cat-tag" style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E0D4CC', marginBottom: '3px' }}>
                      {cat.emoji} COUTURE
                    </span>
                    <h3 className="cat-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2, margin: 0 }}>
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
            {categories.length > 4 && (
              <Link href="/categories" className="hover-scale-img" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  borderRadius: '18px', overflow: 'hidden',
                  aspectRatio: '3/4', background: '#1E1E2D',
                  position: 'relative', boxShadow: '0 4px 16px rgba(30, 30, 45, 0.08)',
                  border: '1px solid var(--border)',
                }}>
                  <img src={categories[3].img} alt="More Categories" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(26, 26, 38, 0.85)', backdropFilter: 'blur(6px)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '6px',
                    color: '#FFFFFF',
                  }}>
                    <span style={{ fontSize: '24px' }}>✨</span>
                    <div style={{ textAlign: 'center', padding: '0 10px' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-serif)', marginBottom: '2px' }}>+{categories.length - 3} More</p>
                      <p style={{ fontSize: '10px', color: '#E0D4CC', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Explore Archives</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ━━━━━━━━ THE VAULT (PRODUCTS) — PREMIUM CARDS ━━━━━━━━ */}
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
                  {filtered.slice(0, 4).map((product, idx) => {
                    const displayImg = luxuryProductGallery[idx % luxuryProductGallery.length];
                    const liked = likedIds.has(product.id);

                    return (
                      <Link href={`/product/${product.id}`} key={product.id} className="prod-card-link" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', minWidth: 0, animationDelay: `${(idx % 4) * 0.05}s` }}>
                        <div className="prod-card">
                          {/* — Image — */}
                          <div className="prod-img-wrap" style={{ position: 'relative' }}>
                            <span className="prod-badge">✨ Verified Atelier</span>
                            <button
                              className="prod-wishlist"
                              aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
                              onClick={(e) => toggleLike(e, product.id)}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? '#D4567A' : 'none'} stroke={liked ? '#D4567A' : '#1E1E2D'} strokeWidth="2.2">
                                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                              </svg>
                            </button>
                            <img
                              src={displayImg}
                              alt={product.title}
                              onError={(e: any) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = luxuryProductGallery[(idx + 1) % luxuryProductGallery.length];
                              }}
                              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                            />
                            <span className="prod-quick-cta">Quick Reserve →</span>
                          </div>

                          {/* — Card Body — */}
                          <div className="prod-card-body">
                            <div>
                              <div className="prod-cat-row">
                                <span className="prod-cat-label">{product.category || 'Designer Couture'}</span>
                                <span className="prod-sub-tag">🧼 60°C Sanitized</span>
                              </div>
                              <h3 className="prod-title">
                                {product.title}
                              </h3>
                            </div>
                            <div className="prod-footer">
                              <div className="prod-price-col">
                                <span className="prod-price-lbl">Rental Rate</span>
                                <div className="prod-price-wrap">
                                  <span className="prod-price">
                                    ₹{Number(product.rentalPrice).toLocaleString('en-IN')}
                                  </span>
                                  <span className="prod-price-unit">
                                    / 4d
                                  </span>
                                </div>
                              </div>
                              <span className="prod-rent-btn">Reserve →</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {filtered.length > 4 && (
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

        {/* ━━━━━━━━ BUY VS RENT CALCULATOR ━━━━━━━━ */}
        <LuxuryCalcSection listings={listings} />

      </main>

      <RenterFooter />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUY VS RENT — LUXURY SAVINGS CALCULATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUY VS RENT — LUXURY SAVINGS CALCULATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LuxuryCalcSection({ listings }: { listings: any[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  // Dynamically generate category stats from live listings
  const dynamicCategories = useMemo(() => {
    if (!listings || listings.length === 0) {
      // Fallback if no listings are loaded yet
      return [{
        label: 'Designer Outfit',
        rentPrice: 3500,
        buyPrice: 3500 * 25,
        wears: 1,
      }];
    }

    const categoryMap = new Map<string, { totalRent: number; count: number }>();

    listings.forEach(l => {
      if (!l.category || !l.rentalPrice) return;
      const cat = l.category;
      const rent = Number(l.rentalPrice);

      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { totalRent: 0, count: 0 });
      }
      const data = categoryMap.get(cat)!;
      data.totalRent += rent;
      data.count += 1;
    });

    const result = Array.from(categoryMap.entries()).map(([cat, data]) => {
      const avgRent = Math.round(data.totalRent / data.count);
      return {
        label: cat,
        rentPrice: avgRent,
        // Estimate retail price as roughly 25x the 4-day rental price
        buyPrice: avgRent * 25,
        wears: 1,
      };
    });

    // Sort alphabetically
    return result.sort((a, b) => a.label.localeCompare(b.label));
  }, [listings]);

  const [mobileTab, setMobileTab] = useState<'rent' | 'buy'>('rent');

  // Handle case where selectedIdx might be out of bounds if listings reload
  const safeIdx = selectedIdx < dynamicCategories.length ? selectedIdx : 0;
  const g = dynamicCategories[safeIdx];

  const savings = g.buyPrice - g.rentPrice;
  const savingsPct = Math.round((savings / g.buyPrice) * 100);
  const eventsCount = Math.floor(g.buyPrice / g.rentPrice);

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    setAnimKey(k => k + 1);
  };

  return (
    <section style={{
      background: 'var(--bg-warm)',
      borderTop: '1px solid var(--border)',
      padding: '72px 20px',
    }}>
      <style>{`
        @keyframes calcFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .calc-animate { animation: calcFadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        
        .calc-card {
          background: #FFF; border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 24px rgba(30,30,45,0.06);
          padding: 28px; flex: 1; min-width: 0;
        }
        .calc-vs-divider {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 4px; flex-shrink: 0;
          font-weight: 800; font-size: 13px; color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        /* ── DESKTOP VS MOBILE TOGGLE SYSTEM ── */
        .calc-desktop-view {
          display: flex;
          gap: 16px;
          align-items: stretch;
        }
        .calc-mobile-view {
          display: none;
        }

        @media (max-width: 768px) {
          .calc-desktop-view {
            display: none !important;
          }
          .calc-mobile-view {
            display: block !important;
          }

          /* Apple-Style Segmented Control */
          .calc-segmented-control {
            display: flex;
            background: #EDE8E1;
            padding: 4px;
            border-radius: 999px;
            width: 100%;
            max-width: 320px;
            margin: 0 auto 20px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
          }
          .calc-segment-tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 14px;
            border-radius: 999px;
            border: none;
            background: transparent;
            font-size: 13px;
            font-weight: 600;
            color: var(--ink-secondary);
            cursor: pointer;
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: var(--font-sans);
            white-space: nowrap;
          }
          .calc-segment-tab.active-rent {
            background: #FFFFFF;
            color: var(--accent) !important;
            font-weight: 700;
            box-shadow: 0 2px 10px rgba(212,86,122,0.18);
          }
          .calc-segment-tab.active-buy {
            background: #FFFFFF;
            color: #DC2626 !important;
            font-weight: 700;
            box-shadow: 0 2px 10px rgba(220,38,38,0.15);
          }
        }
      `}</style>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            display: 'inline-block', fontSize: '10.5px', fontWeight: 700,
            color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: '10px', background: 'var(--accent-light)', padding: '4px 12px',
            borderRadius: '999px',
          }}>Luxury Math</span>
          <h2 style={{
            fontFamily: 'var(--font-serif)', fontSize: 'clamp(26px, 5vw, 38px)',
            fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '10px',
          }}>
            Buy Once. Regret Forever.<br />
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Or Rent Smart.</span>
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-secondary)', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
            One designer outfit purchase = 15+ different events rented. See the math below.
          </p>
        </div>

        {/* Garment Selector Dropdown */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-secondary)' }}>
            Compare for:
          </span>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedIdx}
              onChange={(e) => handleSelect(Number(e.target.value))}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                background: '#FFFFFF',
                border: '1.5px solid var(--border)',
                borderRadius: '999px',
                padding: '9px 38px 9px 16px',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--ink)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                outline: 'none',
              }}
            >
              {dynamicCategories.map((item, i) => (
                <option key={item.label} value={i}>
                  {item.label}
                </option>
              ))}
            </select>
            <div style={{
              position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none', color: 'var(--ink-secondary)'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>

        {/* ── DESKTOP COMPARISON (Pure Side-by-Side with VS Seal) ── */}
        <div className="calc-desktop-view" key={`desk-${animKey}`}>

          {/* LEFT — Buying */}
          <div className="calc-card calc-animate" style={{ animationDelay: '0ms', borderTop: '3px solid #E53E3E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{
                background: '#FEF2F2', color: '#E53E3E', fontSize: '10px',
                fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px',
                borderRadius: '999px', textTransform: 'uppercase',
              }}>Buying</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>{g.label}</span>
            </div>

            <div style={{ fontSize: 'clamp(28px, 6vw, 38px)', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#E53E3E', lineHeight: 1, marginBottom: '6px' }}>
              ₹{g.buyPrice.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Estimated average retail price</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '🪤', label: 'Worn only', val: `${g.wears} time${g.wears > 1 ? 's' : ''}` },
                { icon: '🗄️', label: 'Closet space wasted', val: 'Forever' },
                { icon: '🧺', label: 'Dry-cleaning cost', val: '₹800–₹2,000 each' },
                { icon: '📉', label: 'Resale value after 1 year', val: '30–40% loss' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>{row.icon} {row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#E53E3E' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VS Divider */}
          <div className="calc-vs-divider">
            <div style={{ width: '1px', height: '40px', background: 'var(--border)' }} />
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--ink)', color: '#FFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 800, flexShrink: 0,
            }}>VS</div>
            <div style={{ width: '1px', height: '40px', background: 'var(--border)' }} />
          </div>

          {/* RIGHT — Renting */}
          <div className="calc-card calc-animate" style={{ animationDelay: '80ms', borderTop: '3px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{
                background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '10px',
                fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px',
                borderRadius: '999px', textTransform: 'uppercase',
              }}>Renting on Wardrob</span>
            </div>

            <div style={{ fontSize: 'clamp(28px, 6vw, 38px)', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--accent)', lineHeight: 1, marginBottom: '6px' }}>
              ₹{g.rentPrice.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Average rental price (4 days)</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '🧼', label: 'Ozone sanitized', val: 'Every time' },
                { icon: '📦', label: 'Doorstep delivery', val: 'Included' },
                { icon: '🔄', label: 'Different look each event', val: `${eventsCount} events` },
                { icon: '🛡️', label: 'Quality inspection by Hub', val: 'Guaranteed' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>{row.icon} {row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MOBILE VIEW (Sleek Apple Segmented Pill + Ultra-Clean Active Card) ── */}
        <div className="calc-mobile-view" key={`mob-${animKey}-${mobileTab}`}>
          
          {/* Segmented Control Bar */}
          <div className="calc-segmented-control">
            <button
              type="button"
              onClick={() => setMobileTab('rent')}
              className={`calc-segment-tab ${mobileTab === 'rent' ? 'active-rent' : ''}`}
            >
              <span>✨ Renting</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('buy')}
              className={`calc-segment-tab ${mobileTab === 'buy' ? 'active-buy' : ''}`}
            >
              <span>🛍️ Buying</span>
            </button>
          </div>

          {/* Active Card Container */}
          {mobileTab === 'rent' ? (
            <div className="calc-card calc-animate" style={{
              borderRadius: '20px',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)',
              border: '1.5px solid rgba(212,86,122,0.25)',
              boxShadow: '0 10px 30px -6px rgba(212,86,122,0.12)',
              padding: '20px 16px',
            }}>
              {/* Header Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '10.5px',
                  fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px',
                  borderRadius: '999px', textTransform: 'uppercase',
                  border: '1px solid rgba(212,86,122,0.2)',
                }}>✨ Wardrob Atelier</span>
                <span style={{
                  fontSize: '10.5px', color: '#047857', fontWeight: 700,
                  background: '#ECFDF5', padding: '4px 10px', borderRadius: '999px',
                  border: '1px solid #A7F3D0',
                }}>
                  Save {savingsPct}%
                </span>
              </div>

              {/* Main Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                  ₹{g.rentPrice.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', fontWeight: 500 }}>
                  / 4 days rental
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Hub-inspected with 72-hr complimentary event buffer
              </div>

              {/* 2x2 Luxury Grid Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: '#FFF5F7', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(212,86,122,0.15)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🧼 Hygiene</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginTop: '3px' }}>60°C Ozone Clean</div>
                </div>
                <div style={{ background: '#FFF5F7', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(212,86,122,0.15)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>📦 Delivery</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginTop: '3px' }}>Doorstep Included</div>
                </div>
                <div style={{ background: '#FFF5F7', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(212,86,122,0.15)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🔄 Variety</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginTop: '3px' }}>{eventsCount}+ Event Looks</div>
                </div>
                <div style={{ background: '#FFF5F7', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(212,86,122,0.15)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🛡️ Protection</div>
                  <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 700, marginTop: '3px' }}>100% Guaranteed</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="calc-card calc-animate" style={{
              borderRadius: '20px',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFBFB 100%)',
              border: '1.5px solid rgba(220,38,38,0.2)',
              boxShadow: '0 10px 30px -6px rgba(220,38,38,0.08)',
              padding: '20px 16px',
            }}>
              {/* Header Badges */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{
                  background: '#FEF2F2', color: '#DC2626', fontSize: '10.5px',
                  fontWeight: 700, letterSpacing: '0.06em', padding: '4px 10px',
                  borderRadius: '999px', textTransform: 'uppercase',
                  border: '1px solid #FECACA',
                }}>🛍️ Retail Buying</span>
                <span style={{
                  fontSize: '10.5px', color: '#B91C1C', fontWeight: 700,
                  background: '#FEF2F2', padding: '4px 10px', borderRadius: '999px',
                  border: '1px solid #FCA5A5',
                }}>
                  High Expense
                </span>
              </div>

              {/* Main Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: '#DC2626', lineHeight: 1 }}>
                  ₹{g.buyPrice.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--ink-secondary)', fontWeight: 500 }}>
                  retail purchase
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Estimated one-time purchase price
              </div>

              {/* 2x2 Luxury Grid Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🪤 Usage</div>
                  <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, marginTop: '3px' }}>Worn 1 time only</div>
                </div>
                <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🗄️ Storage</div>
                  <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, marginTop: '3px' }}>Closet space wasted</div>
                </div>
                <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>🧺 Dry-Clean</div>
                  <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, marginTop: '3px' }}>₹1,500+ you pay</div>
                </div>
                <div style={{ background: '#FEF2F2', padding: '10px 12px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>📉 Resale Loss</div>
                  <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, marginTop: '3px' }}>30–40% loss/yr</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Savings Badge */}
        <div className="calc-animate" key={`badge-${animKey}`} style={{
          marginTop: '22px', padding: '22px 20px',
          background: 'linear-gradient(135deg, #17141C 0%, #2A1E2E 100%)',
          borderRadius: '22px',
          border: '1px solid rgba(212,86,122,0.22)',
          boxShadow: '0 14px 36px -6px rgba(23,20,28,0.4)',
          display: 'flex', flexDirection: 'column', gap: '16px',
          animationDelay: '160ms',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(235,190,160,0.9)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px' }}>
                Your Smart Savings
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
                ₹{savings.toLocaleString('en-IN')} <span style={{ fontSize: '14px', fontWeight: 600, color: '#4ADE80', fontFamily: 'var(--font-sans)' }}>saved</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>
                That is {eventsCount} luxury events with the same budget
              </div>
            </div>

            {/* Savings % jewel badge */}
            <div style={{
              background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)',
              borderRadius: '14px', padding: '10px 14px', textAlign: 'center',
              boxShadow: '0 4px 14px rgba(212,86,122,0.35)', flexShrink: 0,
            }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 800, color: '#FFF', lineHeight: 1 }}>
                {savingsPct}%
              </div>
              <div style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '2px' }}>
                Smarter
              </div>
            </div>
          </div>

          <Link href="/catalog" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)',
            color: '#FFFFFF', padding: '13px 20px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(212,86,122,0.35)',
            width: '100%',
          }}>
            Rent this {g.label} for ₹{g.rentPrice.toLocaleString('en-IN')} →
          </Link>
        </div>

      </div>
    </section>
  );
}