'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import Pagination from '@/components/Pagination';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  Lister: { shopName: string; };
};

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const catParam = searchParams.get('category') || 'All';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(catParam);
  const [searchQuery, setSearchQuery] = useState(qParam);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.products) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error('Fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    setSelectedCategory(catParam);
    setSearchQuery(qParam);
    setCurrentPage(1);
  }, [catParam, qParam]);

  const categories = ['All', 'Saree', 'Lehenga', 'Kurta', 'Shirt', 'Shawl'];

  const filteredProducts = products.filter(p => {
    const title = p.title.toLowerCase();
    const desc = p.description.toLowerCase();
    if (searchQuery && !title.includes(searchQuery.toLowerCase()) && !desc.includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'All') {
      if (!title.includes(selectedCategory.toLowerCase()) && !desc.includes(selectedCategory.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <style>{`
        .cat-header { background: var(--bg-warm); padding: 56px 40px; border-bottom: 1px solid var(--border); }
        .cat-main {
          flex: 1; display: flex; gap: 48px; max-width: 1400px; margin: 0 auto;
          width: 100%; padding: 48px 40px; align-items: flex-start;
        }
        .cat-sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 100px; }
        .cat-mobile-pills { display: none; overflow-x: auto; gap: 8px; padding: 12px 16px; -webkit-overflow-scrolling: touch; background: var(--bg-warm); border-bottom: 1px solid var(--border); }
        .cat-mobile-pills::-webkit-scrollbar { display: none; }
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (max-width: 768px) {
          .cat-header { padding: 32px 16px; }
          .cat-header h1 { font-size: 28px !important; }
          .cat-main { padding: 20px 14px; flex-direction: column; gap: 0; }
          .cat-sidebar { display: none !important; }
          .cat-mobile-pills { display: flex !important; }
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
      `}</style>
      <RenterNavbar />

      {/* ━━━━━━━━ HEADER ━━━━━━━━ */}
      <div className="cat-header">
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontWeight: 600, color: 'var(--accent)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px',
            background: 'var(--accent-light)', padding: '4px 14px', borderRadius: 'var(--radius-full)',
          }}>Curated Archives</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 700, color: 'var(--ink)' }}>
            {searchQuery ? `Search: "${searchQuery}"` : (selectedCategory === 'All' ? 'The Complete Collection' : `${selectedCategory} Collection`)}
          </h1>
        </div>
      </div>

      {/* Mobile category pills */}
      <div className="cat-mobile-pills">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 18px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 600,
              border: selectedCategory === cat ? '1px solid var(--ink)' : '1px solid var(--border)',
              background: selectedCategory === cat ? 'var(--ink)' : '#FFFFFF',
              color: selectedCategory === cat ? '#FFFFFF' : 'var(--ink-secondary)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="cat-main">
        {/* ━━━━━━━━ SIDEBAR (DESKTOP) ━━━━━━━━ */}
        <aside className="cat-sidebar">
          <div style={{
            background: '#FFFFFF', padding: '28px 24px', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  style={{
                    textAlign: 'left', background: selectedCategory === cat ? 'var(--accent-light)' : 'transparent',
                    border: 'none', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                    color: selectedCategory === cat ? 'var(--accent)' : 'var(--ink-secondary)',
                    fontWeight: selectedCategory === cat ? 700 : 400, fontSize: '13px',
                    cursor: 'pointer', transition: 'var(--transition-smooth)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <span style={{ fontSize: '12px' }}>✓</span>}
                </button>
              ))}
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  marginTop: '20px', width: '100%', background: 'none', border: '1px dashed var(--border)',
                  padding: '8px', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--accent)',
                  cursor: 'pointer',
                }}
              >
                Clear Search &quot;{searchQuery}&quot;
              </button>
            )}
          </div>
        </aside>

        {/* ━━━━━━━━ PRODUCT GRID ━━━━━━━━ */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '24px',
          }}>
            <span style={{
              fontSize: '12px', color: 'var(--text-muted)',
              background: 'var(--bg-warm)', padding: '5px 14px',
              borderRadius: 'var(--radius-full)', fontWeight: 500,
            }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'garment' : 'garments'} available
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '80px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              Loading collection…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              padding: '60px 20px', textAlign: 'center', borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF', border: '1px solid var(--border)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>No pieces found</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Try adjusting your filters or search query.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  router.push('/catalog');
                }}
                style={{ 
                  background: 'var(--ink)', color: '#FFFFFF', 
                  border: 'none', padding: '10px 24px', fontSize: '12px', fontWeight: 600,
                  borderRadius: 'var(--radius-full)', cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="cat-grid">
                {filteredProducts
                  .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                  .map((p, idx) => {
                    const fallbackGallery = [
                      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
                      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
                      'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&q=80&w=800',
                      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=800',
                    ];
                    const displayImg = fallbackGallery[idx % fallbackGallery.length];

                    return (
                      <Link key={p.id} href={`/product/${p.id}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', minWidth: 0, height: '100%' }}>
                        <div className="prod-card" style={{
                          display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0,
                          background: 'transparent',
                          transition: 'opacity 0.3s ease',
                        }}>
                          <div className="img-zoom-container" style={{ aspectRatio: '3/4', background: 'var(--bg-warm)', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
                            <img
                              src={displayImg}
                              alt={p.title}
                              onError={(e: any) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallbackGallery[idx % fallbackGallery.length];
                              }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {p.stock === 0 && (
                              <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                                  color: 'var(--ink)', border: '1px solid var(--ink)', padding: '6px 16px',
                                }}>Waitlist</span>
                              </div>
                            )}
                          </div>
                          <div className="prod-card-body" style={{ padding: '12px 4px 4px', display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                            <h3 className="prod-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 500, color: 'var(--ink)', marginBottom: '4px', lineHeight: 1.3, textTransform: 'capitalize' }}>
                              {p.title}
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px', marginTop: 'auto' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', whiteSpace: 'nowrap' }}>
                                <span className="prod-price" style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
                                  ₹{Number(p.price).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 4d</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
              <Pagination
                currentPage={currentPage}
                totalItems={filteredProducts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                className="mt-6"
              />
            </>
          )}
        </div>
      </main>

      <RenterFooter />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
