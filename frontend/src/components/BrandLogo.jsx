import React from 'react';

export default function BrandLogo({ size = 36, showText = true, showSubtitle = true }) {
  const markSize = size;
  const radius = Math.round(markSize * 0.28);
  const strokeWidth = markSize > 36 ? 2.5 : 2;

  return (
    <div className="brand-logo-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <div 
        className="brand-mark-wrapper"
        style={{
          width: markSize,
          height: markSize,
          borderRadius: `${radius}px`,
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #0284c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
          flexShrink: 0
        }}
      >
        <svg 
          width={Math.round(markSize * 0.65)} 
          height={Math.round(markSize * 0.65)} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dynamic Pricing Matrix Volume Bars */}
          <path d="M4 19V15M9 19V11M14 19V8M19 19V4" stroke="#93c5fd" strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.6" />
          {/* Dynamic Yield Surge Curve */}
          <path d="M3 16.5L8.5 11L13.5 14L19.5 5" stroke="#ffffff" strokeWidth={strokeWidth + 0.5} strokeLinecap="round" strokeLinejoin="round" />
          {/* Optimal Price Peak Point */}
          <circle cx="19.5" cy="5" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontSize: `${Math.max(15, Math.round(markSize * 0.44))}px`, 
              fontWeight: '800', 
              letterSpacing: '-0.025em',
              color: 'var(--text-primary)'
            }}>
              PriceMatrix
            </span>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '700', 
              letterSpacing: '0.04em',
              padding: '1px 5px', 
              borderRadius: '4px', 
              background: '#eff6ff', 
              color: '#2563eb', 
              border: '1px solid #bfdbfe' 
            }}>
              SaaS
            </span>
          </div>
          {showSubtitle && (
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '600', 
              color: 'var(--text-dim)', 
              letterSpacing: '0.02em',
              marginTop: '2px'
            }}>
              Dynamic Pricing Engine
            </span>
          )}
        </div>
      )}
    </div>
  );
}
