'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import ProvenanceTimeline from '@/components/ProvenanceTimeline';
import EventDatePicker from '@/components/EventDatePicker';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  images: string[];
  lister?: { shopName: string; user?: { rating: number } };
  Lister?: { shopName: string; user?: { rating: number } };
};

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
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
            const defaultImg = data.product.images && data.product.images.length > 0 ? data.product.images[0] : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
            setActiveImage(defaultImg);
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

  const handleCheckout = () => {
    if (!product || !bookingDate) return;
    router.push(`/checkout?productId=${product.id}&size=${selectedSize}&color=${selectedColor}&eventDate=${bookingDate}&extensionDays=${bookingExtension}`);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--ink)' }}>
        <RenterNavbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Accessing Archive…
        </main>
        <RenterFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--ink)' }}>
        <RenterNavbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--ink)' }}>Archive Not Found</h2>
          <button onClick={() => router.push('/catalog')} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '12px 24px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)', cursor: 'pointer' }}>Return to Collection</button>
        </main>
        <RenterFooter />
      </div>
    );
  }

  const listerName = product.Lister?.shopName || product.lister?.shopName || 'Atelier Collection';
  const sanitizationDate = new Date();
  sanitizationDate.setDate(sanitizationDate.getDate() - 1);
  const sanitizationDateStr = sanitizationDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <style>{`
        .pdp-main {
          flex: 1; max-width: 1440px; margin: 0 auto; width: 100%;
          padding: 56px 40px 120px; display: grid;
          grid-template-columns: 1.2fr 1fr; gap: 64px; align-items: flex-start;
        }
        .pdp-sticky { position: sticky; top: 100px; display: flex; flex-direction: column; }
        .pdp-gallery { display: flex; gap: 20px; }
        .pdp-thumbnails { display: flex; flex-direction: column; gap: 12px; }
        
        .pdp-mobile-bottom-bar {
          display: none;
          position: fixed;
          bottom: calc(60px + env(safe-area-inset-bottom, 12px));
          left: 0;
          right: 0;
          padding: 12px 16px;
          background: rgba(255, 250, 245, 0.96);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(240, 230, 224, 0.9);
          z-index: 850;
          box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .pdp-main { padding: 16px 14px 80px; gap: 28px; grid-template-columns: 1fr !important; }
          .pdp-sticky { position: static; top: auto; }
          .pdp-title { font-size: 26px !important; margin-bottom: 12px !important; line-height: 1.18 !important; }
          .pdp-gallery { flex-direction: column-reverse; gap: 12px; }
          .pdp-thumbnails {
            flex-direction: row !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
            gap: 8px;
          }
          .pdp-thumbnails::-webkit-scrollbar { display: none; }
          .pdp-thumbnails button {
            width: 60px !important;
            flex-shrink: 0;
            border-radius: 12px !important;
          }
          .pdp-main-img {
            border-radius: 20px !important;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(30, 30, 45, 0.08);
          }
          .pdp-mobile-bottom-bar {
            display: flex;
          }
        }
      `}</style>
      <RenterNavbar />

      <main className="pdp-main">
        
        {/* ━━━━━━━━ LEFT: GALLERY & PROVENANCE ━━━━━━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', width: '100%', minWidth: 0 }}>
          
          <div className="pdp-gallery">
            {/* Thumbnails */}
            <div className="pdp-thumbnails">
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  style={{ 
                    width: '72px', aspectRatio: '3/4', padding: 0, overflow: 'hidden', cursor: 'pointer',
                    background: 'transparent',
                    borderRadius: '12px',
                    border: activeImage === img ? '2px solid var(--accent)' : '1px solid var(--border)',
                    transition: 'var(--transition-smooth)',
                    opacity: activeImage === img ? 1 : 0.65
                  }}
                  className="hover-lift"
                >
                  <img src={img} alt={`${product.title} view ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
            
            {/* Main Image */}
            <div className="img-zoom-container pdp-main-img" style={{ flex: 1, background: 'var(--bg-warm)', aspectRatio: '3/4', position: 'relative', borderRadius: '20px' }}>
              <img
                src={activeImage || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'}
                alt={product.title}
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {product.stock === 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(251,250,248,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink)', border: '1.5px solid var(--ink)', padding: '10px 28px', borderRadius: 'var(--radius-full)' }}>Waitlist</span>
                </div>
              )}
            </div>
          </div>

          <ProvenanceTimeline />
        </div>

        {/* ━━━━━━━━ RIGHT: DETAILS & BOOKING ━━━━━━━━ */}
        <div className="pdp-sticky">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <p style={{ ...labelStyle, margin: 0 }}>{listerName}</p>
            {product.lister?.user?.rating && (
              <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                ★ {Number(product.lister.user.rating).toFixed(1)}
              </span>
            )}
          </div>
          
          <h1 className="pdp-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '16px' }}>
            {product.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontSize: '10px', color: 'var(--success)', fontWeight: 700, 
              background: 'rgba(13, 148, 136, 0.1)', padding: '5px 12px', 
              borderRadius: 'var(--radius-full)', letterSpacing: '0.06em', textTransform: 'uppercase' 
            }}>
              ● Ozone Sanitized ({sanitizationDateStr})
            </span>
            <span style={{
              fontSize: '10px', color: 'var(--accent)', fontWeight: 700,
              background: 'var(--accent-light)', padding: '5px 12px',
              borderRadius: 'var(--radius-full)', letterSpacing: '0.06em', textTransform: 'uppercase'
            }}>
              ✨ Verified Couture
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '28px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '34px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              / 4-Day Event Rental
            </span>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '28px' }} />

          {/* SIZES */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)' }}>Select Size</h4>
              <button style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>Size Guide</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {(product.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size']).map(s => (
                <button 
                  key={s} 
                  onClick={() => setSelectedSize(s)}
                  style={{ 
                    padding: '12px 0', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    borderRadius: '12px',
                    background: selectedSize === s ? 'var(--ink)' : '#FFFFFF',
                    color: selectedSize === s ? '#FFFFFF' : 'var(--ink)',
                    border: selectedSize === s ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                    boxShadow: selectedSize === s ? '0 4px 12px rgba(30,30,45,0.12)' : 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* EVENT DATE CALENDAR */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)', marginBottom: '12px' }}>Event Date</h4>
            <EventDatePicker 
              pricePer4Days={product.price}
              onDateSelect={(dateStr, extDays) => {
                setBookingDate(dateStr);
                setBookingExtension(extDays);
              }}
            />
          </div>

          {/* CTA */}
          <button 
            onClick={handleCheckout}
            disabled={product.stock === 0 || !bookingDate}
            style={{ 
              width: '100%', padding: '16px 24px', 
              background: (product.stock === 0 || !bookingDate) ? 'var(--border)' : 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)', 
              color: (product.stock === 0 || !bookingDate) ? 'var(--text-muted)' : '#FFFFFF', 
              fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: 'none', 
              borderRadius: 'var(--radius-full)',
              boxShadow: !(product.stock === 0 || !bookingDate) ? '0 8px 24px rgba(212,86,122,0.3)' : 'none',
              cursor: (product.stock === 0 || !bookingDate) ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-smooth)',
            }}
            className={!(product.stock === 0 || !bookingDate) ? "hover-lift" : ""}
          >
            {product.stock === 0 ? 'Waitlist' : (!bookingDate ? 'Select Event Date Above' : 'Reserve Garment →')}
          </button>

          {/* DETAILS */}
          <div style={{ marginTop: '48px', padding: '24px', background: '#FFFFFF', borderRadius: '18px', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink)', marginBottom: '10px' }}>
              Archive Notes
            </h4>
            <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--ink-secondary)', margin: 0 }}>
              {product.description}
            </p>
          </div>

        </div>
      </main>

      {/* Mobile Sticky Booking Bar */}
      <div className="pdp-mobile-bottom-bar">
        <div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>4-Day Rental</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={product.stock === 0 || !bookingDate}
          style={{
            flex: 1, padding: '12px 18px',
            background: (product.stock === 0 || !bookingDate) ? 'var(--ink)' : 'linear-gradient(135deg, #D4567A 0%, #B8405E 100%)',
            color: '#FFFFFF', fontSize: '12px', fontWeight: 700,
            borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(212,86,122,0.25)'
          }}
        >
          {product.stock === 0 ? 'Waitlist' : (!bookingDate ? 'Pick Date & Reserve' : 'Reserve Now →')}
        </button>
      </div>

      <RenterFooter />
    </div>
  );
}

