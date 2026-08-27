'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RenterNavbar from '@/components/RenterNavbar';
import RenterFooter from '@/components/RenterFooter';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';

type Shipment = { id: string; leg: string; trackingNumber: string | null; courierName: string | null; status: string; };
type DamageReport = { id: string; inspectionType: string; grade: string; deductionAmount: number; isDisputed: boolean; dispute?: { status: string } | null; };
type Booking = {
  id: string; createdAt: string; startDate: string; endDate: string; status: string; rentAmount: number; securityDeposit: number; totalAmount: number; lateReturnPenalty: number;
  product?: { title: string; images: string[]; Lister?: { shopName: string; }; };
  listing?: { title: string; baselineImages: string[]; lister?: { shopName: string; }; };
  shipments: Shipment[]; damageReports: DamageReport[];
  reviews?: { id: string; rating: number; comment: string; reviewerId: string }[];
};

type UserProfile = { id: string; name: string; email: string; phone: string; role: string; walletBalance: number; };

export default function CustomerProfile() {
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rentals' | 'wallet'>('rentals');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  const [disputeBookingId, setDisputeBookingId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const handleManualReturn = async (bookingId: string) => {
    if (!confirm('Are you sure you want to return this item early? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/orders/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Return scheduled successfully.');
        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } else {
        alert(data.error || 'Failed to schedule return.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  const handleRatingSubmit = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating: ratingValue, comment: ratingComment })
      });
      const data = await res.json();
      if (data.success) {
        alert('Review submitted successfully.');
        setRatingBookingId(null);
        setRatingValue(5);
        setRatingComment('');
        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } else {
        alert(data.error || 'Failed to submit review.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  const handleDisputeSubmit = async (bookingId: string) => {
    if (!disputeReason.trim()) return alert('Please enter a reason for the dispute.');
    try {
      const res = await fetch(`/api/user/bookings/${bookingId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason })
      });
      const data = await res.json();
      if (data.success) {
        alert('Dispute submitted successfully.');
        setDisputeBookingId(null);
        setDisputeReason('');
        // Reload bookings
        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } else {
        alert(data.error || 'Failed to submit dispute.');
      }
    } catch (e) {
      alert('An error occurred.');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const sRes = await fetch('/api/auth/session');
        const sData = await sRes.json();
        if (sData.success && sData.user) {
          setProfile(sData.user);
        } else {
          router.push('/login');
          return;
        }

        const bRes = await fetch('/api/user/bookings');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.success) setBookings(bData.bookings);
        }
      } catch (err) {
        console.error('Data loading error', err);
      } finally {
        setLoading(false);
      }
    };
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    loadData();
    return () => { document.body.removeChild(script); };
  }, [router]);

  const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink)'
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <RenterNavbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Accessing Dossier…</main>
      <RenterFooter />
    </div>
  );
  if (!profile) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{`
        .prof-main {
          flex: 1; max-width: 1440px; margin: 0 auto; width: 100%;
          padding: 64px 48px 120px; display: grid; grid-template-columns: 260px 1fr;
          gap: 80px; align-items: flex-start;
        }
        .prof-sidebar { position: sticky; top: 120px; }
        @media (max-width: 768px) {
          .prof-main {
            grid-template-columns: 1fr; gap: 32px;
            padding: 32px 20px 80px;
          }
          .prof-sidebar { position: static; }
        }
      `}</style>
      <RenterNavbar />

      <main className="prof-main">
        
        {/* LEFT PROFILE CARD */}
        <div className="prof-sidebar">
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 400, color: 'var(--ink)', marginBottom: '8px' }}>
              {profile.name}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              {profile.email}
            </div>
          </div>
            
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
            <button 
              onClick={() => setActiveTab('rentals')}
              style={{ 
                textAlign: 'left', background: 'transparent', border: 'none', 
                fontSize: '11px', fontWeight: activeTab === 'rentals' ? 600 : 400, 
                letterSpacing: '0.14em', textTransform: 'uppercase', 
                color: activeTab === 'rentals' ? 'var(--ink)' : 'var(--ink-secondary)', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <span style={{ 
                width: '6px', height: '6px', borderRadius: '50%', 
                background: activeTab === 'rentals' ? 'var(--accent)' : 'transparent',
                transition: 'background 0.3s ease'
              }} />
              Active Rentals
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              style={{ 
                textAlign: 'left', background: 'transparent', border: 'none', 
                fontSize: '11px', fontWeight: activeTab === 'wallet' ? 600 : 400, 
                letterSpacing: '0.14em', textTransform: 'uppercase', 
                color: activeTab === 'wallet' ? 'var(--ink)' : 'var(--ink-secondary)', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <span style={{ 
                width: '6px', height: '6px', borderRadius: '50%', 
                background: activeTab === 'wallet' ? 'var(--accent)' : 'transparent',
                transition: 'background 0.3s ease'
              }} />
              Wallet Balance
            </button>
          </div>
        </div>

        {/* RIGHT WORKSPACE */}
        <div style={{ flex: 1 }}>
          
          {activeTab === 'rentals' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 400, color: 'var(--ink)', marginBottom: '48px' }}>Rentals Archive</h2>
              
              {bookings.length === 0 ? (
                <div style={{ padding: '80px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, marginBottom: '12px' }}>No active bookings</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '32px' }}>Explore luxury collections and request your first reservation.</p>
                  <Link href="/catalog" style={{ 
                    background: 'var(--ink)', color: '#FFFFFF', padding: '16px 36px', fontSize: '10px', 
                    fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none',
                    display: 'inline-block', transition: 'var(--transition-smooth)'
                  }} className="hover-lift">
                    Browse Collections
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {bookings.map(b => {
                    const item: any = b.product || b.listing;
                    const img = item?.images?.[0] || item?.baselineImages?.[0] || '';
                    const title = item?.title || 'Unknown Garment';
                    const lister = item?.Lister?.shopName || item?.lister?.shopName || 'Atelier Collection';
                    
                    return (
                      <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex' }}>
                        <div style={{ width: '160px', background: 'var(--bg-warm)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>By {lister}</div>
                              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 400, color: 'var(--ink)' }}>{title}</h3>
                            </div>
                            <StatusBadge status={b.status} />
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', fontSize: '13px', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                            <div>
                              <span style={{ display: 'block', color: 'var(--ink-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px' }}>Registry ID</span>
                              <strong style={{ fontWeight: 500 }}>#{b.id.substring(0,8).toUpperCase()}</strong>
                            </div>
                            <div>
                              <span style={{ display: 'block', color: 'var(--ink-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px' }}>Event Date</span>
                              <strong style={{ fontWeight: 500 }}>{new Date(b.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                            </div>
                            <div>
                              <span style={{ display: 'block', color: 'var(--ink-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '6px' }}>Rental Package</span>
                              <strong style={{ fontWeight: 500 }}>₹{b.totalAmount.toLocaleString('en-IN')}</strong>
                            </div>
                          </div>

                          {b.status === 'IN_USE' && (
                            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleManualReturn(b.id)}
                                style={{ background: 'var(--ink)', color: '#FFFFFF', padding: '10px 24px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', border: 'none' }}
                                className="hover-lift"
                              >
                                Return Item Early
                              </button>
                            </div>
                          )}

                          {b.status === 'COMPLETED' && (
                            <div style={{
                              marginTop: '32px', background: 'var(--bg-warm)', padding: '20px 24px', fontSize: '13px'
                            }}>
                              <h4 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px', color: 'var(--ink)' }}>Deposit Refund Summary</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)' }}>
                                  <span>Initial Security Deposit</span>
                                  <span>₹{b.securityDeposit.toLocaleString('en-IN')}</span>
                                </div>
                                {b.damageReports?.map(dr => dr.deductionAmount > 0 && (
                                  <div key={dr.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--alert)' }}>
                                    <span>Damage Deduction ({dr.grade})</span>
                                    <span>-₹{Number(dr.deductionAmount).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                                {b.lateReturnPenalty > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--alert)' }}>
                                    <span>Late Fee Deductions</span>
                                    <span>-₹{b.lateReturnPenalty.toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, color: 'var(--ink)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                                  <span>Refunded to Wallet</span>
                                  <span style={{ color: 'var(--success)' }}>
                                    ₹{(b.securityDeposit - b.lateReturnPenalty - (b.damageReports?.reduce((sum, dr) => sum + Number(dr.deductionAmount), 0) || 0)).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Renter Rating Flow */}
                              {(() => {
                                const submittedReview = b.reviews?.find(r => r.reviewerId === profile?.id);
                                if (submittedReview) {
                                  return (
                                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                      <h4 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px', color: 'var(--ink)' }}>Your Rating for Lister</h4>
                                      <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px' }}>
                                        {Array(submittedReview.rating).fill('★').join('')}
                                      </div>
                                      {submittedReview.comment && <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', marginTop: '4px' }}>"{submittedReview.comment}"</p>}
                                    </div>
                                  );
                                }

                                const isRating = ratingBookingId === b.id;
                                if (isRating) {
                                  return (
                                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                      <h4 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px', color: 'var(--ink)' }}>Rate Your Experience</h4>
                                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        {[1,2,3,4,5].map(star => (
                                          <button 
                                            key={star} 
                                            onClick={() => setRatingValue(star)} 
                                            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: star <= ratingValue ? '#F59E0B' : '#E5E7EB' }}
                                          >
                                            ★
                                          </button>
                                        ))}
                                      </div>
                                      <textarea 
                                        placeholder="Add an optional comment..." 
                                        value={ratingComment} 
                                        onChange={e => setRatingComment(e.target.value)} 
                                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px', marginBottom: '12px', minHeight: '60px' }}
                                      />
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleRatingSubmit(b.id)} style={{ background: 'var(--ink)', color: '#fff', border: 'none', padding: '6px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Submit</button>
                                        <button onClick={() => { setRatingBookingId(null); setRatingValue(5); setRatingComment(''); }} style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--border)', padding: '6px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>Cancel</button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <button 
                                      onClick={() => setRatingBookingId(b.id)} 
                                      style={{ background: 'var(--ink)', color: '#fff', border: 'none', padding: '8px 16px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                                    >
                                      Rate Lister
                                    </button>
                                  </div>
                                );
                              })()}
                              
                              {/* Renter Dispute Flow */}
                              {(() => {
                                const deductibleReport = b.damageReports?.find(dr => dr.deductionAmount > 0);
                                if (!deductibleReport) return null;
                                
                                if (deductibleReport.dispute) {
                                  return (
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)', fontSize: '11px', color: 'var(--alert)', fontWeight: 600, letterSpacing: '0.05em' }}>
                                      DISPUTE {deductibleReport.dispute.status}
                                    </div>
                                  );
                                }
                                const isDisputing = disputeBookingId === b.id;

                                return (
                                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                                    {!isDisputing ? (
                                      <button 
                                        onClick={() => setDisputeBookingId(b.id)}
                                        style={{ background: 'transparent', border: '1px solid var(--border)', padding: '6px 12px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', color: 'var(--ink)' }}
                                      >
                                        Dispute this charge
                                      </button>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <textarea 
                                          value={disputeReason}
                                          onChange={e => setDisputeReason(e.target.value)}
                                          placeholder="Explain why you are disputing this deduction..."
                                          style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', background: '#FFF', fontSize: '12px', minHeight: '60px', fontFamily: 'inherit' }}
                                        />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <button 
                                            onClick={() => handleDisputeSubmit(b.id)}
                                            style={{ background: 'var(--ink)', color: '#FFF', border: 'none', padding: '6px 16px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                                          >
                                            Submit Dispute
                                          </button>
                                          <button 
                                            onClick={() => { setDisputeBookingId(null); setDisputeReason(''); }}
                                            style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '6px 12px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {bookings.length > ITEMS_PER_PAGE && (
                <div style={{ marginTop: '32px' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalItems={bookings.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '42px', fontWeight: 400, color: 'var(--ink)', marginBottom: '48px' }}>Platform Wallet</h2>
              
              <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '48px 0', marginBottom: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '64px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: '12px' }}>
                      Available Capital
                    </span>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '56px', fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}>
                      ₹{Number(profile.walletBalance).toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <div style={{ width: '1px', height: '80px', background: 'var(--border)' }} />
                  
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: '12px' }}>
                      Linked Device
                    </span>
                    <div style={{ fontSize: '18px', fontWeight: 400, color: 'var(--ink)' }}>
                      {profile.phone}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '24px', color: 'var(--ink)' }}>Usage Limits</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '600px' }}>
                  This wallet securely holds your platform credits and security deposit refunds (in case bank transfers fail). 
                  Balances here are automatically applied toward your next luxury rental checkout. 
                  Note: Voluntary cash loading is disabled per RBI Prepaid Payment Instrument (PPI) regulations. We recommend using Razorpay's saved cards/UPI feature for fast checkouts instead.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

      <RenterFooter />
    </div>
  );
}
