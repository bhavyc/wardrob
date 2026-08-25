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
      .then(r => r.json())
      .then(d => {
        if (d.success && d.products) {
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

          d.products.forEach((p: any) => {
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
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (max-width: 480px) {
          .cat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <RenterNavbar />

      <main style={{ flex: 1, padding: '80px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{
            display: 'inline-block', fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
            background: 'var(--accent-light)', padding: '6px 18px', borderRadius: 'var(--radius-full)',
          }}>Explore</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '48px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>
            All Categories
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Discover our complete curated collection by style and occasion.</p>
        </div>

        {loading ? (
          <div style={{ padding: '100px 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>Loading categories...</div>
        ) : (
          <div className="cat-grid">
            {categories.map((cat, i) => (
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
          </div>
        )}
      </main>

      <RenterFooter />
    </div>
  );
}
