'use client';

import React, { useState } from 'react';

type EventDatePickerProps = {
  pricePer4Days: number;
  onDateSelect: (dateStr: string, extensionDays: number) => void;
};

export default function EventDatePicker({ pricePer4Days, onDateSelect }: EventDatePickerProps) {
  const today = new Date();
  const leadTimeDays = 3;
  
  // Start date should be today + leadTimeDays
  const minDate = new Date();
  minDate.setDate(today.getDate() + leadTimeDays);
  
  const minDateStr = minDate.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState('');
  const [extensionDays, setExtensionDays] = useState(0);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedDate(val);
    onDateSelect(val, extensionDays);
  };

  const handleIncrement = () => {
    const newVal = extensionDays + 1;
    setExtensionDays(newVal);
    if (selectedDate) onDateSelect(selectedDate, newVal);
  };

  const handleDecrement = () => {
    if (extensionDays <= 0) return;
    const newVal = extensionDays - 1;
    setExtensionDays(newVal);
    if (selectedDate) onDateSelect(selectedDate, newVal);
  };

  // Helper date calculations
  let deliveryDateStr = '';
  let returnDateStr = '';
  if (selectedDate) {
    const event = new Date(selectedDate);
    
    const delivery = new Date(event);
    delivery.setDate(event.getDate() - 1);
    deliveryDateStr = delivery.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

    const ret = new Date(event);
    ret.setDate(event.getDate() + 4 + extensionDays);
    returnDateStr = ret.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const basePrice = Number(pricePer4Days);
  const extensionCost = extensionDays * (basePrice * 0.25);
  const totalRentalCost = basePrice + extensionCost;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', border: '1px solid var(--border)', padding: '24px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Choose Event Date
        </label>
        
        {/* Custom styled date picker */}
        <div style={{ position: 'relative' }}>
          <input 
            type="date" 
            min={minDateStr}
            value={selectedDate}
            onChange={handleDateChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--border)',
              fontSize: '14px',
              color: 'var(--ink)',
              outline: 'none',
              background: '#FFFFFF',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            ℹ️ Minimum 3 days courier buffer applied.
          </div>
        </div>
      </div>

      {/* Date calculations / summary */}
      {selectedDate && (
        <div style={{ 
          background: 'var(--bg-primary)', padding: '16px', borderLeft: '3px solid var(--accent)', 
          animation: 'riseReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards', display: 'flex', flexDirection: 'column', gap: '8px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Courier Delivery:</span>
            <strong style={{ color: 'var(--success)' }}>{deliveryDateStr}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Return Courier Pickup:</span>
            <strong style={{ color: 'var(--ink)' }}>{returnDateStr}</strong>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
            Standard rental period is 4 days.
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
