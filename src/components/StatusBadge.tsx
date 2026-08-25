'use client';

import React from 'react';

type StatusBadgeProps = {
  status: string;
};

const BADGE_MAP: Record<string, { color: string; label: string; pulse?: boolean }> = {
  // Booking Statuses
  PENDING: { color: 'var(--ink-secondary)', label: 'Pending Approval' },
  CONFIRMED: { color: 'var(--ink)', label: 'Confirmed', pulse: true },
  AT_HUB_PRE: { color: 'var(--accent)', label: 'At Dispatch Hub' },
  OUT_FOR_DELIVERY: { color: 'var(--accent)', label: 'Out For Delivery', pulse: true },
  IN_USE: { color: 'var(--success)', label: 'In Use', pulse: true },
  RETURNED_TO_HUB: { color: 'var(--ink-secondary)', label: 'Returned to Hub' },
  COMPLETED: { color: 'var(--ink-secondary)', label: 'Rental Completed' },
  CANCELLED: { color: 'var(--alert)', label: 'Cancelled' },

  // Listing Statuses
  AVAILABLE: { color: 'var(--success)', label: 'Available', pulse: true },
  AT_HUB: { color: 'var(--accent)', label: 'At Hub' },
  WITH_RENTER: { color: 'var(--ink)', label: 'With Renter' },
  IN_CLEANING: { color: 'var(--ink-secondary)', label: 'Sanitizing' },

  // Dispute Statuses
  OPEN: { color: 'var(--alert)', label: 'Open Dispute', pulse: true },
  RESOLVED: { color: 'var(--success)', label: 'Resolved' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase();
  const config = BADGE_MAP[normalized] || { color: 'var(--text-muted)', label: status };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 14px',
      background: 'transparent',
      color: config.color,
      border: `1px solid ${config.color}`,
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
    }}>
      {config.pulse ? (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'inline-block',
          animation: 'pulseGlow 2s infinite ease-in-out'
        }} />
      ) : (
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'inline-block',
          opacity: 0.6
        }} />
      )}
      <span>{config.label}</span>

      <style jsx global>{`
        @keyframes pulseGlow {
          0% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 6px ${config.color}; }
          100% { opacity: 0.3; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
