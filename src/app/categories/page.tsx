'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import './categories.css';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok && r.headers.get('content-type')?.includes('application/json') ? r.json() : null)
      .then(d => {
        if (d?.success && Array.isArray(d?.products)) {
          // Group categories strictly from real backend database products
          const grouped: Record<string, { name: string; val: string; count: number; img: string; minPrice: number }> = {};

          d.products.forEach((p: any) => {
            if (!p.category) return;
            const cat = p.category.trim();
            const pImg = (p.images && p.images.length > 0 && p.images[0]) ||
              (p.baselineImages && p.baselineImages.length > 0 && p.baselineImages[0]) || '';
            const pPrice = Number(p.rentalPrice) || 0;

            if (!grouped[cat]) {
              grouped[cat] = {
                name: cat,
                val: cat,
                count: 1,
                img: pImg,
                minPrice: pPrice,
              };
            } else {
              grouped[cat].count += 1;
              if (pPrice > 0 && (grouped[cat].minPrice === 0 || pPrice < grouped[cat].minPrice)) {
                grouped[cat].minPrice = pPrice;
              }
              if (!grouped[cat].img && pImg) {
                grouped[cat].img = pImg;
              }
            }
          });

          setCategories(Object.values(grouped));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowX: 'hidden' }}>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Browse verified designer silhouettes available for 4-day rentals.</p>
        </div>

        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>No categories currently active.</div>
        ) : (
          <div className="cat-pg-grid">
            {categories.map(cat => (
              <Link key={cat.val} href={`/catalog?category=${encodeURIComponent(cat.val)}`} className="hover-scale-img" style={{ display: 'block', textDecoration: 'none', color: 'inherit', minWidth: 0, height: '100%' }}>
                <div className="cat-card-inner">
                  {cat.img ? (
                    <img
                      src={cat.img}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#1E1E2D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                      {cat.name}
                    </div>
                  )}
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
                      {cat.count} {cat.count === 1 ? 'Piece' : 'Pieces'} Available
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25, margin: 0 }}>
                      {cat.name}
                    </h3>
                    {cat.minPrice > 0 && (
                      <span style={{ fontSize: '11px', color: '#C5A880', marginTop: '3px', fontWeight: 600 }}>
                        From ₹{cat.minPrice.toLocaleString('en-IN')} / 4d
                      </span>
                    )}
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
