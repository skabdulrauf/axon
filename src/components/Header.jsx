import React from 'react';
import { Activity, History } from 'lucide-react';

export default function Header({ currentPage, navigateTo }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 60,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8, 8, 14, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}
    >
      <button
        onClick={() => navigateTo('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="12" stroke="var(--accent)" strokeWidth="2" fill="none" />
          <circle cx="14" cy="14" r="4" fill="var(--accent)" />
          <line x1="14" y1="4" x2="14" y2="8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="20" x2="14" y2="24" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4" y1="14" x2="8" y2="14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="14" x2="24" y2="14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}
        >
          PerfLens
        </span>
      </button>

      {currentPage !== 'home' && (
        <nav style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => navigateTo('home')}
            className="btn-text"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
          >
            <Activity size={15} />
            <span>Analyze</span>
          </button>
          <button
            onClick={() => navigateTo('history')}
            className="btn-text"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
          >
            <History size={15} />
            <span>History</span>
          </button>
        </nav>
      )}
    </header>
  );
}
