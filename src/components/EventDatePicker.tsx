'use client';

import React, { useState, useMemo } from 'react';
import { isDateConflictingWithBookings, getNextAvailableDate } from '@/lib/availability';

type EventDatePickerProps = {
  pricePer4Days: number;
  bookings?: { startDate: string | Date; endDate: string | Date }[];
  nextAvailableDate?: any;
  onDateSelect: (dateStr: string, extensionDays: number) => void;
};

// Safe local date formatting that never shifts due to UTC timezone offset
const formatLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLocalDate = (dateStr: string) => {
  const [y, m, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, day);
};

export default function EventDatePicker({ pricePer4Days, bookings, nextAvailableDate, onDateSelect }: EventDatePickerProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  
  // Minimum booking date is strictly 4 days from today (3 days processing + 1 day minimum buffer)
  const minDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 4);
    return d;
  }, [today]);
  const minDateStr = formatLocalDate(minDate);

  // Compute next available information directly from bookings to guarantee sync across Web & Mobile
  const activeNextAvail = useMemo(() => {
    if (bookings && bookings.length > 0) {
      return getNextAvailableDate(
        bookings.map(b => ({
          startDate: new Date(b.startDate),
          endDate: new Date(b.endDate),
        })),
        today
      );
    }
    if (nextAvailableDate) {
      if (typeof nextAvailableDate === 'string') {
        const d = new Date(nextAvailableDate);
        const dStr = formatLocalDate(d);
        const isAvail = dStr <= minDateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          isAvailableNow: isAvail,
          nextDate: d,
          badgeText: isAvail ? 'Available Now' : `Available from ${d.getDate()} ${months[d.getMonth()]}`,
        };
      }
      if (nextAvailableDate.nextDate) {
        return {
          isAvailableNow: Boolean(nextAvailableDate.isAvailableNow),
          nextDate: new Date(nextAvailableDate.nextDate),
          badgeText: String(nextAvailableDate.badgeText || ''),
        };
      }
    }
    return {
      isAvailableNow: true,
      nextDate: minDate,
      badgeText: 'Available Now',
    };
  }, [bookings, nextAvailableDate, today, minDate, minDateStr]);

  const nextDateStr = formatLocalDate(activeNextAvail.nextDate);
  const effectiveMinDateStr = nextDateStr > minDateStr ? nextDateStr : minDateStr;

  const [selectedDate, setSelectedDate] = useState('');
  const [extensionDays, setExtensionDays] = useState(0);
  const [conflictError, setConflictError] = useState('');

  const checkAndNotifyDate = (val: string, ext: number) => {
    setConflictError('');

    if (!val || val < effectiveMinDateStr) {
      setSelectedDate('');
      onDateSelect('', ext);
      return;
    }

    if (bookings && bookings.length > 0) {
      const selected = parseLocalDate(val);
      const isConflicting = isDateConflictingWithBookings(
        selected,
        bookings.map(b => ({
          startDate: new Date(b.startDate),
          endDate: new Date(b.endDate),
        })),
        ext,
        today
      );

      if (isConflicting) {
        setSelectedDate('');
        const availText = activeNextAvail.badgeText.replace('Available from ', '') || effectiveMinDateStr;
        setConflictError(`This outfit is already reserved on this date. Next available from ${availText}.`);
        onDateSelect('', ext);
        return;
      }
    }

    setSelectedDate(val);
    onDateSelect(val, ext);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    checkAndNotifyDate(e.target.value, extensionDays);
  };

  const handleIncrement = () => {
    const newVal = extensionDays + 1;
    setExtensionDays(newVal);
    if (selectedDate) checkAndNotifyDate(selectedDate, newVal);
  };

  const handleDecrement = () => {
    if (extensionDays <= 0) return;
    const newVal = extensionDays - 1;
    setExtensionDays(newVal);
    if (selectedDate) checkAndNotifyDate(selectedDate, newVal);
  };

  // Helper date calculations
  let deliveryDateStr = '';
  let returnDateStr = '';
  let isExpedited = false;

  if (selectedDate) {
    const event = parseLocalDate(selectedDate);

    const diffMs = event.getTime() - today.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let delivery: Date;
    if (daysUntil >= 5) {
      // Standard 2-day pre-event buffer
      delivery = new Date(event);
      delivery.setDate(event.getDate() - 2);
      isExpedited = false;
    } else if (daysUntil >= 4) {
      // Compressed 1-day buffer (today + 3 days processing)
      delivery = new Date(today);
      delivery.setDate(today.getDate() + 3);
      isExpedited = true;
    } else {
      delivery = new Date(event);
    }
    deliveryDateStr = delivery.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    const ret = new Date(event);
    ret.setDate(event.getDate() + 2 + extensionDays);
    returnDateStr = ret.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const basePrice = Number(pricePer4Days);
  const extensionCost = extensionDays * (basePrice * 0.25);
  const totalRentalCost = basePrice + extensionCost;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', border: '1px solid var(--border)', padding: '24px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Choose Event Date
          </label>
          {!activeNextAvail.isAvailableNow && (
            <span style={{ fontSize: '10.5px', color: '#BE123C', fontWeight: 700, background: '#FFE4E6', padding: '2px 8px', borderRadius: '999px' }}>
              🔒 {activeNextAvail.badgeText}
            </span>
          )}
        </div>
        
        {/* Custom styled date picker */}
        <div style={{ position: 'relative' }}>
          <input 
            type="date" 
            min={effectiveMinDateStr}
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: conflictError ? '1.5px solid #EF4444' : '1px solid var(--border)',
              fontSize: '14px',
              color: 'var(--ink)',
              outline: 'none',
              background: '#FFFFFF',
            }}
          />
          {conflictError ? (
            <div style={{ marginTop: '8px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              <span>{conflictError}</span>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              ℹ️ Minimum 4 days advance booking. Bookings 5+ days away include standard 48-hr fitting buffer.
            </div>
          )}
        </div>
      </div>

      {/* Date calculations / summary */}
      {selectedDate && (
        <div style={{ 
          background: 'var(--bg-primary)', padding: '16px', borderLeft: '3px solid var(--accent)', 
          animation: 'riseReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards', display: 'flex', flexDirection: 'column', gap: '10px' 
        }}>
          {isExpedited ? (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚡</span>
              <span>Expedited delivery — item arrives 1 day before your event (compressed timeline).</span>
            </div>
          ) : (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600 }}>
              ✓ Standard 48-hour complimentary pre-event fitting buffer included.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery:</span>
            <strong style={{ color: 'var(--success)' }}>{deliveryDateStr}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Return Courier Pickup:</span>
            <strong style={{ color: 'var(--ink)' }}>{returnDateStr}</strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '2px' }}>
            Standard rental coverage includes event date + return buffer.
          </div>
        </div>
      )}

      {/* Extension control */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <div>
          <h5 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extend Booking</h5>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+25% rate/day (₹{(basePrice * 0.25).toFixed(0)}/day)</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)', background: 'var(--bg-primary)', padding: '4px' }}>
          <button 
            type="button" 
            onClick={handleDecrement}
            style={{ background: 'none', border: 'none', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', color: 'var(--ink)' }}
            disabled={extensionDays <= 0}
          >
            -
          </button>
          <span style={{ fontSize: '14px', fontWeight: 700, width: '20px', textAlign: 'center' }}>
            {extensionDays}
          </span>
          <button 
            type="button" 
            onClick={handleIncrement}
            style={{ background: 'none', border: 'none', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', color: 'var(--ink)' }}
          >
            +
          </button>
        </div>
      </div>

      {/* Calculated breakdown */}
      {selectedDate && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Rental Value:</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', transition: 'all 0.3s ease' }}>
            ₹{totalRentalCost.toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
}
