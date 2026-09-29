'use client';

import { useState, useEffect } from 'react';
import Pagination from '@/components/Pagination';
import './hub-shipments.css';

type Shipment = {
  id: string;
  leg: 'LISTER_TO_HUB' | 'HUB_TO_RENTER' | 'RENTER_TO_HUB' | 'HUB_TO_LISTER';
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'PICKUP_FAILED';
  courierName: string | null;
  trackingNumber: string | null;
  distanceZone: string | null;
  deliveryFeeCalculated: number | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    listing: {
      title: string;
      category?: string;
      size?: string;
      sku?: string;
      baselineImages?: string[];
      lister?: {
        user: { name: string; phone: string }
      }
    };
    renter: { name: string; phone: string };
    shippingAddress?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    contactPhone?: string | null;
    contactName?: string | null;
  }
};

type ActiveFilterLeg = 'ALL' | 'LISTER_TO_HUB' | 'HUB_TO_RENTER' | 'RENTER_TO_HUB' | 'HUB_TO_LISTER';

export default function HubShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeLegTab, setActiveLegTab] = useState<ActiveFilterLeg>('LISTER_TO_HUB');
  const [filterMode, setFilterMode] = useState<'ACTIVE' | 'DELIVERED'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCourier, setEditCourier] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [updating, setUpdating] = useState(false);

  // Next Step Guidance Modal State
  type NextStepGuidance = {
    title: string;
    icon: 'inbound' | 'return' | 'dispatch' | 'settle';
    badge: string;
    garmentTitle: string;
    bookingId: string;
    description: string;
    actionText: string;
    actionUrl: string;
  };
  const [nextStepModal, setNextStepModal] = useState<NextStepGuidance | null>(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  // Deep Link: Auto-select tab and open modal if bookingId is in query params
  useEffect(() => {
    if (typeof window !== 'undefined' && shipments.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetBookingId = params.get('bookingId');
      const targetLeg = params.get('leg');
      if (targetLeg) {
        setActiveLegTab(targetLeg as ActiveFilterLeg);
      }
      if (targetBookingId) {
        const matchingShipment = shipments.find(s => s.booking.id === targetBookingId && (!targetLeg || s.leg === targetLeg));
        if (matchingShipment && !editingShipment) {
          startEdit(matchingShipment);
        }
      }
    }
  }, [shipments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeLegTab, filterMode]);

  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/hub/shipments');
      const data = await res.json();
      if (res.ok && data.success) {
        setShipments(data.shipments || []);

        // If there are no Lister pickups, but there are Renter dispatches, auto-select Renter tab
        const listerPickups = (data.shipments || []).filter((s: Shipment) => s.leg === 'LISTER_TO_HUB' && s.status !== 'DELIVERED');
        const renterDispatches = (data.shipments || []).filter((s: Shipment) => s.leg === 'HUB_TO_RENTER' && s.status !== 'DELIVERED');
        if (listerPickups.length === 0 && renterDispatches.length > 0) {
          setActiveLegTab('HUB_TO_RENTER');
        }
      } else {
        setError(data.error || 'Failed to load shipments');
      }
    } catch (err) {
      setError('Network error loading shipments');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (s: Shipment) => {
    setEditingShipment(s);
    setEditStatus(s.status);
    setEditCourier(s.courierName || '');
    setEditTracking(s.trackingNumber || '');
  };

  const cancelEdit = () => {
    setEditingShipment(null);
  };

  const handleUpdate = async () => {
    if (!editingShipment) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/hub/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: editingShipment.id,
          status: editStatus,
          courierName: editCourier,
          trackingNumber: editTracking
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShipments(prev => prev.map(s => s.id === editingShipment.id ? { ...s, ...data.shipment } : s));
        const updated = editingShipment;
        const newStatus = editStatus;
        setEditingShipment(null);
        fetchShipments();

        // ──── GUIDANCE: Prompt next required step for the operator ────
        if (updated.leg === 'LISTER_TO_HUB' && newStatus === 'DELIVERED') {
          setNextStepModal({
            title: '📦 Parcel Received at Hub!',
            icon: 'inbound',
            badge: 'Leg 1 Complete ➔ Next: Intake QC',
            garmentTitle: updated.booking.listing.title,
            bookingId: updated.booking.id,
            description: "Lister's parcel has arrived safely at Central Hub. Next step: capture baseline photos and attach the tamper-proof Barcode tag.",
            actionText: '📸 Open Intake QC for this Garment',
            actionUrl: `/hub/inspections?stage=INTAKE&bookingId=${updated.booking.id}&sku=${encodeURIComponent(updated.booking.listing.sku || '')}`,
          });
        } else if (updated.leg === 'RENTER_TO_HUB' && newStatus === 'DELIVERED') {
          setNextStepModal({
            title: '🔄 Return Parcel Received at Hub!',
            icon: 'return',
            badge: 'Leg 3 Complete ➔ Next: Return QC',
            garmentTitle: updated.booking.listing.title,
            bookingId: updated.booking.id,
            description: "Garment has returned from the Renter. Next step: examine the garment for damages or stains to complete return QC and settle the security deposit.",
            actionText: '🔍 Start Return QC & Damage Check',
            actionUrl: `/hub/inspections?stage=POST_RETURN&bookingId=${updated.booking.id}`,
          });
        }
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Network error updating shipment');
    } finally {
      setUpdating(false);
    }
  };

  const getLegInfo = (leg: string) => {
    switch(leg) {
      case 'LISTER_TO_HUB':
        return {
          title: 'Leg 1: Lister ➔ Central Hub',
          desc: 'Incoming parcel from Lister for QC intake and tagging',
          badgeClass: 'leg-lister-hub',
          icon: '📦',
        };
      case 'HUB_TO_RENTER':
        return {
          title: 'Leg 2: Central Hub ➔ Renter',
          desc: 'Sanitized outfit dispatch to customer for event',
          badgeClass: 'leg-hub-renter',
          icon: '🚚',
        };
      case 'RENTER_TO_HUB':
        return {
          title: 'Leg 3: Renter ➔ Central Hub',
          desc: 'Return collection from customer back to hub for QC check',
          badgeClass: 'leg-renter-hub',
          icon: '🔄',
        };
      case 'HUB_TO_LISTER':
        return {
          title: 'Leg 4: Central Hub ➔ Lister',
          desc: 'Return shipment of outfit back to original owner',
          badgeClass: 'leg-hub-lister',
          icon: '🏠',
        };
      default:
        return { title: leg, desc: '', badgeClass: '', icon: '🚚' };
    }
  };

  // Counts for each leg
  const counts = {
    all: shipments.filter(s => filterMode === 'ACTIVE' ? s.status !== 'DELIVERED' : s.status === 'DELIVERED').length,
    listerToHub: shipments.filter(s => s.leg === 'LISTER_TO_HUB' && (filterMode === 'ACTIVE' ? s.status !== 'DELIVERED' : s.status === 'DELIVERED')).length,
    hubToRenter: shipments.filter(s => s.leg === 'HUB_TO_RENTER' && (filterMode === 'ACTIVE' ? s.status !== 'DELIVERED' : s.status === 'DELIVERED')).length,
    renterToHub: shipments.filter(s => s.leg === 'RENTER_TO_HUB' && (filterMode === 'ACTIVE' ? s.status !== 'DELIVERED' : s.status === 'DELIVERED')).length,
    hubToLister: shipments.filter(s => s.leg === 'HUB_TO_LISTER' && (filterMode === 'ACTIVE' ? s.status !== 'DELIVERED' : s.status === 'DELIVERED')).length,
  };

  // Filtered shipments
  const filteredShipments = shipments
    .filter(s => {
      // 1. Status Filter (Active vs Delivered)
      if (filterMode === 'ACTIVE' && s.status === 'DELIVERED') return false;
      if (filterMode === 'DELIVERED' && s.status !== 'DELIVERED') return false;

      // 2. Leg Tab Filter
      if (activeLegTab !== 'ALL' && s.leg !== activeLegTab) return false;

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (s.booking.listing.title || '').toLowerCase();
        const bookingId = (s.booking.id || '').toLowerCase();
        const lister = (s.booking.listing.lister?.user?.name || '').toLowerCase();
        const renter = (s.booking.renter?.name || '').toLowerCase();
        const tracking = (s.trackingNumber || '').toLowerCase();
        const courier = (s.courierName || '').toLowerCase();
        return (
          title.includes(q) ||
          bookingId.includes(q) ||
          lister.includes(q) ||
          renter.includes(q) ||
          tracking.includes(q) ||
          courier.includes(q)
        );
      }
      return true;
    });

  if (loading) {
    return (
      <div className="ship-loading-box">
        <div className="ship-spinner" />
        <p>Loading Deliveries & Logistics...</p>
      </div>
    );
  }

  return (
    <div className="ship-page-wrap">
      {/* Top Header */}
      <div className="ship-header-row">
        <div>
          <span className="ship-tag">Wardrob Logistics & Courier Dispatch</span>
          <h1 className="ship-h1">Deliveries & Logistics Management</h1>
          <p className="ship-sub">
            Track and manage all 4 delivery legs: Lister pickups, Renter dispatches, return collections, and owner returns.
          </p>
        </div>

        {/* Status Mode Toggle (Active vs Delivered) */}
        <div className="ship-status-toggle">
          <button
            className={`ship-toggle-btn ${filterMode === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => { setFilterMode('ACTIVE'); setCurrentPage(1); }}
          >
            Active In-Flight ({shipments.filter(s => s.status !== 'DELIVERED').length})
          </button>
          <button
            className={`ship-toggle-btn ${filterMode === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => { setFilterMode('DELIVERED'); setCurrentPage(1); }}
          >
            Completed / Delivered ({shipments.filter(s => s.status === 'DELIVERED').length})
          </button>
        </div>
      </div>

      {/* Manual Courier Callout Banner */}
      <div className="ship-disclaimer-box">
        <span className="ship-disclaimer-icon">🚚</span>
        <div className="ship-disclaimer-text">
          <strong>Physical Courier Arrangements:</strong>
          <span>
            Hub staff arranges local courier pickups (Porter, Borzo, Delhivery, or local runner). Once a pickup is booked or parcel arrives, update the courier name and status below.
          </span>
        </div>
      </div>

      {/* 4-Leg Navigation Bar */}
      <div className="ship-stage-tabs">
        <button
          className={`ship-stage-pill ${activeLegTab === 'LISTER_TO_HUB' ? 'active leg1' : ''}`}
          onClick={() => { setActiveLegTab('LISTER_TO_HUB'); setCurrentPage(1); }}
        >
          <span className="ship-stage-pill-icon">📦</span>
          <div className="ship-stage-pill-text">
            <span className="ship-stage-pill-title">Leg 1: Lister Pickups</span>
            <span className="ship-stage-pill-sub">Lister ➔ Central Hub</span>
          </div>
          <span className="ship-stage-pill-count">{counts.listerToHub}</span>
        </button>

        <button
          className={`ship-stage-pill ${activeLegTab === 'HUB_TO_RENTER' ? 'active leg2' : ''}`}
          onClick={() => { setActiveLegTab('HUB_TO_RENTER'); setCurrentPage(1); }}
        >
          <span className="ship-stage-pill-icon">🚚</span>
          <div className="ship-stage-pill-text">
            <span className="ship-stage-pill-title">Leg 2: Renter Dispatches</span>
            <span className="ship-stage-pill-sub">Central Hub ➔ Renter</span>
          </div>
          <span className="ship-stage-pill-count">{counts.hubToRenter}</span>
        </button>

        <button
          className={`ship-stage-pill ${activeLegTab === 'RENTER_TO_HUB' ? 'active leg3' : ''}`}
          onClick={() => { setActiveLegTab('RENTER_TO_HUB'); setCurrentPage(1); }}
        >
          <span className="ship-stage-pill-icon">🔄</span>
          <div className="ship-stage-pill-text">
            <span className="ship-stage-pill-title">Leg 3: Renter Returns</span>
            <span className="ship-stage-pill-sub">Renter ➔ Central Hub</span>
          </div>
          <span className="ship-stage-pill-count">{counts.renterToHub}</span>
        </button>

        <button
          className={`ship-stage-pill ${activeLegTab === 'HUB_TO_LISTER' ? 'active leg4' : ''}`}
          onClick={() => { setActiveLegTab('HUB_TO_LISTER'); setCurrentPage(1); }}
        >
          <span className="ship-stage-pill-icon">🏠</span>
          <div className="ship-stage-pill-text">
            <span className="ship-stage-pill-title">Leg 4: Return to Lister</span>
            <span className="ship-stage-pill-sub">Central Hub ➔ Lister</span>
          </div>
          <span className="ship-stage-pill-count">{counts.hubToLister}</span>
        </button>

        <button
          className={`ship-stage-pill ${activeLegTab === 'ALL' ? 'active leg-all' : ''}`}
          onClick={() => { setActiveLegTab('ALL'); setCurrentPage(1); }}
        >
          <span className="ship-stage-pill-icon">📋</span>
          <div className="ship-stage-pill-text">
            <span className="ship-stage-pill-title">All Deliveries</span>
            <span className="ship-stage-pill-sub">Full Stream</span>
          </div>
          <span className="ship-stage-pill-count">{counts.all}</span>
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="ship-toolbar">
        <div className="ship-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="ship-search-input"
            placeholder="Search by dress title, booking ID, Lister, Renter, or AWB tracking..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="ship-clear-search">
              ✕ Clear
            </button>
          )}
        </div>

        <button className="ship-refresh-btn" onClick={fetchShipments} title="Refresh Shipments">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="ship-error-banner">⚠️ {error}</div>}

      {/* Shipments List */}
      {filteredShipments.length === 0 ? (
        <div className="ship-empty-card">
          <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>📦</span>
          <h3>No Shipments Found</h3>
          <p>There are no deliveries matching the selected leg or search criteria.</p>
        </div>
      ) : (
        <div className="ship-cards-grid">
          {filteredShipments
            .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
            .map(s => {
              const legInfo = getLegInfo(s.leg);
              const listing = s.booking.listing;
              const dressThumb = listing?.baselineImages?.[0] || null;

              const deliveryDate = new Date(s.booking.startDate);
              const returnPickupDate = new Date(s.booking.endDate);
              const eventDate = new Date(returnPickupDate);
              eventDate.setDate(eventDate.getDate() - 2);

              return (
                <div key={s.id} className="ship-garment-card">
                  {/* Left: Garment Image Thumbnail */}
                  <div className="ship-card-media">
                    {dressThumb ? (
                      <img src={dressThumb} alt={listing.title} className="ship-card-img" />
                    ) : (
                      <div className="ship-card-placeholder">👗</div>
                    )}
                    {listing.size && <span className="ship-card-size">{listing.size}</span>}
                  </div>

                  {/* Center: Details */}
                  <div className="ship-card-content">
                    <div className="ship-card-top">
                      <div className="ship-card-headline">
                        <span className={`ship-leg-chip ${legInfo.badgeClass}`}>
                          {legInfo.icon} {legInfo.title}
                        </span>
                        <h3 className="ship-card-title">{listing.title || 'Luxury Garment'}</h3>
                        <div className="ship-booking-ref">
                          <span className="ship-code">#{s.booking.id.slice(-8).toUpperCase()}</span>
                          {listing.sku && <span className="ship-sku-pill">SKU: {listing.sku}</span>}
                        </div>
                      </div>
                      <span className={`ship-status-badge status-${s.status.toLowerCase()}`}>
                        {s.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* From / To Contact Details (Leg-Accurate) */}
                    <div className="ship-parties-grid">
                      {s.leg === 'LISTER_TO_HUB' && (
                        <>
                          <div className="ship-party-box">
                            <span className="ship-party-role">Pickup Origin (Lister)</span>
                            <div className="ship-party-name">{listing.lister?.user?.name || 'Registered Lister'}</div>
                            <div className="ship-party-phone">📞 {listing.lister?.user?.phone || 'No phone'}</div>
                          </div>
                          <div className="ship-party-box">
                            <span className="ship-party-role">Destination (Central Hub)</span>
                            <div className="ship-party-name">Wardrob Central Hub</div>
                            <div className="ship-party-phone">🏢 Intake & QC Station</div>
                          </div>
                        </>
                      )}

                      {s.leg === 'HUB_TO_RENTER' && (
                        <>
                          <div className="ship-party-box">
                            <span className="ship-party-role">Origin (Central Hub)</span>
                            <div className="ship-party-name">Wardrob Central Hub</div>
                            <div className="ship-party-phone">✨ Sanitized & Sealed</div>
                          </div>
                          <div className="ship-party-box" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                            <span className="ship-party-role" style={{ color: '#0284c7', fontWeight: 700 }}>Destination (Renter Delivery)</span>
                            <div className="ship-party-name">{s.booking.contactName || s.booking.renter?.name || 'Renter'}</div>
                            <div className="ship-party-phone">📞 {s.booking.contactPhone || s.booking.renter?.phone || 'No phone'}</div>
                            {s.booking.shippingAddress ? (
                              <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>
                                📍 <strong>{s.booking.shippingAddress}</strong>, {s.booking.city}, {s.booking.state} - <strong>{s.booking.pincode}</strong>
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>Address: Not recorded</div>
                            )}
                          </div>
                        </>
                      )}

                      {s.leg === 'RENTER_TO_HUB' && (
                        <>
                          <div className="ship-party-box" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                            <span className="ship-party-role" style={{ color: '#d97706', fontWeight: 700 }}>Pickup Origin (Renter Return)</span>
                            <div className="ship-party-name">{s.booking.contactName || s.booking.renter?.name || 'Renter'}</div>
                            <div className="ship-party-phone">📞 {s.booking.contactPhone || s.booking.renter?.phone || 'No phone'}</div>
                            {s.booking.shippingAddress && (
                              <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>
                                📍 <strong>{s.booking.shippingAddress}</strong>, {s.booking.city}, {s.booking.state} - <strong>{s.booking.pincode}</strong>
                              </div>
                            )}
                          </div>
                          <div className="ship-party-box">
                            <span className="ship-party-role">Destination (Central Hub)</span>
                            <div className="ship-party-name">Wardrob Central Hub</div>
                            <div className="ship-party-phone">🔍 Post-Return QC & Audit</div>
                          </div>
                        </>
                      )}

                      {s.leg === 'HUB_TO_LISTER' && (
                        <>
                          <div className="ship-party-box">
                            <span className="ship-party-role">Origin (Central Hub)</span>
                            <div className="ship-party-name">Wardrob Central Hub</div>
                            <div className="ship-party-phone">🏠 Returned to Owner</div>
                          </div>
                          <div className="ship-party-box">
                            <span className="ship-party-role">Destination (Lister)</span>
                            <div className="ship-party-name">{listing.lister?.user?.name || 'Registered Lister'}</div>
                            <div className="ship-party-phone">📞 {listing.lister?.user?.phone || 'No phone'}</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Transparent Dates Grid */}
                    <div className="ship-dates-banner">
                      <div className="ship-date-item highlight">
                        <span className="ship-date-lbl">Event:</span>
                        <strong className="ship-date-val">
                          {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </strong>
                      </div>
                      <div className="ship-date-item">
                        <span className="ship-date-lbl">Delivery by:</span>
                        <strong className="ship-date-val">
                          {deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </strong>
                      </div>
                      <div className="ship-date-item">
                        <span className="ship-date-lbl">Return:</span>
                        <strong className="ship-date-val">
                          {returnPickupDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Logistics Status & Action */}
                  <div className="ship-card-logistics">
                    <div className="ship-logistics-info-card">
                      <div className="ship-li-row">
                        <span className="ship-li-label">Courier:</span>
                        <span className="ship-li-val">{s.courierName || 'Not Assigned'}</span>
                      </div>
                      <div className="ship-li-row">
                        <span className="ship-li-label">AWB / Tracking:</span>
                        <span className="ship-li-val tracking">{s.trackingNumber || 'Pending'}</span>
                      </div>
                    </div>

                    <button
                      className="ship-update-btn"
                      onClick={() => startEdit(s)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      <span>Update Courier & Status</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Pagination */}
      {filteredShipments.length > ITEMS_PER_PAGE && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredShipments.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Edit Courier & Tracking Modal */}
      {editingShipment && (
        <div className="modal-overlay">
          <div className="modal-content ship-modal">
            <div className="ship-modal-header">
              <div>
                <h3 className="ship-modal-title">Update Courier & Tracking</h3>
                <p className="ship-modal-sub">
                  {getLegInfo(editingShipment.leg).title} • {editingShipment.booking.listing.title}
                </p>
              </div>
              <button className="modal-close" onClick={cancelEdit}>✕</button>
            </div>

            <div className="ship-modal-body">
              {/* Delivery Leg Explainer */}
              <div className="ship-modal-leg-tip">
                <strong>{getLegInfo(editingShipment.leg).icon} {getLegInfo(editingShipment.leg).title}:</strong>
                <p>{getLegInfo(editingShipment.leg).desc}</p>
                {editingShipment.leg === 'LISTER_TO_HUB' && (
                  <div className="ship-tip-highlight">
                    💡 <strong>Next Step Tip:</strong> When you set status to <strong>DELIVERED</strong>, the item is physically inside the Hub and will instantly appear in <strong>Inspections Tab 1</strong> for Quality Intake & Barcode Tagging.
                  </div>
                )}
                {editingShipment.leg === 'HUB_TO_RENTER' && editingShipment.booking.shippingAddress && (
                  <div className="ship-tip-highlight" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                    📦 <strong>Delivery Address for Courier:</strong><br />
                    <strong>{editingShipment.booking.contactName || editingShipment.booking.renter?.name}</strong> (📞 {editingShipment.booking.contactPhone || editingShipment.booking.renter?.phone})<br />
                    {editingShipment.booking.shippingAddress}, {editingShipment.booking.city}, {editingShipment.booking.state} - {editingShipment.booking.pincode}
                  </div>
                )}
              </div>

              <div className="ship-form-group">
                <label className="ship-form-lbl">Delivery / Logistics Status *</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="ship-form-select"
                >
                  <option value="PENDING">PENDING (Pickup Scheduled)</option>
                  <option value="PICKED_UP">PICKED_UP (Courier has parcel)</option>
                  <option value="IN_TRANSIT">IN_TRANSIT (On the way)</option>
                  <option value="DELIVERED">DELIVERED (Successfully Handed Over)</option>
                  <option value="PICKUP_FAILED">PICKUP_FAILED (Lister/Customer Unavailable)</option>
                  <option value="FAILED">FAILED (Delivery Attempt Failed)</option>
                </select>
              </div>

              <div className="ship-form-group">
                <label className="ship-form-lbl">Courier Partner</label>
                <div className="ship-courier-presets">
                  {['Porter', 'Borzo (WeFast)', 'Delhivery', 'BlueDart', 'In-House Runner'].map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`ship-preset-pill ${editCourier === c ? 'active' : ''}`}
                      onClick={() => setEditCourier(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or type courier name..."
                  value={editCourier}
                  onChange={e => setEditCourier(e.target.value)}
                  className="ship-form-input"
                />
              </div>

              <div className="ship-form-group">
                <label className="ship-form-lbl">AWB Tracking Number / Driver Phone</label>
                <input
                  type="text"
                  placeholder="e.g. PORTER-892182 or Courier Contact"
                  value={editTracking}
                  onChange={e => setEditTracking(e.target.value)}
                  className="ship-form-input"
                />
              </div>
            </div>

            <div className="ship-modal-footer">
              <button className="ship-btn-cancel" onClick={cancelEdit}>
                Cancel
              </button>
              <button
                className="ship-btn-submit"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? 'Saving Changes...' : 'Save & Update Tracking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── NEXT STEP GUIDANCE MODAL ──── */}
      {nextStepModal && (
        <div className="guidance-overlay" onClick={() => setNextStepModal(null)}>
          <div className="guidance-box" onClick={e => e.stopPropagation()}>
            <div className={`guidance-icon-circle guidance-icon-${nextStepModal.icon}`}>
              {nextStepModal.icon === 'inbound' && '📦'}
              {nextStepModal.icon === 'return' && '🔄'}
              {nextStepModal.icon === 'dispatch' && '🚚'}
              {nextStepModal.icon === 'settle' && '✓'}
            </div>
            <h3 className="guidance-title">{nextStepModal.title}</h3>
            <span className="guidance-badge">{nextStepModal.badge}</span>

            <div className="guidance-item-card">
              <div className="guidance-item-title">{nextStepModal.garmentTitle}</div>
              <div className="guidance-item-meta">Booking ID: #BKG-{nextStepModal.bookingId.slice(0, 8)}</div>
            </div>

            <p className="guidance-instruction">{nextStepModal.description}</p>

            <div className="guidance-actions">
              <a href={nextStepModal.actionUrl} className="guidance-primary-btn">
                {nextStepModal.actionText} ➔
              </a>
              <button className="guidance-secondary-btn" onClick={() => setNextStepModal(null)}>
                Stay on Deliveries / Do Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
