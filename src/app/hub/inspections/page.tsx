'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LiveCameraCapture from '@/components/LiveCameraCapture';

type PhotoUpload = {
  id: string;
  localUrl: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  remoteUrl?: string;
};


export default function HubInspections() {
  const router = useRouter();
  const [intake, setIntake] = useState<any[]>([]);
  const [preDispatch, setPreDispatch] = useState<any[]>([]);
  const [postReturn, setPostReturn] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [inspectionType, setInspectionType] = useState<'LISTER_TO_HUB_INTAKE' | 'PRE_DISPATCH' | 'POST_RETURN' | null>(null);
  const [grade, setGrade] = useState('A_NO_ISSUE');
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [isItemComplete, setIsItemComplete] = useState(true);
  const [missingPartsDescription, setMissingPartsDescription] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedSku, setGeneratedSku] = useState(''); // To display QR after intake

  // Live Camera states
  const [evidencePhotos, setEvidencePhotos] = useState<PhotoUpload[]>([]);
  const [uploading, setUploading] = useState(false); // To track if ANY are currently uploading


  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mobileCheck = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || process.env.NODE_ENV === 'development';
    setIsMobile(mobileCheck);
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/hub/bookings');
      if (res.status === 403 || res.status === 401) {
        router.push('/hub/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setIntake(data.intakeBookings || []);
        setPreDispatch(data.preDispatchBookings || []);
        setPostReturn(data.postReturnBookings || []);
      } else {
        setError(data.error || 'Failed to load bookings');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (booking: any, type: 'LISTER_TO_HUB_INTAKE' | 'PRE_DISPATCH' | 'POST_RETURN') => {
    setActiveBooking(booking);
    setInspectionType(type);
    setGrade('A_NO_ISSUE');
    setDeductionAmount(0);
    setIsItemComplete(true);
    setMissingPartsDescription('');
    setShelfLocation(booking.listing?.shelfLocation || '');
    setEvidencePhotos([]);
    setGeneratedSku('');
  };

  const closeModal = () => {
    setActiveBooking(null);
    setInspectionType(null);
  };

  const processUploadQueue = useCallback(async () => {
    // Find first pending item
    const pendingItem = evidencePhotos.find(p => p.status === 'pending');
    if (!pendingItem) {
      setUploading(false);
      return;
    }

    setUploading(true);
    // Mark as uploading
    setEvidencePhotos(prev => prev.map(p => p.id === pendingItem.id ? { ...p, status: 'uploading' } : p));

    try {
      const formData = new FormData();
      formData.append('file', pendingItem.file);
      formData.append('bookingId', activeBooking?.id || `hub-temp-${Date.now()}`);
      
      const localRes = await fetch('/api/uploads/hub-inspection-photo', {
        method: 'POST',
        body: formData
      });
      const localData = await localRes.json();
      
      if (localRes.ok && localData.success) {
        setEvidencePhotos(prev => prev.map(p => p.id === pendingItem.id ? { ...p, status: 'success', remoteUrl: localData.url } : p));
      } else {
        setEvidencePhotos(prev => prev.map(p => p.id === pendingItem.id ? { ...p, status: 'error' } : p));
      }
    } catch (err) {
      console.error(err);
      setEvidencePhotos(prev => prev.map(p => p.id === pendingItem.id ? { ...p, status: 'error' } : p));
    }
  }, [evidencePhotos, activeBooking]);

  useEffect(() => {
    // If there's a pending item and we aren't currently uploading, process it
    const hasPending = evidencePhotos.some(p => p.status === 'pending');
    const isCurrentlyUploading = evidencePhotos.some(p => p.status === 'uploading');
    
    if (hasPending && !isCurrentlyUploading) {
      processUploadQueue();
    } else if (!hasPending && !isCurrentlyUploading) {
      setUploading(false);
    }
  }, [evidencePhotos, processUploadQueue]);

  const handleCapture = async (blob: Blob, base64: string) => {
    const isSimulation = base64.startsWith('http');
    const file = new File([blob], `hub_inspect_${Date.now()}.jpg`, { type: 'image/jpeg' });
    const localUrl = isSimulation ? base64 : URL.createObjectURL(blob);
    
    const newUpload: PhotoUpload = {
      id: Math.random().toString(36).substring(7),
      localUrl,
      file,
      status: isSimulation ? 'success' : 'pending',
      remoteUrl: isSimulation ? base64 : undefined
    };

    setEvidencePhotos(prev => [...prev, newUpload]);
  };

  const retryUpload = (id: string) => {
    setEvidencePhotos(prev => prev.map(p => p.id === id ? { ...p, status: 'pending' } : p));
  };


  const handleInspectionSubmit = async () => {
    if (!activeBooking || !inspectionType) return;
    
    // Validation: Post return inspections that note damage must have photo evidence
    if (inspectionType === 'POST_RETURN' && grade !== 'A_NO_ISSUE' && evidencePhotos.length === 0) {
      alert('Please capture photo evidence for minor or major damage reports.');
      return;
    }

    const hasIncompleteUploads = evidencePhotos.some(p => p.status !== 'success');
    if (hasIncompleteUploads) {
      alert('Please wait for all photos to finish uploading or retry failed uploads.');
      return;
    }

    const finalPhotoUrls = evidencePhotos.map(p => p.remoteUrl as string);

    setSubmitting(true);
    try {
      const res = await fetch('/api/hub/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: activeBooking.id,
          inspectionType,
          grade: inspectionType === 'POST_RETURN' ? grade : undefined,
          deductionAmount: inspectionType === 'POST_RETURN' ? deductionAmount : 0,
          isItemComplete: inspectionType === 'POST_RETURN' ? isItemComplete : true,
          missingPartsDescription: inspectionType === 'POST_RETURN' ? missingPartsDescription : '',
          evidencePhotos: finalPhotoUrls,
          shelfLocation
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.sku) {
          setGeneratedSku(data.sku);
        } else {
          alert(data.message || 'Inspection submitted successfully');
          closeModal();
          fetchBookings();
        }
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error submitting inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Loading Inspections...</div>;

  return (
    <>
      <style>{`
        @keyframes pageFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .insp-h1 { font-family: var(--font-inter), sans-serif; font-size: 32px; font-weight: 800; color: #0F172A; margin-bottom: 8px; letter-spacing: -0.02em; animation: pageFadeIn 0.4s ease both; }
        .insp-sub { font-size: 14px; color: #64748B; font-weight: 500; margin-bottom: 32px; animation: pageFadeIn 0.4s ease 0.1s both; }

        .insp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; animation: pageFadeIn 0.4s ease 0.2s both; }
        @media (max-width: 900px) { .insp-grid { grid-template-columns: 1fr; } }

        .insp-col { background: #FFFFFF; border-radius: 16px; border: 1px solid rgba(15,23,42,0.08); overflow: hidden; display: flex; flex-direction: column; }
        .insp-col-head { padding: 16px 20px; border-bottom: 1px solid rgba(15,23,42,0.06); display: flex; align-items: center; justify-content: space-between; }
        .insp-col-title { font-size: 13px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.05em; }
        .insp-col-count { background: #F1F5F9; color: #64748B; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        
        .insp-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; background: #F8FAFC; }
        .insp-card { background: #FFFFFF; border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .insp-card-title { font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .insp-card-meta { font-size: 12px; color: #64748B; margin-bottom: 12px; }
        .insp-btn { width: 100%; padding: 10px; background: #3B82F6; color: #FFF; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .insp-btn:hover { background: #2563EB; }
        
        /* Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
        .modal-content { background: #FFFFFF; border-radius: 20px; width: 800px; max-width: 100%; max-height: 90vh; overflow-y: auto; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-close { background: #F1F5F9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748B; transition: all 0.2s; }
        .modal-close:hover { background: #E2E8F0; color: #0F172A; }

        .modal-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; margin-top: 24px; }
        @media (max-width: 768px) { 
          .modal-grid { grid-template-columns: 1fr; gap: 24px; } 
          .modal-content { padding: 20px; border-radius: 16px; max-height: 85vh; }
          .insp-h1 { font-size: 24px; }
          .insp-sub { font-size: 13px; margin-bottom: 24px; }
          .modal-overlay { padding: 12px; }
        }
        
        .m-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #3B82F6; margin-bottom: 16px; }
        .chk-label { display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: #334155; margin-bottom: 12px; cursor: pointer; line-height: 1.4; }
        
        .grade-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 768px) { .grade-grid { grid-template-columns: 1fr; gap: 8px; } }

        .grade-btn { padding: 12px; border: 1px solid #E2E8F0; border-radius: 10px; background: #FFFFFF; cursor: pointer; text-align: center; transition: all 0.2s; }
        .grade-btn.active { background: #0F172A; border-color: #0F172A; color: #FFFFFF; }
        .grade-btn span { display: block; font-size: 10px; color: #64748B; margin-top: 4px; }
        .grade-btn.active span { color: #94A3B8; }

        .input-text { width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 13px; outline: none; }
        .input-text:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        
        .modal-actions {
          display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #E2E8F0; padding-top: 24px; margin-top: 32px;
        }
        @media (max-width: 480px) {
          .modal-actions { flex-direction: column; align-items: stretch; }
          .modal-actions button { width: 100%; padding: 14px 24px; }
        }
      `}</style>

      <h1 className="insp-h1">Inspection Queue</h1>
      <p className="insp-sub">Process items for intake, dispatch sanitization, and return quality grading.</p>

      {error && <div style={{ padding: 16, background: '#FEF2F2', color: '#991B1B', borderRadius: 8, marginBottom: 24 }}>{error}</div>}

      {!isMobile ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 16, padding: '60px 24px', textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Mobile Device Required</h2>
          <p style={{ fontSize: 14, color: '#64748B', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            Please open this dashboard on your mobile phone to perform inspections. High-quality live capture for evidence requires a mobile camera.
          </p>
        </div>
      ) : (
        <>
          <div className="insp-grid">
        {/* INTAKE */}
        <div className="insp-col">
          <div className="insp-col-head">
            <span className="insp-col-title">1. Intake</span>
            <span className="insp-col-count">{intake.length}</span>
          </div>
          <div className="insp-list">
            {intake.length === 0 && <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No pending intake</div>}
            {intake.map(b => (
              <div key={b.id} className="insp-card">
                <div className="insp-card-title">{b.listing?.title || b.product?.title}</div>
                <div className="insp-card-meta">Lister ID: {b.listing?.listerProfileId?.slice(-6)}</div>
                <button className="insp-btn" onClick={() => openModal(b, 'LISTER_TO_HUB_INTAKE')}>Verify Intake</button>
              </div>
            ))}
          </div>
        </div>

        {/* PRE-DISPATCH */}
        <div className="insp-col">
          <div className="insp-col-head">
            <span className="insp-col-title">2. Pre-Dispatch</span>
            <span className="insp-col-count">{preDispatch.length}</span>
          </div>
          <div className="insp-list">
            {preDispatch.length === 0 && <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No pending dispatch</div>}
            {preDispatch.map(b => (
              <div key={b.id} className="insp-card">
                <div className="insp-card-title">{b.listing?.title || b.product?.title}</div>
                <div className="insp-card-meta">Renter: {b.renter?.name} <br/> Due: {new Date(b.startDate).toLocaleDateString('en-IN')}</div>
                <button className="insp-btn" onClick={() => openModal(b, 'PRE_DISPATCH')}>Sanitize & Verify</button>
              </div>
            ))}
          </div>
        </div>

        {/* POST-RETURN */}
        <div className="insp-col">
          <div className="insp-col-head">
            <span className="insp-col-title">3. Post-Return</span>
            <span className="insp-col-count">{postReturn.length}</span>
          </div>
          <div className="insp-list">
            {postReturn.length === 0 && <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No pending returns</div>}
            {postReturn.map(b => (
              <div key={b.id} className="insp-card">
                <div className="insp-card-title">{b.listing?.title || b.product?.title}</div>
                <div className="insp-card-meta">Renter: {b.renter?.name} <br/> Returned: {new Date(b.endDate).toLocaleDateString('en-IN')}</div>
                <button className="insp-btn" onClick={() => openModal(b, 'POST_RETURN')}>Receive & Grade</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {activeBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                  {inspectionType === 'PRE_DISPATCH' ? 'Pre-Dispatch Quality Check' 
                   : inspectionType === 'LISTER_TO_HUB_INTAKE' ? 'Lister Intake Check'
                   : 'Post-Return Quality Check'}
                </h3>
                <div style={{ fontSize: 13, color: '#64748B' }}>{activeBooking.listing?.title || activeBooking.product?.title}</div>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {generatedSku ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginBottom: 16 }}>Intake Successful!</h3>
                <p style={{ color: '#64748B', marginBottom: 24 }}>Please print and attach this QR Code/SKU to the item.</p>
                <div style={{ display: 'inline-block', padding: 24, background: '#F8FAFC', borderRadius: 16, border: '2px dashed #CBD5E1', marginBottom: 24 }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${generatedSku}`} alt="QR Code" style={{ width: 150, height: 150, marginBottom: 16 }} />
                  <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#0F172A', letterSpacing: '0.1em' }}>{generatedSku}</div>
                </div>
                <div>
                  <button onClick={() => { closeModal(); fetchBookings(); }} style={{ padding: '12px 32px', background: '#0F172A', border: 'none', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {inspectionType === 'LISTER_TO_HUB_INTAKE' && (
                  <div className="modal-grid">
                    <div>
                      <h4 className="m-section-title">Intake Verification</h4>
                      <div style={{ background: '#F1F5F9', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                        <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, marginBottom: 16 }}>
                          Verify the item matches the Lister's photos and is free from undisclosed damage.
                        </p>
                        <label className="chk-label"><input type="checkbox" required /> Item matches listing description completely</label>
                      </div>
                      <h4 className="m-section-title">Assign Shelf Location</h4>
                      <input 
                        type="text" 
                        className="input-text" 
                        placeholder="e.g. Rack A-12" 
                        value={shelfLocation} 
                        onChange={e => setShelfLocation(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <h4 className="m-section-title">Intake Photo</h4>
                      <LiveCameraCapture onCapture={handleCapture} buttonText="Take Intake Photo" guideText="Ensure garment is fully visible" />
                    </div>
                  </div>
                )}

                {inspectionType === 'PRE_DISPATCH' && (
                  <div className="modal-grid">
                    <div>
                      <h4 className="m-section-title">Sanitization Checklist</h4>
                      <label className="chk-label"><input type="checkbox" required /> Hem stitching & zipper integrity check</label>
                      <label className="chk-label"><input type="checkbox" required /> No visible marks, dust, or odor</label>
                      <label className="chk-label"><input type="checkbox" required /> Handloom authenticity tag attached</label>
                      <label className="chk-label"><input type="checkbox" required /> Sealed in premium ozone packaging</label>
                    </div>
                    <div>
                      <h4 className="m-section-title">Dispatch Photo</h4>
                      <LiveCameraCapture onCapture={handleCapture} buttonText="Take Dispatch Photo" guideText="Ensure garment is pristine and sealed" />
                    </div>
                  </div>
                )}

                {inspectionType === 'POST_RETURN' && (
                  <div className="modal-grid">
                    <div>
                      <h4 className="m-section-title">Assessment Grade</h4>
                      <div className="grade-grid">
                        {[
                          { val: 'A_NO_ISSUE', name: 'A (Perfect)', desc: 'No marks/loss' },
                          { val: 'B_MINOR', name: 'B (Minor)', desc: 'Stain/light wear' },
                          { val: 'C_MAJOR', name: 'C (Major)', desc: 'Torn/damaged' }
                        ].map(g => (
                          <button key={g.val} onClick={() => setGrade(g.val)} className={`grade-btn ${grade === g.val ? 'active' : ''}`}>
                            <strong>{g.name}</strong>
                            <span>{g.desc}</span>
                          </button>
                        ))}
                      </div>

                      <h4 className="m-section-title">Is Accessories Kit Complete?</h4>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <button onClick={() => setIsItemComplete(true)} className={`grade-btn ${isItemComplete ? 'active' : ''}`} style={{flex: 1}}>Yes</button>
                        <button onClick={() => setIsItemComplete(false)} className={`grade-btn ${!isItemComplete ? 'active' : ''}`} style={{flex: 1}}>No, Parts Missing</button>
                      </div>

                      {!isItemComplete && (
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>MISSING PARTS DESCRIPTION</label>
                          <input type="text" className="input-text" placeholder="e.g. Belt missing" value={missingPartsDescription} onChange={e => setMissingPartsDescription(e.target.value)} />
                        </div>
                      )}

                      {grade !== 'A_NO_ISSUE' && (
                        <div style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 6 }}>REPAIR DEDUCTION (INR)</label>
                          <input type="number" className="input-text" min="0" value={deductionAmount} onChange={e => {
                            let val = Number(e.target.value);
                            if (val < 0) val = 0;
                            setDeductionAmount(val);
                          }} />
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>Max cap: ₹{activeBooking.securityDeposit}</div>
                        </div>
                      )}

                      <h4 className="m-section-title">Return Shelf Location</h4>
                      <input 
                        type="text" 
                        className="input-text" 
                        placeholder="e.g. Rack A-12" 
                        value={shelfLocation} 
                        onChange={e => setShelfLocation(e.target.value)} 
                        required 
                      />
                    </div>

                    <div>
                      <h4 className="m-section-title">Condition Evidence Photos</h4>
                      <LiveCameraCapture onCapture={handleCapture} buttonText="Add Evidence Photo" guideText="Capture specific damage details clearly" />
                      {evidencePhotos.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                          {evidencePhotos.map((photo) => (
                            <div key={photo.id} style={{ position: 'relative', width: 64, height: 64 }}>
                              <img src={photo.localUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0', opacity: photo.status === 'success' ? 1 : 0.6 }} />
                              {photo.status === 'pending' || photo.status === 'uploading' ? (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                                  <span style={{ fontSize: 10, color: '#FFF' }}>⏳</span>
                                </div>
                              ) : photo.status === 'error' ? (
                                <div 
                                  onClick={() => retryUpload(photo.id)}
                                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.7)', borderRadius: 8, cursor: 'pointer' }}
                                  title="Click to retry"
                                >
                                  <span style={{ fontSize: 10, color: '#FFF', textAlign: 'center', lineHeight: 1 }}>Failed<br/>↻</span>
                                </div>
                              ) : (
                                <div style={{ position: 'absolute', top: 2, right: 2, background: '#10B981', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button onClick={closeModal} style={{ padding: '12px 24px', background: '#F1F5F9', border: 'none', borderRadius: 8, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleInspectionSubmit} disabled={submitting || uploading} style={{ padding: '12px 32px', background: '#0F172A', border: 'none', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, cursor: (submitting || uploading) ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Submitting...' : 'Register Inspection'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </>
  );
}
