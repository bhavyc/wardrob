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

export default function AdminShipmentsPage() {
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
      <style>{`
        @keyframes pageFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        
        .ship-header { margin-bottom: 32px; animation: pageFadeIn 0.4s ease both; }
        .ship-h1 { font-family: var(--font-inter), sans-serif; font-size: 32px; font-weight: 800; color: #0F172A; margin-bottom: 8px; letter-spacing: -0.02em; }
        .ship-sub { font-size: 14px; color: #64748B; font-weight: 500; }
        
        .ship-tabs { display: flex; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid #E2E8F0; }
        .ship-tab { padding: 12px 24px; font-size: 14px; font-weight: 600; color: #64748B; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .ship-tab.active { color: #0F172A; border-bottom-color: #0F172A; }
        
        .ship-grid { display: grid; gap: 24px; animation: pageFadeIn 0.4s ease 0.1s both; }
        
        .ship-card { background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(15,23,42,0.08); overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .ship-card-head { padding: 20px 24px; border-bottom: 1px solid rgba(15,23,42,0.06); background: #F8FAFC; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        
        .ship-leg-badge { display: inline-block; background: #0F172A; color: #FFF; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
        .ship-title { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
        .ship-booking-id { font-size: 12px; color: #64748B; font-weight: 500; }
        .ship-booking-id span { font-family: monospace; background: rgba(15,23,42,0.04); padding: 2px 6px; border-radius: 4px; color: #475569; }
        
        .ship-status { padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .status-PENDING { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
        .status-PICKED_UP { background: #DBEAFE; color: #1E40AF; border: 1px solid #BFDBFE; }
        .status-IN_TRANSIT { background: #E0E7FF; color: #3730A3; border: 1px solid #C7D2FE; }
        .status-DELIVERED { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
        .status-FAILED { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
        
        .ship-body { padding: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
        @media (max-width: 900px) { .ship-body { grid-template-columns: 1fr; gap: 20px; } }
        
        .ship-section-title { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .ship-text { font-size: 14px; color: #334155; line-height: 1.6; }
        .ship-text strong { color: #0F172A; }
        .ship-text-muted { font-size: 13px; color: #64748B; margin-top: 4px; }
        
        .ship-info-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; }
        .ship-info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .ship-info-row:last-child { margin-bottom: 0; }
        .ship-info-label { color: #64748B; font-weight: 500; }
        .ship-info-val { color: #0F172A; font-weight: 600; }
        .ship-info-val.mono { font-family: monospace; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        
        .ship-action-col { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; }
        @media (max-width: 900px) { .ship-action-col { align-items: flex-start; gap: 16px; } }
        
        .ship-timestamp { font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px; }
        .ts-dispatched { background: #F1F5F9; color: #475569; }
        .ts-delivered { background: #ECFDF5; color: #059669; }
        
        .ship-btn { padding: 10px 20px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 13px; font-weight: 600; color: #0F172A; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .ship-btn:hover { background: #F8FAFC; border-color: #CBD5E1; }
        
        /* Edit Form */
        .edit-form { grid-column: span 2; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; }
        @media (max-width: 900px) { .edit-form { grid-column: span 1; } }
        .edit-title { font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
        
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-input { padding: 12px; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 14px; color: #0F172A; background: #FFFFFF; outline: none; transition: all 0.2s; }
        .form-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .form-input.mono { font-family: monospace; font-weight: 600; letter-spacing: 1px; }
        
        .form-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .btn-cancel { padding: 10px 20px; background: transparent; border: none; font-size: 13px; font-weight: 600;  color: #64748B; cursor: pointer; }
        .btn-cancel:hover { color: #0F172A; }
        .btn-save { padding: 10px 24px; background: #0F172A; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: #FFFFFF; cursor: pointer; transition: all 0.2s; }
        .btn-save:hover { background: #1E293B; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        
        .empty-state { text-align: center; padding: 60px 20px; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 16px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
        .empty-title { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 8px; }
        .empty-desc { font-size: 14px; color: #64748B; }
      `}</style>

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
                        <div>
                          <label className="form-lbl">Status</label>
                          <select className="form-inp" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                            <option value="PICKUP_SCHEDULED">PICKUP_SCHEDULED</option>
                            <option value="IN_TRANSIT">IN_TRANSIT</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-lbl">Courier Partner</label>
                          <input className="form-inp" type="text" value={editCourier} onChange={e => setEditCourier(e.target.value)} placeholder="e.g. Porter / BlueDart" />
                        </div>
                        <div>
                          <label className="form-lbl">AWB / Tracking Number</label>
                          <input className="form-inp" type="text" value={editTracking} onChange={e => setEditTracking(e.target.value)} placeholder="e.g. WARD-18239" />
                        </div>
                      </div>

                      <div className="btn-row">
                        <button className="btn btn-save" onClick={() => handleUpdate(s.id)}>Save Updates</button>
                        <button className="btn btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="ship-section-title">Current Tracking Details</div>
                      
                      <div className="info-box">
                        <div className="info-label">Courier</div>
                        <div className="info-val">{s.courierName || 'Unassigned'}</div>
                      </div>

                      <div className="info-box">
                        <div className="info-label">Tracking Number</div>
                        <div className="info-val">{s.trackingNumber || 'Pending Generation'}</div>
                      </div>

                      <div className="info-box">
                        <div className="info-label">Distance / Fee</div>
                        <div className="info-val">
                          {s.distanceZone || 'Standard Zone'} {s.deliveryFeeCalculated ? `(₹${s.deliveryFeeCalculated})` : ''}
                        </div>
                      </div>

                      <div className="info-box">
                        <div className="info-label">Dispatch Time</div>
                        <div className="info-val">{s.dispatchedAt ? new Date(s.dispatchedAt).toLocaleString('en-IN', {dateStyle:'short', timeStyle:'short'}) : 'Not Dispatched'}</div>
                      </div>

                      <div className="info-box">
                        <div className="info-label">Delivered Time</div>
                        <div className="info-val">{s.deliveredAt ? new Date(s.deliveredAt).toLocaleString('en-IN', {dateStyle:'short', timeStyle:'short'}) : 'Not Delivered'}</div>
                      </div>

                      <button className="btn-edit" onClick={() => startEdit(s)}>
                        ✎ Update Status & Courier
                      </button>
                    </div>
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
