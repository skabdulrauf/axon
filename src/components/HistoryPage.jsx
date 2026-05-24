import React from 'react';
import { ArrowLeft, Trash2, ArrowRight, Search } from 'lucide-react';
import ScoreGauge from './ScoreGauge';

function timeAgo(isoStr) {
  try {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoStr;
  }
}

function truncateUrl(url, max = 45) {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname.replace('www.', '') + parsed.pathname;
    return display.length > max ? display.slice(0, max) + '...' : display;
  } catch {
    return url.length > max ? url.slice(0, max) + '...' : url;
  }
}

export default function HistoryPage({ history, onSelect, onClear, navigateTo }) {
  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button className="btn-text" onClick={() => navigateTo('home')}>
          <ArrowLeft size={16} />
          Back
        </button>
        {history.length > 0 && (
          <button className="btn-text" onClick={onClear} style={{ color: 'var(--poor)' }}>
            <Trash2 size={14} />
            Clear All
          </button>
        )}
      </div>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
        Analysis History
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Your last 10 analyses
      </p>

      {history.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Search size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            No analyses yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Analyze a website to see results here
          </p>
          <button className="btn-primary" onClick={() => navigateTo('home')} style={{ maxWidth: 220 }}>
            Analyze a URL
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map((item, i) => (
            <button
              key={`${item.url}-${item.strategy}-${i}`}
              onClick={() => onSelect(item)}
              className="fade-in"
              style={{
                animationDelay: `${i * 0.04}s`,
                opacity: 0,
                animationFillMode: 'forwards',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'var(--transition)',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-accent)';
                e.currentTarget.style.background = 'var(--bg-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-card)';
              }}
            >
              <ScoreGauge score={item.score} size={44} showLabel={false} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {truncateUrl(item.url)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className={`badge badge--${item.strategy}`}>{item.strategy}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(item.analyzedAt)}</span>
                </div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
