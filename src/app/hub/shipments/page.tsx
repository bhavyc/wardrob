'use client';
import { useState, useEffect } from 'react';

type Shipment = {
  id: string;
  leg: string;
  status: string;
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
    listing: {
      title: string;
      lister: {
        user: { name: string; phone: string }
      }
    };
    renter: { name: string; phone: string };
  }
};

import Pagination from '@/components/Pagination';
import './hub-shipments.css';

export default function HubShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeTab, setActiveTab] = useState<'renter' | 'lister'>('renter');
  const [filterMode, setFilterMode] = useState<'ACTIVE' | 'DELIVERED'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCourier, setEditCourier] = useState('');
  const [editTracking, setEditTracking] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/hub/shipments');
      const data = await res.json();
      if (res.ok && data.success) {
        setShipments(data.shipments);
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
    setEditingId(s.id);
    setEditStatus(s.status);
    setEditCourier(s.courierName || '');
    setEditTracking(s.trackingNumber || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch('/api/hub/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: id,
          status: editStatus,
          courierName: editCourier,
          trackingNumber: editTracking
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShipments(prev => prev.map(s => s.id === id ? { ...s, ...data.shipment } : s));
        setEditingId(null);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Network error updating shipment');
    }
  };

  const getLegTitle = (leg: string) => {
    switch(leg) {
      case 'LISTER_TO_HUB': return 'Leg 1: Lister ➔ Hub';
      case 'HUB_TO_RENTER': return 'Leg 2: Hub ➔ Renter';
      case 'RENTER_TO_HUB': return 'Leg 3: Renter ➔ Hub';
      case 'HUB_TO_LISTER': return 'Leg 4: Hub ➔ Lister';
      default: return leg;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PICKED_UP': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_TRANSIT': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>Loading Shipments...</div>;

  const renterShipments = shipments.filter(s => s.leg === 'HUB_TO_RENTER' || s.leg === 'RENTER_TO_HUB');
  const listerShipments = shipments.filter(s => s.leg === 'LISTER_TO_HUB' || s.leg === 'HUB_TO_LISTER');
  let displayedShipments = activeTab === 'renter' ? renterShipments : listerShipments;

  displayedShipments = displayedShipments.filter(s => 
    filterMode === 'ACTIVE' ? s.status !== 'DELIVERED' : s.status === 'DELIVERED'
  );

  return (
    <>
      <div className="ship-header">
        <h1 className="ship-h1">Shipments & Deliveries</h1>
        <div className="ship-sub">Track and manage 4-leg logistics</div>
      </div>

      {/* MVP Logistics Disclaimer */}
      <div style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0369A1', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🚚</span>
        <div>
          <strong style={{ display: 'block', marginBottom: '4px', color: '#075985' }}>Action Required: Arrange Pickups Manually</strong>
          Since real courier API integration is pending, <strong>Hub Staff is responsible for arranging physical pickups</strong>. Please call a local courier or book a service like Porter to pick up the item, and then update the tracking/status here once it is physically picked up.
        </div>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>{error}</div>}

      <div className="ship-tabs">
        <div 
          className={`ship-tab ${activeTab === 'renter' ? 'active' : ''}`}
          onClick={() => { setActiveTab('renter'); setCurrentPage(1); }}
        >
          Renter Deliveries
        </div>
        <div 
          className={`ship-tab ${activeTab === 'lister' ? 'active' : ''}`}
          onClick={() => { setActiveTab('lister'); setCurrentPage(1); }}
        >
          Lister Deliveries
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, animation: 'pageFadeIn 0.4s ease 0.05s both' }}>
        <button onClick={() => { setFilterMode('ACTIVE'); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: filterMode === 'ACTIVE' ? '#0F172A' : '#F1F5F9', color: filterMode === 'ACTIVE' ? '#FFFFFF' : '#64748B' }}>Active Shipments</button>
        <button onClick={() => { setFilterMode('DELIVERED'); setCurrentPage(1); }} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: filterMode === 'DELIVERED' ? '#0F172A' : '#F1F5F9', color: filterMode === 'DELIVERED' ? '#FFFFFF' : '#64748B' }}>Completed / Delivered</button>
      </div>

      {displayedShipments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: '#FFF', borderRadius: '16px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
          No deliveries found for this category.
        </div>
      )}

      {displayedShipments.length > 0 && (
        <>
          <div className="ship-grid">
            {displayedShipments
              .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
              .map((s) => (
              <div key={s.id} className="ship-card">
                <div className="ship-card-head">
                  <div>
                    <span className="ship-leg-badge">{getLegTitle(s.leg)}</span>
                    <h3 className="ship-title">{s.booking.listing.title}</h3>
                    <div className="ship-booking-id">Booking ID: <span>{s.booking.id}</span></div>
                  </div>
                  <div className={`ship-status status-${s.status}`}>
                    {s.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="ship-body">
                  <div>
                    <div className="ship-section-title">From / To Details</div>
                    <div className="ship-text">
                      <strong>Lister:</strong> {s.booking.listing.lister.user.name} <br/>
                      <span className="ship-text-muted">{s.booking.listing.lister.user.phone}</span>
                    </div>
                    <div style={{ height: '1px', background: '#E2E8F0', margin: '12px 0' }}></div>
                    <div className="ship-text">
                      <strong>Renter:</strong> {s.booking.renter.name} <br/>
                      <span className="ship-text-muted">{s.booking.renter.phone}</span>
                    </div>
                    
                    <div style={{ marginTop: '24px' }}>
                      <div className="ship-section-title">Rental Dates</div>
                      <div className="ship-text" style={{ fontWeight: 600 }}>
                        {new Date(s.booking.startDate).toLocaleDateString('en-IN', {day:'numeric', month:'short'})} ➔ {new Date(s.booking.endDate).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}
                      </div>
                    </div>
                  </div>

                  {editingId === s.id ? (
                    <div className="edit-form">
                      <div className="edit-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Update Tracking Info
                      </div>
                      
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Status</label>
                          <select className="form-input" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                            <option value="PENDING">Pending</option>
                            <option value="PICKED_UP">Picked Up</option>
                            <option value="IN_TRANSIT">In Transit</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="FAILED">Failed</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Courier Name</label>
                          <input type="text" className="form-input" value={editCourier} onChange={e => setEditCourier(e.target.value)} placeholder="e.g. BlueDart" />
                        </div>
                        <div className="form-group full">
                          <label className="form-label">Tracking Number (AWB)</label>
                          <input type="text" className="form-input mono" value={editTracking} onChange={e => setEditTracking(e.target.value)} placeholder="e.g. BD123456789" />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button onClick={cancelEdit} className="btn-cancel">Cancel</button>
                        <button onClick={() => handleUpdate(s.id)} className="btn-save">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="ship-section-title">Logistics Info</div>
                        <div className="ship-info-box">
                          <div className="ship-info-row">
                            <span className="ship-info-label">Courier</span>
                            <span className="ship-info-val">{s.courierName || <span style={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 400 }}>Not Assigned</span>}</span>
                          </div>
                          <div className="ship-info-row" style={{ marginTop: '12px' }}>
                            <span className="ship-info-label">AWB Number</span>
                            <span className="ship-info-val">
                              {s.trackingNumber ? <span className="mono">{s.trackingNumber}</span> : <span style={{ color: '#94A3B8', fontStyle: 'italic', fontWeight: 400 }}>N/A</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ship-action-col">
                        <div style={{ width: '100%', textAlign: 'right' }}>
                          {s.dispatchedAt && (
                            <div className="ship-timestamp ts-dispatched">
                              Dispatched: {new Date(s.dispatchedAt).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'})}
                            </div>
                          )}
                          {s.deliveredAt && (
                            <div className="ship-timestamp ts-delivered">
                              Delivered: {new Date(s.deliveredAt).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'})}
                            </div>
                          )}
                        </div>
                        
                        <button onClick={() => startEdit(s)} className="ship-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          Update Tracking
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={displayedShipments.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </>
  );
}
