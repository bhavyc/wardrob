import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  accentColor?: string;
  align?: 'center' | 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
  showSubtitle?: boolean;
  subtitle?: string;
}

export default function BrandLogo({
  size = 'md',
  color = 'var(--ink)',
  accentColor,
  align = 'center',
  className = '',
  style = {},
  showSubtitle = false,
  subtitle = 'LUXURY COUTURE ARCHIVE'
}: BrandLogoProps) {
  const markColor = accentColor || color;

  const fontSizes = {
    sm: '16px',
    md: '22px',
    lg: '28px',
    xl: '36px',
  };

  const markWidths = {
    sm: 48,
    md: 62,
    lg: 80,
    xl: 104,
  };

  const markWidth = markWidths[size] || 62;
  const fontSize = fontSizes[size] || '22px';

  return (
    <div
      className={`brand-logo-wrap ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      {/* ─── ◆ ─── Diamond Crest */}
      <svg
        width={markWidth}
        height="6"
        viewBox="0 0 64 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          color: markColor,
          marginBottom: size === 'sm' ? '3px' : size === 'xl' ? '8px' : '5px',
          display: 'block',
        }}
      >
        <line x1="0" y1="3" x2="25" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <polygon points="32,0 35.5,3 32,6 28.5,3" fill="currentColor" />
        <line x1="39" y1="3" x2="64" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* WARDROB Wordmark */}
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize,
          fontWeight: 700,
          color,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          display: 'block',
          whiteSpace: 'nowrap',
        }}
      >
        WARDROB
      </span>

      {showSubtitle && (
        <span
          style={{
            fontSize: size === 'sm' ? '7px' : '8.5px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginTop: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
