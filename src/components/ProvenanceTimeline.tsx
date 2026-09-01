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
    <div ref={timelineRef} className="w-full my-12 py-8 border-y border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 mb-8">
        <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--accent)] font-semibold">Authenticity Cert</span>
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
      </div>

      <div className="flex flex-col md:flex-row relative w-full justify-between items-start md:items-start gap-8 md:gap-6">
        
        {/* Animated Connecting Line (Hidden on mobile for simplicity, or we can make a vertical one) */}
        <div className="hidden md:block absolute top-[15px] left-0 right-0 h-[2px] z-10">
          <svg width="100%" height="2" className="block">
            <line x1="0" y1="1" x2="100%" y2="1" stroke="var(--border)" strokeWidth="2" />
            <line 
              x1="0" y1="1" x2="100%" y2="1" 
              stroke="var(--accent)" strokeWidth="2" 
              style={{
                strokeDasharray: 1000,
                strokeDashoffset: isVisible ? 0 : 1000,
                transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </svg>
        </div>

        {/* Vertical line for mobile */}
        <div className="md:hidden absolute top-[15px] bottom-4 left-[15px] w-[2px] z-10 bg-[var(--border)]">
          <div 
            className="w-full bg-[var(--accent)]"
            style={{
              height: isVisible ? '100%' : '0%',
              transition: 'height 2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>

        {steps.map((step, idx) => (
          <div key={idx} className="flex-1 flex flex-row md:flex-col items-start md:items-center text-left md:text-center z-20 relative gap-4 md:gap-0 w-full">
            {/* Step node */}
            <div 
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 md:mb-4"
              style={{ 
                border: isVisible ? '2px solid var(--accent)' : '2px solid var(--border)', 
                transition: `all 0.5s ease ${idx * 0.4}s`
              }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ 
                  background: isVisible ? 'var(--accent)' : 'transparent',
                  transition: `all 0.5s ease ${idx * 0.4}s`
                }} 
              />
            </div>
            
            <div>
              <h4 
                className="text-[15px] font-semibold text-[var(--ink)] mb-1 md:mb-2 font-serif tracking-[0.02em]"
                style={{ 
                  opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: `all 0.6s ease ${idx * 0.3}s`
                }}
              >
                {step.title}
              </h4>
              
              <p 
                className="text-[12px] text-[var(--text-muted)] max-w-[220px] leading-relaxed"
                style={{ 
                  opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                  transition: `all 0.6s ease ${(idx * 0.3) + 0.1}s`
                }}
              >
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
