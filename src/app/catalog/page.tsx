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
  rentalPrice?: number;
  stock: number;
  images: string[];
  category?: string;
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

  const [categorySearch, setCategorySearch] = useState('');

  // Extract all categories dynamically from products combined with curated list
  const defaultPresetCategories = ['Saree', 'Lehenga', 'Kurti', 'Sharara Set', 'Anarkali Suit', 'Dress', 'Kurta', 'Sherwani', 'Shawl', 'Gown', 'Indo-Western'];
  
  const uniqueCategories = Array.from(
    new Set([
      ...products.map(p => p.category).filter(Boolean) as string[],
      ...defaultPresetCategories
    ])
  );

  const categories = ['All', ...uniqueCategories];

  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(categorySearch.toLowerCase().trim())
  );

  // Compute product count per category
  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return products.length;
    return products.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pTitle = p.title.toLowerCase();
      const pDesc = p.description.toLowerCase();
      const target = cat.toLowerCase();
      return pCat === target || pTitle.includes(target) || pDesc.includes(target);
    }).length;
  };

  const filteredProducts = products.filter(p => {
    const title = p.title.toLowerCase();
    const desc = p.description.toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !pCat.includes(q)) {
        return false;
      }
    }
    
    if (selectedCategory !== 'All') {
      const target = selectedCategory.toLowerCase();
      if (pCat) {
        if (pCat !== target && !title.includes(target) && !desc.includes(target)) return false;
      } else {
        if (!title.includes(target) && !desc.includes(target)) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <style>{`
        .cat-header { background: var(--bg-warm); padding: 48px 24px; border-bottom: 1px solid var(--border); }
        .cat-main {
          flex: 1; display: flex; gap: 40px; max-width: 1400px; margin: 0 auto;
          width: 100%; padding: 40px 24px; align-items: flex-start;
        }
        .cat-sidebar { width: 230px; flex-shrink: 0; position: sticky; top: 100px; }
        .cat-scroll-list {
          max-height: 300px;
          overflow-y: auto;
          padding-right: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cat-scroll-list::-webkit-scrollbar {
          width: 3.5px;
        }
        .cat-scroll-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
        }
        .cat-scroll-list::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 4px;
        }
        .cat-scroll-list::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }
        .cat-search-box {
          position: relative;
          margin-bottom: 12px;
        }
        .cat-search-input {
          width: 100%;
          height: 34px;
          padding: 0 28px 0 28px;
          background: var(--bg-warm);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 11.5px;
          color: var(--ink);
          outline: none;
          box-sizing: border-box;
          transition: var(--transition-smooth);
        }
        .cat-search-input:focus {
          border-color: var(--accent);
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(212, 86, 122, 0.1);
        }
        .cat-search-icon {
          position: absolute;
          left: 9px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 11px;
          pointer-events: none;
        }
        .cat-clear-icon {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 11px;
          padding: 2px;
        }
        .cat-mobile-dropdown-wrap {
          display: none; padding: 12px 16px; background: var(--bg);
          border-bottom: 1px solid var(--border);
          position: sticky; top: 58px; z-index: 80;
        }
        .cat-mobile-dropdown-wrap select {
          width: 100%; appearance: none; background: #FFFFFF;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          padding: 12px 40px 12px 16px; font-size: 14px; font-weight: 600;
          color: var(--ink); box-shadow: 0 2px 8px rgba(0,0,0,0.04); outline: none;
        }
        .cat-mobile-select-icon {
          position: absolute; right: 32px; top: 50%; transform: translateY(-50%);
          pointer-events: none; font-size: 10px; color: var(--text-muted);
        }
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (max-width: 768px) {
          .cat-header { padding: 24px 16px; text-align: center; }
          .cat-header h1 { font-size: 24px !important; }
          .cat-main { padding: 16px 12px; flex-direction: column; gap: 0; }
          .cat-sidebar { display: none !important; }
          .cat-mobile-dropdown-wrap { display: block !important; }
          .cat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        @media (max-width: 380px) {
          .cat-grid { gap: 8px; }
        }
        @keyframes premiumFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .premium-card {
          animation: premiumFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .hover-scale-img img {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-scale-img:hover img {
          transform: scale(1.05);
        }
      `}</style>
      <RenterNavbar />

      {/* ━━━━━━━━ HEADER ━━━━━━━━ */}
      <div className="cat-header">
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', fontSize: '10.5px', fontWeight: 700, color: 'var(--accent)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px',
            background: 'var(--accent-light)', padding: '4px 12px', borderRadius: 'var(--radius-full)',
          }}>Archive Gallery</span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '34px', fontWeight: 700, color: 'var(--ink)' }}>
            {searchQuery ? `Search: "${searchQuery}"` : (selectedCategory === 'All' ? 'The Complete Vault' : `${selectedCategory} Archives`)}
          </h1>
        </div>
      </div>

      {/* Mobile category dropdown */}
      <div className="cat-mobile-dropdown-wrap">
        <div style={{ position: 'relative' }}>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? `All Categories (${getCategoryCount('All')})` : `${cat} (${getCategoryCount(cat)})`}
              </option>
            ))}
          </select>
          <div className="cat-mobile-select-icon">▼</div>
        </div>
      </div>

      <main className="cat-main">
        {/* ━━━━━━━━ SIDEBAR (DESKTOP) ━━━━━━━━ */}
        <aside className="cat-sidebar">
          <div style={{
            background: '#FFFFFF', padding: '22px 18px', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink)', margin: 0 }}>
                Categories
              </h3>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => { setSelectedCategory('All'); setCurrentPage(1); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Search within categories */}
            {categories.length > 6 && (
              <div className="cat-search-box">
                <span className="cat-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="cat-search-input"
                />
                {categorySearch && (
                  <button className="cat-clear-icon" onClick={() => setCategorySearch('')}>✕</button>
                )}
              </div>
            )}

            {/* Scrollable category list */}
            <div className="cat-scroll-list">
              {filteredCategories.map(cat => {
                const count = getCategoryCount(cat);
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    style={{
                      textAlign: 'left',
                      background: isSelected ? 'var(--accent-light)' : 'transparent',
                      border: 'none',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      color: isSelected ? 'var(--accent)' : 'var(--ink-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(212, 86, 122, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                        color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: 600,
                      }}>
                        {count}
                      </span>
                      {isSelected && <span style={{ fontSize: '11px', color: 'var(--accent)' }}>✓</span>}
                    </div>
                  </button>
                );
              })}
              {filteredCategories.length === 0 && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No category matches
                </div>
              )}
            </div>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  marginTop: '16px', width: '100%', background: 'none', border: '1px dashed var(--border)',
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
            marginBottom: '18px',
          }}>
            <span style={{
              fontSize: '11.5px', color: 'var(--text-muted)',
              background: 'var(--bg-warm)', padding: '4px 12px',
              borderRadius: 'var(--radius-full)', fontWeight: 600,
            }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'} available
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
                      <Link key={p.id} href={`/product/${p.id}`} className="premium-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', minWidth: 0, height: '100%', animationDelay: `${(idx % 12) * 0.05}s` }}>
                        <div className="prod-card" style={{
                          display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0,
                          background: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border)',
                          boxShadow: '0 4px 14px rgba(30,30,45,0.05)', overflow: 'hidden'
                        }}>
                          <div className="prod-img-wrap" style={{ aspectRatio: '1/1', background: 'var(--bg-warm)', position: 'relative', overflow: 'hidden' }}>
                            {idx % 2 === 0 && (
                              <span className="prod-badge" style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '8px', padding: '3.5px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.92)', color: 'var(--accent)', fontWeight: 700, zIndex: 2 }}>✨ Verified</span>
                            )}
                            <img
                              src={displayImg}
                              alt={p.title}
                              onError={(e: any) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallbackGallery[idx % fallbackGallery.length];
                              }}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            {p.stock === 0 && (
                              <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3
                              }}>
                                <span style={{
                                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                                  color: 'var(--ink)', border: '1px solid var(--ink)', padding: '6px 16px',
                                }}>Waitlist</span>
                              </div>
                            )}
                          </div>
                          <div className="prod-card-body" style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>COUTURE</span>
                              <span style={{ color: 'var(--accent)', fontSize: '7.5px' }}>•</span>
                              <span style={{ fontSize: '7.5px', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>OZONE CLEANED</span>
                            </div>
                            <h3 className="prod-title" style={{ fontFamily: 'var(--font-sans)', fontSize: '11.5px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, margin: '2px 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '30px' }}>
                              {p.title}
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed var(--border)', marginTop: 'auto' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                                  ₹{Number(p.price).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>/ 4d</span>
                              </div>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '3px 8px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase' }}>Rent</span>
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
