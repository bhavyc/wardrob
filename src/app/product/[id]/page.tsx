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
        const data = await res.json();
        if (data.success && data.product) {
          setProduct(data.product);
          setActiveImage(data.product.images[0] || '');
          setSelectedSize(data.product.sizes?.[0] || 'Free Size');
          setSelectedColor(data.product.colors?.[0] || 'Default');
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
      <RenterNavbar />

      <main style={{ 
        flex: 1, maxWidth: '1440px', margin: '0 auto', width: '100%', 
        padding: '64px 48px 120px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'flex-start' 
      }}>
        
        {/* ━━━━━━━━ LEFT: GALLERY & PROVENANCE ━━━━━━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Thumbnails */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  style={{ 
                    width: '72px', aspectRatio: '3/4', padding: 0, overflow: 'hidden', cursor: 'pointer',
                    background: 'transparent',
                    border: activeImage === img ? '1px solid var(--ink)' : '1px solid transparent',
                    transition: 'var(--transition-smooth)',
                    opacity: activeImage === img ? 1 : 0.6
                  }}
                  className="hover-lift"
                >
                  <img src={img} alt={`${product.title} view ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
            
            {/* Main Image */}
            <div className="img-zoom-container" style={{ flex: 1, background: 'var(--bg-warm)', aspectRatio: '3/4', position: 'relative' }}>
              <img src={activeImage} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {product.stock === 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(251,250,248,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)', border: '1px solid var(--ink)', padding: '12px 32px' }}>Waitlist</span>
                </div>
              )}
            </div>
          </div>

          <ProvenanceTimeline />
        </div>

        {/* ━━━━━━━━ RIGHT: DETAILS & BOOKING ━━━━━━━━ */}
        <div style={{ position: 'sticky', top: '120px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <p style={{ ...labelStyle, margin: 0 }}>{listerName}</p>
            {product.lister?.user?.rating && (
              <span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                ★ {Number(product.lister.user.rating).toFixed(1)}
              </span>
            )}
          </div>
          
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 400, color: 'var(--ink)', lineHeight: 1.1, marginBottom: '24px' }}>
            {product.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <span style={{ 
              fontSize: '10px', color: 'var(--success)', fontWeight: 600, 
              background: 'rgba(74, 124, 89, 0.1)', padding: '6px 12px', 
              letterSpacing: '0.08em', textTransform: 'uppercase' 
            }}>
              ● Ozone Sanitized ({sanitizationDateStr})
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '40px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', paddingBottom: '4px' }}>
              / 4-Day Rental
            </span>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '40px' }} />

          {/* SIZES */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink)' }}>Select Size</h4>
              <button style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--ink-secondary)', textDecoration: 'underline', cursor: 'pointer' }}>Size Guide</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {(product.sizes && product.sizes.length > 0 ? product.sizes : ['Free Size']).map(s => (
                <button 
                  key={s} 
                  onClick={() => setSelectedSize(s)}
                  style={{ 
                    padding: '14px 0', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', cursor: 'pointer',
                    background: selectedSize === s ? 'var(--ink)' : 'transparent',
                    color: selectedSize === s ? '#FFFFFF' : 'var(--ink)',
                    border: selectedSize === s ? '1px solid var(--ink)' : '1px solid var(--border)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* EVENT DATE CALENDAR */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink)', marginBottom: '16px' }}>Event Date</h4>
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
              width: '100%', padding: '20px', 
              background: (product.stock === 0 || !bookingDate) ? 'var(--border)' : 'var(--ink)', 
              color: (product.stock === 0 || !bookingDate) ? 'var(--text-muted)' : '#FFFFFF', 
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', border: 'none', 
              cursor: (product.stock === 0 || !bookingDate) ? 'not-allowed' : 'pointer',
              transition: 'var(--transition-smooth)',
            }}
            className={!(product.stock === 0 || !bookingDate) ? "hover-lift" : ""}
          >
            {product.stock === 0 ? 'Waitlist' : (!bookingDate ? 'Select Event Date' : 'Reserve Garment')}
          </button>

          {/* DETAILS */}
          <div style={{ marginTop: '64px' }}>
            <h4 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink)', marginBottom: '16px' }}>
              Archive Notes
            </h4>
            <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--ink-secondary)' }}>
              {product.description}
            </p>
          </div>

        </div>
      </main>

      <RenterFooter />
    </div>
  );
}
