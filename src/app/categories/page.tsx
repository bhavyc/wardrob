'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null)
      .then(d => {
        if (d?.success && d?.products) {
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

          const groupedCategories: Record<string, { name: string; val: string; img: string; emoji: string }> = {};

          d.products.forEach((p: any) => {
            if (!p.category) return;
            const catName = p.category;
            if (!groupedCategories[catName]) {
              const predefined = predefinedCategories[catName];
              groupedCategories[catName] = {
                name: predefined ? predefined.name : catName,
                val: catName,
                img: predefined ? predefined.img : (p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'),
                emoji: predefined ? predefined.emoji : '✨'
              };
            }
          });

          let dynamicCategories = Object.values(groupedCategories);

          if (dynamicCategories.length === 0) {
            dynamicCategories = ['Lehenga', 'Saree', 'Kurta', 'Shawl'].map(val => ({ ...predefinedCategories[val], val }));
          }

          setCategories(dynamicCategories);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowX: 'hidden' }}>
      <style jsx global>{`
        .hover-scale-img img {
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-scale-img:hover img {
          transform: scale(1.05);
        }
        .cat-pg-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) {
          .cat-pg-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .cat-pg-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .cat-pg-main { padding: 36px 14px !important; }
          .cat-pg-main h1 { font-size: 28px !important; }
        }
      `}</style>

      <RenterNavbar />

      <main className="cat-pg-main" style={{ flex: 1, padding: '80px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: 600, color: 'var(--accent)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px',
            background: 'var(--accent-light)', padding: '4px 14px', borderRadius: 'var(--radius-full)',
          }}>Explore</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 700, color: 'var(--ink)', marginBottom: '12px' }}>
            All Categories
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Discover our complete curated collection by style and occasion.</p>
        </div>

        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Loading categories...</div>
        ) : (
          <div className="cat-pg-grid">
            {categories.map(cat => (
              <Link key={cat.val} href={`/catalog?category=${cat.val}`} className="hover-scale-img" style={{ display: 'block', textDecoration: 'none', color: 'inherit', minWidth: 0, height: '100%' }}>
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
                    <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E0D4CC', marginBottom: '3px' }}>
                      {cat.emoji} COUTURE
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25, margin: 0 }}>
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <RenterFooter />
    </div>
  );
}
