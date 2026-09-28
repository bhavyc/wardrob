'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

type LiveCameraCaptureProps = {
  onCapture: (blob: Blob, base64: string) => void;
  buttonText?: string;
  guideText?: string;
  multiCapture?: boolean;
  captureCount?: number;
};

export default function LiveCameraCapture({ 
  onCapture, 
  buttonText = "Snap Photo", 
  guideText = "Align garment inside the frame",
  multiCapture = false,
  captureCount = 0,
}: LiveCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [warning, setWarning] = useState<string>('');
  const [capturedPreview, setCapturedPreview] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (!multiCapture) {
        setCapturedPreview(base64);
      } else {
        setJustCaptured(true);
        setTimeout(() => setJustCaptured(false), 1500);
      }
      onCapture(file, base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        // Plain HTTP IP contexts (insecure context) disable WebRTC getUserMedia.
        // Fall back directly to the native phone camera input!
        fileInputRef.current?.click();
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check for torch capabilities
      const track = mediaStream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities && 'torch' in capabilities && Boolean(capabilities.torch)) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
      }

      setIsActive(true);
      setWarning('');
      setCapturedPreview('');
      setTorchOn(false);
    } catch (err) {
      console.warn('In-browser camera access unavailable, using native phone camera:', err);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setWarning('Camera not detected. Please select an image.');
      }
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Failed to toggle torch', err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  const analyzeImageQuality = (canvas: HTMLCanvasElement): string => {
    if (canvas.width === 0 || canvas.height === 0) return '';
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    
    let totalBrightness = 0;
    const pixels = data.length / 4;
    
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      totalBrightness += (r + g + b) / 3;
    }
    
    const avgBrightness = totalBrightness / (pixels / 4);
    
    if (avgBrightness < 50) {
      return '⚠️ Warning: Image is too dark. Increase ambient lighting.';
    }
    if (avgBrightness > 220) {
      return '⚠️ Warning: Image has excessive glare/brightness.';
    }
    
    let varianceSum = 0;
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const val = (r + g + b) / 3;
      varianceSum += Math.pow(val - avgBrightness, 2);
    }
    const stdDev = Math.sqrt(varianceSum / (pixels / 4));
    
    if (stdDev < 15) {
      return '⚠️ Warning: Image is blurry or lacks distinct details.';
    }
    
    return '';
  };

  const capturePhoto = async () => {
    if (!isActive) return;
    
    const video = videoRef.current;
    
    if (!stream || !video || video.videoWidth === 0) {
      // Simulation flow
      const mockImages = [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&q=80&w=600'
      ];
      const selectedMock = mockImages[Math.floor(Math.random() * mockImages.length)];
      setCapturedPreview(selectedMock);
      
      // Convert mock URL to blob to satisfy callback
      // Create a dummy blob using a canvas to avoid CORS/network issues
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(0, 0, 600, 600);
          ctx.fillStyle = '#475569';
          ctx.font = '30px sans-serif';
          ctx.fillText('Simulated Capture', 180, 300);
          canvas.toBlob((blob) => {
            if (blob) {
              onCapture(blob, selectedMock);
            }
          }, 'image/jpeg', 0.9);
        }
      } catch (err) {
        console.error('Failed to create simulated blob', err);
      }
      setIsActive(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const qualityWarning = analyzeImageQuality(canvas);
      setWarning(qualityWarning);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      canvas.toBlob((blob) => {
        if (blob) {
          if (!multiCapture) {
            setCapturedPreview(base64);
            stopCamera();
          } else {
            setJustCaptured(true);
            setTimeout(() => setJustCaptured(false), 1500);
          }
          onCapture(blob, base64);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)', width: '100%' }}>
      {!isActive && (!capturedPreview || multiCapture) && (
        <button
          type="button"
          onClick={startCamera}
          style={{
            width: '100%', padding: '16px', background: '#FFFFFF', border: '1px dashed var(--accent)',
            color: 'var(--ink)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em',
            textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <span>📷</span> {multiCapture && captureCount > 0 ? `Snap Next Angle (${captureCount}/3 captured)` : buttonText}
        </button>
      )}

      {isActive && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#0F0F0F', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '12px' }}>
              Initializing Camera Stream...
            </div>
          )}

          {/* Flash Feedback overlay on multi capture */}
          {justCaptured && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(5, 150, 105, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF', fontWeight: 800, fontSize: '14px', zIndex: 40,
              pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              ✓ Photo Added! Align Next Angle
            </div>
          )}

          {/* Premium Guide Overlay */}
          <div style={{ position: 'absolute', inset: 0, border: '24px solid rgba(15,15,15,0.6)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', inset: '16px', border: '1px dashed rgba(197, 168, 128, 0.7)' }} />
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', border: '2px solid var(--accent)', width: '80px', height: '80px', opacity: 0.3 }} />
            
            <div style={{ width: '100%', textAlign: 'center', color: '#FFFFFF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', zIndex: 10, background: 'rgba(15,15,15,0.7)', padding: '6px' }}>
              {guideText}
            </div>

            {hasTorch && (
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 30 }}>
                <button
                  type="button"
                  onClick={toggleTorch}
                  style={{ 
                    background: torchOn ? '#FBBF24' : 'rgba(0,0,0,0.5)', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    color: torchOn ? '#000' : '#FFF', 
                    padding: '8px', 
                    borderRadius: '50%', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px'
                  }}
                  title="Toggle Flashlight"
                >
                  🔦
                </button>
              </div>
            )}
          </div>

          {/* Actions panel */}
          <div style={{ position: 'absolute', bottom: '16px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '16px', zIndex: 20 }}>
            <button
              type="button"
              onClick={stopCamera}
              style={{ background: '#FFFFFF', border: '1px solid var(--border)', color: 'var(--ink)', padding: '8px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              style={{ background: 'var(--ink)', border: 'none', color: '#FFFFFF', padding: '8px 24px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>📸</span>
              <span>{multiCapture ? (captureCount >= 2 ? 'Capture (Min Met)' : `Capture (${captureCount + 1}/3)`) : 'Capture'}</span>
            </button>
          </div>
        </div>
      )}

      {!multiCapture && capturedPreview && (
        <div style={{ position: 'relative', width: '100%', border: '1px solid var(--border)' }}>
          <img src={capturedPreview} alt="Captured Preview" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
            <button
              type="button"
              onClick={() => { setCapturedPreview(''); startCamera(); }}
              style={{ background: '#FFFFFF', border: '1px solid var(--border)', color: 'var(--ink)', padding: '6px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {warning && (
        <div style={{ color: 'var(--alert)', fontSize: '12px', marginTop: '12px', fontWeight: 600, letterSpacing: '0.02em', background: '#FCF2F2', padding: '8px 12px', borderLeft: '3px solid var(--alert)' }}>
          {warning}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
