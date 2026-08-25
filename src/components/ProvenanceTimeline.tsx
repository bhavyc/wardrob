'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function ProvenanceTimeline() {
  const [isVisible, setIsVisible] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (timelineRef.current) {
      observer.observe(timelineRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    { title: 'Verified by Hub', desc: 'Fabric authenticity & structural assessment complete.' },
    { title: 'Ozone Sanitized', desc: 'Dry-cleaned and vacuum-sealed at 60°C.' },
    { title: 'Ready for You', desc: 'Securely dispatched in custom garment preservation box.' }
  ];

  return (
    <div ref={timelineRef} style={{ width: '100%', margin: '48px 0', padding: '24px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>Authenticity Cert</span>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
      </div>

      <div style={{ display: 'flex', position: 'relative', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
        
        {/* Animated Connecting Line SVG */}
        <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', zIndex: 1 }}>
          <svg width="100%" height="2" style={{ display: 'block' }}>
            <line 
              x1="0" 
              y1="1" 
              x2="100%" 
              y2="1" 
              stroke="var(--border)" 
              strokeWidth="2" 
            />
            <line 
              x1="0" 
              y1="1" 
              x2="100%" 
              y2="1" 
              stroke="var(--accent)" 
              strokeWidth="2" 
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: isVisible ? 0 : 1000,
                transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </svg>
        </div>

        {steps.map((step, idx) => (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, position: 'relative' }}>
            {/* Step node */}
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', background: '#FFFFFF', 
              border: isVisible ? '2px solid var(--accent)' : '2px solid var(--border)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              transition: `all 0.5s ease ${idx * 0.4}s`
            }}>
              <div style={{ 
                width: '12px', height: '12px', borderRadius: '50%', 
                background: isVisible ? 'var(--accent)' : 'transparent',
                transition: `all 0.5s ease ${idx * 0.4}s`
              }} />
            </div>
            
            <h4 style={{ 
              fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px',
              fontFamily: 'var(--font-serif)', letterSpacing: '0.02em',
              opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: `all 0.6s ease ${idx * 0.3}s`
            }}>
              {step.title}
            </h4>
            
            <p style={{ 
              fontSize: '12px', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: 1.5,
              opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: `all 0.6s ease ${(idx * 0.3) + 0.1}s`
            }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
