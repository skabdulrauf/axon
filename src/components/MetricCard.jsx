import React from 'react';

const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FCP: { good: 1800, poor: 3000 },
  CLS: { good: 0.1, poor: 0.25 },
  TBT: { good: 200, poor: 600 },
  SI: { good: 3400, poor: 5800 },
  TTI: { good: 3800, poor: 7300 },
};

function getStatus(shortName, numericValue) {
  const t = thresholds[shortName];
  if (!t) return 'warning';
  if (numericValue <= t.good) return 'good';
  if (numericValue >= t.poor) return 'poor';
  return 'warning';
}

const statusLabels = {
  good: 'Good',
  warning: 'Needs Work',
  poor: 'Poor',
};

export default function MetricCard({ name, shortName, value, numericValue, description, delay = 0 }) {
  const status = getStatus(shortName, numericValue);
  const borderColor = status === 'good' ? 'var(--good)' : status === 'poor' ? 'var(--poor)' : 'var(--warning)';
  const textColor = borderColor;

  return (
    <div
      className="fade-in"
      style={{
        animationDelay: `${delay}s`,
        opacity: 0,
        animationFillMode: 'forwards',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 'var(--radius)',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02)',
        transition: 'var(--transition)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {shortName}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {name}
          </span>
        </div>
        <span className={`badge badge--${status}`}>
          {statusLabels[status]}
        </span>
      </div>
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 28,
          fontWeight: 500,
          color: textColor,
          margin: '12px 0 8px',
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
}
