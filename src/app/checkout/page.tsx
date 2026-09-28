'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import './checkout.css';

type Product = {
  id: string;
  title: string;
  price: number;
  securityDeposit: number;
  sizes: string[];
  colors: string[];
  images: string[];
  lister?: { shopName: string; };
  Lister?: { shopName: string; };
};

type UserSession = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  walletBalance: number;
  idVerified: boolean;
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productId = searchParams.get('productId');
  const size = searchParams.get('size') || 'Free Size';
  const color = searchParams.get('color') || 'Default';
  const qEventDate = searchParams.get('eventDate') || '';
  const qExtensionDays = parseInt(searchParams.get('extensionDays') || '0', 10);

  const [product, setProduct] = useState<Product | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  const [eventDate, setEventDate] = useState(qEventDate);
  const [extensionDays, setExtensionDays] = useState(qExtensionDays);
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [useWallet, setUseWallet] = useState(true);

  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!productId) {
        setError('No garment selected for rental checkout.');
        setLoading(false);
        return;
      }
      try {
        const pRes = await fetch(`/api/products/${productId}`);
        const pData = await pRes.json();
        if (pRes.ok && pData.success) {
          setProduct(pData.product);
        } else {
          setError(pData.error || 'Failed to retrieve product details.');
        }

        const sRes = await fetch('/api/auth/session');
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.success && sData.user) {
            // Strict 1-role enforcement: only RENTER accounts can rent.
            if (sData.user.role !== 'RENTER') {
              setError(
                `Your account is registered as a ${sData.user.role.replace('_', ' ')}. Only Renter accounts can access the checkout. Please log in with a Renter account or register a new one.`
              );
            } else {
              setSession(sData.user);
              if (sData.user.name) setContactName(sData.user.name);
              if (sData.user.phone) setContactPhone(sData.user.phone);
            }
          } else {
            setShowAuthModal(true);
          }
        } else {
          setShowAuthModal(true);
        }
      } catch {
        setError('Network connectivity error.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [productId, router, size, color, qEventDate, qExtensionDays]);


  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    const cName = (contactName || session?.name || '').trim();
    const cPhone = (contactPhone || session?.phone || '').trim();
    const sAddr = shippingAddress.trim();
    const cCity = city.trim();
    const cState = state.trim();
    const cPin = pincode.trim();

    if (!cName || !cPhone || !sAddr || !cCity || !cState || !cPin) {
      setError('All fields are mandatory: Recipient Name, Mobile, Street Address, City, State, and Pincode.');
      return;
    }

    if (cPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cPin.replace(/\D/g, '').length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setCheckoutLoading(true);
    setError('');

    try {
      const orderRes = await fetch('/api/checkout/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          size, color,
          shippingAddress: sAddr,
          city: cCity,
          state: cState,
          pincode: cPin,
          contactName: cName,
          contactPhone: cPhone,
          eventDate, extensionDays,
          paymentType: 'PREPAID',
          useWallet,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Booking generation failed.');
      }

      // 100% Wallet Payment: Instant Confirmation without Gateway
      if (orderData.isWalletFullPayment) {
        const confirmedId = orderData.bookingId || orderData.orderId || `WRD-${Date.now().toString(36).toUpperCase()}`;
        setPlacedOrderId(confirmedId);
        setCheckoutSuccess(true);
        return;
      }

      const options = {
        key: orderData.keyId || 'rzp_test_mock_key',
        amount: orderData.amount, // already in paise
        currency: orderData.currency || 'INR',
        name: 'WARDROB Concierge',
        description: `Rental Reservation: ${product.title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verRes = await fetch('/api/checkout/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              productId: product.id,
              eventDate,
              extensionDays,
            }),
          });
          const verData = await verRes.json();
          if (verRes.ok && verData.success) {
            const confirmedId = verData.order?.id || orderData.orderId || `WRD-${Date.now().toString(36).toUpperCase()}`;
            setPlacedOrderId(confirmedId);
            setCheckoutSuccess(true);
          } else {
            setError(verData.error || 'Secure payment authentication failed.');
          }
        },
        prefill: { name: session.name, email: session.email, contact: session.phone },
        theme: { color: '#1A1A1A' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please verify shipping attributes.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)', display: 'block', marginBottom: '8px'
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--ink)' }}>
      <RenterNavbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Preparing secure gateway…</main>
      <RenterFooter />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--ink)' }}>
      <RenterNavbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--alert)', fontSize: '14px' }}>{error}</p>
        <button onClick={() => router.push('/catalog')} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '12px 24px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)', cursor: 'pointer' }}>Return to Collection</button>
      </main>
      <RenterFooter />
    </div>
  );

  if (checkoutSuccess && product) {
    const displayId = placedOrderId ? (placedOrderId.length > 10 ? placedOrderId.substring(0, 10).toUpperCase() : placedOrderId.toUpperCase()) : 'WRD-CONFIRMED';
    const targetEventDate = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'As Scheduled';

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--ink)' }}>
        <RenterNavbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
          <div className="checkout-success-card" style={{
            background: '#FFFFFF',
            padding: '40px 28px',
            border: '1px solid rgba(226, 214, 206, 0.85)',
            borderRadius: '24px',
            textAlign: 'center',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 48px rgba(30, 30, 45, 0.08)'
          }}>
            {/* Animated Luxury Badge */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(212, 86, 122, 0.15), rgba(212, 86, 122, 0.05))',
              border: '2px solid rgba(212, 86, 122, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '28px'
            }}>
              ✨
            </div>

            <p style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
              Reservation Confirmed
            </p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '34px', fontWeight: 700, marginBottom: '14px', color: 'var(--ink)', lineHeight: 1.15 }}>
              Archive Secured
            </h1>

            {/* Reference Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-warm)', padding: '6px 14px', borderRadius: '999px',
              border: '1px solid rgba(226, 214, 206, 0.8)',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Booking Ref:</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'monospace' }}>#{displayId}</span>
            </div>

            {/* Product Mini Preview Box */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: '#FAF8F5', padding: '16px', borderRadius: '16px',
              border: '1px solid rgba(226, 214, 206, 0.75)',
              textAlign: 'left', marginBottom: '28px'
            }}>
              <div style={{ width: '60px', height: '75px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#EAE5E0' }}>
                <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', margin: '0 0 2px', fontWeight: 500 }}>
                  Size: {size} • Color: {color}
                </p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                  Event Date: {targetEventDate}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link href="/profile" style={{ 
                background: 'var(--ink)', color: '#FFFFFF', padding: '16px 24px', fontSize: '11.5px', 
                fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none',
                borderRadius: '999px', display: 'block', transition: 'var(--transition-smooth)',
                boxShadow: '0 6px 18px rgba(30, 30, 45, 0.12)'
              }} className="hover-lift">
                View in Your Wardrobe →
              </Link>
              <Link href="/catalog" style={{ 
                background: 'transparent', color: 'var(--ink)', padding: '12px 24px', fontSize: '10.5px', 
                fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
                borderRadius: '999px', border: '1px solid rgba(226, 214, 206, 0.9)', display: 'block'
              }}>
                Explore More Couture
              </Link>
            </div>
          </div>
        </main>
        <RenterFooter />
      </div>
    );
  }

  if (!product) return null;

  const basePrice = Number(product.price) || 0;
  const deposit = Number(product.securityDeposit) || 3000;
  const extensionFee = extensionDays > 0 ? (basePrice * 0.25 * extensionDays) : 0;
  const rentalCharge = basePrice + extensionFee;
  const grossTotal = Math.max(1, Math.round(rentalCharge + deposit));
  const userWalletBalance = Number(session?.walletBalance || 0);
  const walletDeduction = (useWallet && userWalletBalance > 0) ? Math.min(userWalletBalance, grossTotal) : 0;
  const finalPayable = Math.max(0, grossTotal - walletDeduction);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <RenterNavbar />
      
      <main className="checkout-main">
        
        {/* LEFT PANEL: FORM */}
        <div className="checkout-form-col">
          <h1 className="checkout-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '40px', fontWeight: 700, color: 'var(--ink)', marginBottom: '36px' }}>Rental Registry</h1>
          
          <form onSubmit={handlePlaceOrder}>
            {/* Shipping */}
            <div className="checkout-section-box" style={{ marginBottom: '48px' }}>
              <h3 style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '20px', color: 'var(--text-muted)' }}>Shipping Destination</h3>
              
              <div className="checkout-addr-grid" style={{ marginBottom: '18px' }}>
                <div>
                  <label style={labelStyle}>Recipient Name *</label>
                  <input required value={contactName} onChange={e => setContactName(e.target.value)} className="checkout-field-input" placeholder="Full Name (Required)" />
                </div>
                <div>
                  <label style={labelStyle}>Contact Mobile * (10 digits)</label>
                  <input required type="tel" maxLength={10} value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="checkout-field-input" placeholder="10-digit mobile (Required)" />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Street Address *</label>
                <input required value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="checkout-field-input" placeholder="Suite, Flat, or Street Landmark (Required)" />
              </div>
              
              <div className="checkout-addr-grid">
                <div>
                  <label style={labelStyle}>City *</label>
                  <input required value={city} onChange={e => setCity(e.target.value)} className="checkout-field-input" placeholder="e.g. Delhi" />
                </div>
                <div>
                  <label style={labelStyle}>State *</label>
                  <input required value={state} onChange={e => setState(e.target.value)} className="checkout-field-input" placeholder="e.g. Delhi NCR" />
                </div>
                <div>
                  <label style={labelStyle}>Pincode * (6 digits)</label>
                  <input required maxLength={6} value={pincode} onChange={e => setPincode(e.target.value)} className="checkout-field-input" placeholder="e.g. 110001" />
                </div>
              </div>
            </div>

            {/* Rental Scope */}
            <div className="checkout-section-box" style={{ marginBottom: '48px', borderTop: '1px solid var(--border)', paddingTop: '36px' }}>
              <h3 style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '20px', color: 'var(--text-muted)' }}>Rental Scope</h3>
              <div className="checkout-scope-grid">
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid rgba(226, 214, 206, 0.75)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Event Date</span>
                  <strong style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '14px' }}>{new Date(eventDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                </div>
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid rgba(226, 214, 206, 0.75)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rental Package</span>
                  <strong style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '14px' }}>{extensionDays > 0 ? `4 Days + ${extensionDays} Extension Days` : 'Standard 4-Day Event'}</strong>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={checkoutLoading} 
              style={{ 
                width: '100%', padding: '18px 24px', 
                background: 'var(--ink)', color: '#FFFFFF', fontSize: '12px', fontWeight: 700, 
                letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                borderRadius: '999px',
                transition: 'var(--transition-smooth)',
                boxShadow: '0 8px 24px rgba(30,30,45,0.12)'
              }}
              className={!checkoutLoading ? "hover-lift" : ""}
            >
              {checkoutLoading 
                ? 'Processing Reservation…' 
                : finalPayable === 0 
                  ? 'Confirm Reservation with Wallet (₹0 Due)' 
                  : `Authorize & Reserve · ₹${finalPayable.toLocaleString('en-IN')}`}
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: SUMMARY */}
        <div className="checkout-summary-col">
          <div className="checkout-summary-box">
            <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '24px', color: 'var(--ink)' }}>Order Summary</h3>
            
            {/* Item */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '80px', aspectRatio: '3/4', background: 'var(--bg-warm)', overflow: 'hidden' }}>
                <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, color: 'var(--ink)', marginBottom: '8px' }}>{product.title}</h4>
                <div style={{ fontSize: '10px', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                  Size: {size} | Color: {color}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>₹{product.price.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Wallet Balance Auto-Deduction Card */}
            {session && userWalletBalance > 0 && (
              <div style={{
                marginBottom: '24px',
                padding: '16px 18px',
                background: useWallet ? '#F0FDF4' : 'var(--bg-warm)',
                border: useWallet ? '1px solid #86EFAC' : '1px solid var(--border)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: useWallet ? '#166534' : 'var(--ink)' }}>
                      Wardrob Wallet
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      background: useWallet ? '#DCFCE7' : 'rgba(0,0,0,0.06)',
                      color: useWallet ? '#15803D' : 'var(--text-muted)',
                      padding: '2px 8px',
                      borderRadius: '99px'
                    }}>
                      Balance: ₹{userWalletBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', margin: '4px 0 0 0' }}>
                    {useWallet
                      ? (walletDeduction >= grossTotal 
                          ? 'Full order covered by wallet credit' 
                          : `₹${walletDeduction.toLocaleString('en-IN')} auto-deducted from balance`)
                      : 'Apply available balance to reduce order total'}
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={useWallet}
                    onChange={(e) => setUseWallet(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#166534', cursor: 'pointer' }}
                  />
                </label>
              </div>
            )}

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)' }}>
                <span>Event Package Rent (4 Days)</span>
                <span>₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              {extensionDays > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)' }}>
                  <span>Extension Fee ({extensionDays} Days)</span>
                  <span>₹{extensionFee.toLocaleString('en-IN')}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)' }}>
                  <span>Refundable Security Deposit</span>
                  <span>₹{deposit.toLocaleString('en-IN')}</span>
                </div>
                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  * Released to wallet after return assessment.
                </span>
              </div>

              {walletDeduction > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803D', fontWeight: 600 }}>
                  <span>Wallet Credit Applied</span>
                  <span>-₹{walletDeduction.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: 'var(--ink)' }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 500, display: 'block' }}>Total Due</span>
                {walletDeduction > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    ₹{grossTotal.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, lineHeight: 1 }}>
                ₹{finalPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* ━━━━━━━━ AUTH MODAL ━━━━━━━━ */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(26, 26, 26, 0.4)', backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: '#FFFFFF', padding: '48px', width: '100%', maxWidth: '440px',
            borderRadius: 'var(--radius-lg)', boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
            textAlign: 'center', position: 'relative'
          }}>
            <button 
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none',
                fontSize: '20px', color: 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 400, color: 'var(--ink)', marginBottom: '16px' }}>
              Authentication Required
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              Please sign in to your Wardrob account to reserve this garment and complete your checkout securely.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
              <button 
                onClick={() => router.push(`/login?redirect=/checkout?productId=${product?.id}&size=${size}&color=${color}&eventDate=${eventDate}&extensionDays=${extensionDays}`)}
                style={{ 
                  background: 'var(--ink)', color: '#FFFFFF', padding: '16px', fontSize: '11px', 
                  fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', 
                  border: 'none', cursor: 'pointer', transition: 'var(--transition-smooth)'
                }}
                className="hover-lift"
              >
                Sign In to Continue
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ 
                  background: 'transparent', color: 'var(--ink)', padding: '16px', fontSize: '11px', 
                  fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', 
                  border: '1px solid var(--border)', cursor: 'pointer', transition: 'var(--transition-smooth)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <RenterFooter />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: '100px 0', textAlign: 'center', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Preparing secure gateway…</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
