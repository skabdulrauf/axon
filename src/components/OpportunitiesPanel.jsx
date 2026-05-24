import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

export default function OpportunitiesPanel({ opportunities }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!opportunities || opportunities.length === 0) {
    return (
      <div style={{ marginTop: 32 }}>
        <h3 className="section-heading">Issues Found</h3>
        <div
          style={{
            background: 'var(--good-bg)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--good)',
            fontSize: 14,
          }}
        >
          <CheckCircle size={18} />
          No significant issues found. Great performance!
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700 }}>
          Issues Found
        </h3>
        <span
          style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning)',
            padding: '2px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 500,
          }}
        >
          {opportunities.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opportunities.map((opp, i) => (
          <div
            key={opp.id}
            className="fade-in"
            style={{
              animationDelay: `${i * 0.05}s`,
              opacity: 0,
              animationFillMode: 'forwards',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--warning)',
              borderRadius: 'var(--radius)',
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              transition: 'var(--transition)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                cursor: 'pointer',
              }}
              onClick={() => toggle(opp.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {opp.title}
                </div>
                {opp.displayValue && (
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      color: 'var(--warning)',
                    }}
                  >
                    {opp.displayValue}
                  </span>
                )}
              </div>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  flexShrink: 0,
                }}
              >
                {expanded[opp.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {expanded[opp.id] && opp.description && (
              <p
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  borderTop: '1px solid var(--border)',
                  paddingTop: 12,
                }}
              >
                {opp.description.replace(/<[^>]*>/g, '').slice(0, 500)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
