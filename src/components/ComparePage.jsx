import React, { useState, useEffect } from 'react';
import { ArrowLeft, Smartphone, Monitor, Check, Trophy } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import { analyzeUrl } from '../services/api';

const loadingMessages = [
  'Fetching page data...',
  'Running Lighthouse audit...',
  'Processing performance metrics...',
  'Almost done...',
];

const metricLabels = {
  lcp: { name: 'Largest Contentful Paint', shortName: 'LCP' },
  fcp: { name: 'First Contentful Paint', shortName: 'FCP' },
  cls: { name: 'Cumulative Layout Shift', shortName: 'CLS' },
  tbt: { name: 'Total Blocking Time', shortName: 'TBT' },
  si: { name: 'Speed Index', shortName: 'SI' },
  tti: { name: 'Time to Interactive', shortName: 'TTI' },
};

const metricKeys = ['lcp', 'fcp', 'cls', 'tbt', 'si', 'tti'];

function truncateUrl(url, max = 30) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    return host.length > max ? host.slice(0, max) + '...' : host;
  } catch {
    return url.length > max ? url.slice(0, max) + '...' : url;
  }
}

export default function ComparePage({ firstResult, compareResult, onCompareComplete, navigateTo }) {
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState(firstResult?.strategy || 'mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(0);

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
      const result = await analyzeUrl(url, strategy);
      onCompareComplete(result);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!firstResult) {
    return (
      <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No analysis to compare. Analyze a URL first.</p>
        <button className="btn-primary" onClick={() => navigateTo('home')} style={{ marginTop: 16, maxWidth: 240 }}>
          Go to Analyzer
        </button>
      </div>
    );
  }

  // Input form
  if (!compareResult) {
    return (
      <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <button className="btn-text" onClick={() => navigateTo('analysis')} style={{ marginBottom: 32 }}>
          <ArrowLeft size={16} />
          Back to Analysis
        </button>

        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Compare with Another URL
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
          Analyze a second URL and see a side-by-side breakdown
        </p>

        {/* First result summary */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <ScoreGauge score={firstResult.score} size={48} showLabel={false} />
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-secondary)' }}>
              {truncateUrl(firstResult.url, 40)}
            </div>
            <span className={`badge badge--${firstResult.strategy}`} style={{ marginTop: 4 }}>
              {firstResult.strategy}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="label" style={{ display: 'block', marginBottom: 8 }}>
            Second URL
          </label>
          <input
            type="text"
            className="input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />

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

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? (
              <>
                <span className="spinner" />
                {loadingMessages[loadingMsg]}
              </>
            ) : (
              'Analyze & Compare'
            )}
          </button>
        </form>

        {error && (
          <div className="error-banner" style={{ marginTop: 12 }}>
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--poor)', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  // Comparison view
  const scoreDiff = Math.abs(firstResult.score - compareResult.score);
  const firstWins = firstResult.score > compareResult.score;
  const tie = scoreDiff <= 5;

  let firstWinCount = 0;
  let secondWinCount = 0;
  metricKeys.forEach(key => {
    const v1 = firstResult.metrics[key].numericValue;
    const v2 = compareResult.metrics[key].numericValue;
    if (v1 < v2) firstWinCount++;
    else if (v2 < v1) secondWinCount++;
  });

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 80px' }}>
      <button className="btn-text" onClick={() => navigateTo('analysis')} style={{ marginBottom: 24 }}>
        <ArrowLeft size={16} />
        Back to Analysis
      </button>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 32 }}>
        Performance Comparison
      </h2>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[firstResult, compareResult].map((res, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-secondary)' }}>
                {truncateUrl(res.url)}
              </span>
              <span className={`badge badge--${res.strategy}`}>{res.strategy}</span>
            </div>
            <ScoreGauge score={res.score} size={120} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color: 'var(--text-primary)', marginTop: 8 }}>
              {res.score}
            </span>
          </div>
        ))}
      </div>

      {/* Winner banner */}
      <div
        style={{
          background: tie ? 'var(--bg-card)' : 'var(--accent-glow)',
          border: `1px solid ${tie ? 'var(--border)' : 'rgba(124, 109, 250, 0.3)'}`,
          borderRadius: 'var(--radius)',
          padding: '16px 24px',
          textAlign: 'center',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {!tie && <Trophy size={18} style={{ color: 'var(--accent)' }} />}
        <span style={{ fontSize: 15, color: tie ? 'var(--text-secondary)' : 'var(--accent)', fontWeight: 600 }}>
          {tie ? 'Both sites perform similarly' : `${truncateUrl(firstWins ? firstResult.url : compareResult.url)} is faster by ${scoreDiff} points`}
        </span>
      </div>

      {/* Comparison table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1.5fr 0.8fr',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          <span>Metric</span>
          <span style={{ textAlign: 'right' }}>{truncateUrl(firstResult.url, 18)}</span>
          <span style={{ textAlign: 'right' }}>{truncateUrl(compareResult.url, 18)}</span>
          <span style={{ textAlign: 'center' }}>Winner</span>
        </div>

        {metricKeys.map((key, i) => {
          const m1 = firstResult.metrics[key];
          const m2 = compareResult.metrics[key];
          const info = metricLabels[key];
          const v1Better = m1.numericValue < m2.numericValue;
          const v2Better = m2.numericValue < m1.numericValue;
          const isTie = m1.numericValue === m2.numericValue;

          return (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1.5fr 0.8fr',
                padding: '14px 20px',
                borderBottom: i < metricKeys.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                alignItems: 'center',
                fontSize: 14,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{info.shortName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{info.name}</div>
              </div>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  textAlign: 'right',
                  fontSize: 13,
                  color: v1Better ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: v1Better ? 500 : 400,
                }}
              >
                {m1.value}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  textAlign: 'right',
                  fontSize: 13,
                  color: v2Better ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: v2Better ? 500 : 400,
                }}
              >
                {m2.value}
              </span>
              <div style={{ textAlign: 'center' }}>
                {isTie ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--good-bg)',
                    }}
                  >
                    <Check size={13} style={{ color: 'var(--good)' }} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="card" style={{ marginTop: 24, textAlign: 'center', padding: '32px 24px' }}>
        <h3
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 16,
          }}
        >
          Overall Winner
        </h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 36, fontWeight: 500, color: firstWins || tie ? 'var(--accent)' : 'var(--text-muted)' }}>
              {firstResult.score}
            </span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{truncateUrl(firstResult.url, 24)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{firstWinCount} metric{firstWinCount !== 1 ? 's' : ''} won</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
          <div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 36, fontWeight: 500, color: !firstWins || tie ? 'var(--accent)' : 'var(--text-muted)' }}>
              {compareResult.score}
            </span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{truncateUrl(compareResult.url, 24)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{secondWinCount} metric{secondWinCount !== 1 ? 's' : ''} won</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={() => navigateTo('home')}>
          Analyze Another URL
        </button>
      </div>
    </div>
  );
}
