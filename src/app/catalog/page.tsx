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
        .cat-header { background: var(--bg-warm); padding: 64px 40px; border-bottom: 1px solid var(--border); }
        .cat-main {
          flex: 1; display: flex; gap: 48px; max-width: 1400px; margin: 0 auto;
          width: 100%; padding: 48px 40px; align-items: flex-start;
        }
        .cat-sidebar { width: 220px; flex-shrink: 0; position: sticky; top: 100px; }
        .cat-mobile-pills { display: none; overflow-x: auto; gap: 8px; padding: 0 20px 16px; -webkit-overflow-scrolling: touch; }
        .cat-mobile-pills::-webkit-scrollbar { display: none; }
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .cat-header { padding: 40px 20px; }
          .cat-main { padding: 24px 20px; flex-direction: column; gap: 0; }
          .cat-sidebar { display: none !important; }
          .cat-mobile-pills { display: flex !important; }
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
      `}</style>
      <RenterNavbar />

      {/* ━━━━━━━━ HEADER ━━━━━━━━ */}
      <div className="cat-header">
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', fontSize: '12px', fontWeight: 600, color: 'var(--accent)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
            background: 'var(--accent-light)', padding: '6px 18px', borderRadius: 'var(--radius-full)',
          }}>Curated Archives</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '44px', fontWeight: 700, color: 'var(--ink)' }}>
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
              router.push(`/catalog?category=${cat}${searchQuery ? `&q=${searchQuery}` : ''}`);
            }}
            style={{
              flexShrink: 0, padding: '8px 20px', borderRadius: 'var(--radius-full)',
              fontSize: '13px', fontWeight: selectedCategory === cat ? 600 : 400,
              background: selectedCategory === cat ? 'var(--accent-light)' : '#FFF',
              color: selectedCategory === cat ? 'var(--accent)' : 'var(--ink-secondary)',
              border: `1px solid ${selectedCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {cat === 'All' ? 'All' : cat}
          </button>
        ))}
      </div>

      <main className="cat-main">
        
        {/* ━━━━━━━━ SIDEBAR FILTER ━━━━━━━━ */}
        <aside className="cat-sidebar">
          <div style={{
            background: '#FFFFFF', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', padding: '28px 24px',
          }}>
            <h4 style={{
              fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: 'var(--ink-secondary)', marginBottom: '20px',
            }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    router.push(`/catalog?category=${cat}${searchQuery ? `&q=${searchQuery}` : ''}`);
                  }}
                  style={{
                    background: selectedCategory === cat ? 'var(--accent-light)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: '14px',
                    color: selectedCategory === cat ? 'var(--accent)' : 'var(--ink-secondary)',
                    fontWeight: selectedCategory === cat ? 600 : 400,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}
                >
                  <span style={{ 
                    width: '7px', height: '7px', borderRadius: '50%', 
                    background: selectedCategory === cat ? 'var(--accent)' : 'var(--border)',
                    transition: 'background 0.3s ease',
                  }} />
                  {cat === 'All' ? 'All Pieces' : `${cat}s`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ━━━━━━━━ PRODUCT GRID ━━━━━━━━ */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '32px',
          }}>
            <span style={{
              fontSize: '13px', color: 'var(--text-muted)',
              background: 'var(--bg-warm)', padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
            }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '120px 0', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
              Loading collection…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{
              padding: '100px 40px', textAlign: 'center', borderRadius: 'var(--radius-lg)',
              background: '#FFFFFF', border: '1px solid var(--border)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: 'var(--ink)' }}>No pieces found</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>Try adjusting your filters or search query.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  router.push('/catalog');
                }}
                style={{ 
                  background: 'var(--accent-light)', color: 'var(--accent)', 
                  border: 'none', padding: '12px 28px', fontSize: '13px', fontWeight: 600,
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
                  .map(p => (
                  <Link key={p.id} href={`/product/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', minWidth: 0, height: '100%' }}>
                    <div className="prod-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
                      <div className="img-zoom-container" style={{ aspectRatio: '3/4', background: 'var(--bg-warm)', position: 'relative' }}>
                        <img
                          src={p.images && p.images.length > 0 && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'}
                          alt={p.title}
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        
                        {/* Verified badge */}
                        <div style={{
                          position: 'absolute', top: '12px', left: '12px',
                          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
                          padding: '5px 12px', borderRadius: 'var(--radius-full)',
                          fontSize: '10px', fontWeight: 600, color: 'var(--success)', letterSpacing: '0.04em',
                        }}>
                          ● Verified
                        </div>

                        {p.stock === 0 && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(255,250,245,0.85)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 'var(--radius-md)',
                          }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                              color: 'var(--ink)', border: '1.5px solid var(--ink)', padding: '10px 24px',
                              borderRadius: 'var(--radius-full)',
                            }}>Waitlist</span>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
                        }}>
                          {p.Lister?.shopName || 'Atelier Collection'}
                        </div>
                        
                        <h3 style={{ 
                          fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, color: 'var(--ink)', 
                          marginBottom: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {p.title}
                        </h3>
                        
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: 'auto'
                        }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>4-Day Rental</span>
                          <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', fontWeight: 700, color: 'var(--ink)' }}>₹{p.price.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
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
