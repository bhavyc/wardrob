import React from 'react';
import './StatusBadge.css';

type StatusBadgeProps = {
  status: string;
  size?: 'sm' | 'md';
};

const BADGE_MAP: Record<string, { color: string; bg: string; border: string; label: string; pulse?: boolean }> = {
  // Booking Statuses
  PENDING: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.25)', label: 'Pending' },
  CONFIRMED: { color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.25)', label: 'Confirmed', pulse: true },
  AT_HUB_PRE: { color: '#D4567A', bg: 'rgba(212, 86, 122, 0.08)', border: 'rgba(212, 86, 122, 0.25)', label: 'At Dispatch Hub' },
  OUT_FOR_DELIVERY: { color: '#D4567A', bg: 'rgba(212, 86, 122, 0.08)', border: 'rgba(212, 86, 122, 0.25)', label: 'Out For Delivery', pulse: true },
  IN_USE: { color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.25)', label: 'In Use', pulse: true },
  RETURNED_TO_HUB: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.25)', label: 'Returned to Hub' },
  COMPLETED: { color: '#1E1E2D', bg: 'rgba(30, 30, 45, 0.06)', border: 'rgba(30, 30, 45, 0.15)', label: 'Completed' },
  CANCELLED: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.25)', label: 'Cancelled' },

  // Listing Statuses
  AVAILABLE: { color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.25)', label: 'Available', pulse: true },
  AT_HUB: { color: '#D4567A', bg: 'rgba(212, 86, 122, 0.08)', border: 'rgba(212, 86, 122, 0.25)', label: 'At Hub' },
  WITH_RENTER: { color: '#1E1E2D', bg: 'rgba(30, 30, 45, 0.06)', border: 'rgba(30, 30, 45, 0.15)', label: 'With Renter' },
  IN_CLEANING: { color: '#64748B', bg: 'rgba(100, 116, 139, 0.08)', border: 'rgba(100, 116, 139, 0.25)', label: 'Sanitizing' },

  // Dispute Statuses
  OPEN: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', border: 'rgba(220, 38, 38, 0.25)', label: 'Open Dispute', pulse: true },
  RESOLVED: { color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', border: 'rgba(5, 150, 105, 0.25)', label: 'Resolved' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase();
  const config = BADGE_MAP[normalized] || {
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.08)',
    border: 'rgba(100, 116, 139, 0.25)',
    label: status
  };

  const isSmall = size === 'sm';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: isSmall ? '5px' : '6px',
      padding: isSmall ? '3px 8px' : '4px 10px',
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.border}`,
      borderRadius: '999px',
      fontSize: isSmall ? '9px' : '10px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
      lineHeight: 1.2,
      flexShrink: 0
    }}>
      {config.pulse ? (
        <span style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'inline-block',
          animation: 'statusPulse 2s infinite ease-in-out'
        }} />
      ) : (
        <span style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: config.color,
          display: 'inline-block',
          opacity: 0.7
        }} />
      )}
      <span>{config.label}</span>
    </div>
  );
}
