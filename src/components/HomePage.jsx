import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Smartphone, Monitor } from 'lucide-react';
import { analyzeUrl, getHistory } from '../services/api';

const loadingMessages = [
  'Fetching page data...',
  'Running Lighthouse audit...',
  'Processing performance metrics...',
  'Almost done...',
];

const popularSites = [
  { label: 'irctc.co.in', url: 'https://www.irctc.co.in' },
  { label: 'google.com', url: 'https://www.google.com' },
  { label: 'flipkart.com', url: 'https://www.flipkart.com' },
  { label: 'swiggy.com', url: 'https://www.swiggy.com' },
  { label: 'amazon.in', url: 'https://www.amazon.in' },
];

export default function HomePage({ onAnalysisComplete, navigateTo }) {
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const hasHistory = getHistory().length > 0;

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsg(i => (i + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    
    setError(null);
    setLoading(true);
    setLoadingMsg(0);

    try {
      const result = await analyzeUrl(url, strategy, (msg) => {
        // Can use progress messages if needed
      });
      onAnalysisComplete(result);
      navigateTo('analysis');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '40px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 16 }}>
            <circle cx="16" cy="16" r="14" stroke="var(--accent)" strokeWidth="2" fill="none" />
            <circle cx="16" cy="16" r="5" fill="var(--accent)" />
            <line x1="16" y1="4" x2="16" y2="8" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16" y1="24" x2="16" y2="28" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4" y1="16" x2="8" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="16" x2="28" y2="16" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: -1,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            PerfLens
          </h1>

          <p
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              maxWidth: 420,
              lineHeight: 1.6,
            }}
          >
            Real performance insights for any website.
            <br />
            Powered by Google Lighthouse + AI.
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '40px 0' }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label className="label" style={{ display: 'block', marginBottom: 8 }}>
            Website URL
          </label>
          <input
            type="text"
            className="input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />

          {/* Strategy Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setStrategy('mobile')}
              disabled={loading}
              style={{
                height: 40,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${strategy === 'mobile' ? 'var(--accent)' : 'var(--border)'}`,
                background: strategy === 'mobile' ? 'var(--accent)' : 'var(--bg-card)',
                color: strategy === 'mobile' ? 'white' : 'var(--text-secondary)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Smartphone size={14} />
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setStrategy('desktop')}
              disabled={loading}
              style={{
                height: 40,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${strategy === 'desktop' ? 'var(--accent)' : 'var(--border)'}`,
                background: strategy === 'desktop' ? 'var(--accent)' : 'var(--bg-card)',
                color: strategy === 'desktop' ? 'white' : 'var(--text-secondary)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Monitor size={14} />
              Desktop
            </button>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? (
              <>
                <span className="spinner" />
                {loadingMessages[loadingMsg]}
              </>
            ) : (
              'Analyze Performance'
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="error-banner" style={{ marginTop: 12 }}>
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Popular Sites */}
        <div style={{ marginTop: 32 }}>
          <span className="label" style={{ display: 'block', marginBottom: 10 }}>
            Try a popular site
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {popularSites.map((site) => (
              <button
                key={site.label}
                type="button"
                onClick={() => setUrl(site.url)}
                disabled={loading}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {site.label}
              </button>
            ))}
          </div>
        </div>

        {/* History hint */}
        {hasHistory && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              className="btn-text"
              onClick={() => navigateTo('history')}
              style={{ fontSize: 13, color: 'var(--text-muted)' }}
            >
              View past analyses
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
