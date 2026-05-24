import React, { useEffect } from 'react';
import { ArrowLeft, GitCompare, Clock } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import MetricCard from './MetricCard';
import OpportunitiesPanel from './OpportunitiesPanel';
import AIPanel from './AIPanel';
import { addToHistory } from '../services/api';

const metricInfo = {
  lcp: { name: 'Largest Contentful Paint', description: 'Time until the largest content element is visible' },
  fcp: { name: 'First Contentful Paint', description: 'Time until the first content is painted on screen' },
  cls: { name: 'Cumulative Layout Shift', description: 'Measures visual stability — lower is better' },
  tbt: { name: 'Total Blocking Time', description: 'Total time the main thread was blocked' },
  si: { name: 'Speed Index', description: 'How quickly content is visually displayed' },
  tti: { name: 'Time to Interactive', description: 'Time until the page is fully interactive' },
};

const shortNames = {
  lcp: 'LCP',
  fcp: 'FCP',
  cls: 'CLS',
  tbt: 'TBT',
  si: 'SI',
  tti: 'TTI',
};

function formatTime(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

function truncateUrl(url, max = 50) {
  if (url.length <= max) return url;
  return url.slice(0, max) + '...';
}

export default function AnalysisPage({ result, navigateTo }) {
  useEffect(() => {
    addToHistory(result);
  }, [result]);

  const metricKeys = ['lcp', 'fcp', 'cls', 'tbt', 'si', 'tti'];

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 80px' }}>
      {/* Top nav */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <button className="btn-text" onClick={() => navigateTo('home')}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => navigateTo('compare')}>
            <GitCompare size={14} />
            Compare URLs
          </button>
          <button className="btn-secondary" onClick={() => navigateTo('history')}>
            <Clock size={14} />
            View History
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

      {/* Hero Score */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
            }}
          >
            {truncateUrl(result.url, 60)}
          </span>
          <span className={`badge badge--${result.strategy}`}>
            {result.strategy === 'mobile' ? 'Mobile' : 'Desktop'}
          </span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
          Analyzed {formatTime(result.analyzedAt)}
        </span>

        <ScoreGauge score={result.score} size={180} />

        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginTop: 16,
          }}
        >
          Performance Score
        </h2>
      </div>

      {/* Metrics Grid */}
      <h3 className="section-heading" style={{ marginBottom: 16 }}>
        Core Web Vitals &amp; Metrics
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 8,
        }}
      >
        {metricKeys.map((key, i) => {
          const m = result.metrics[key];
          const info = metricInfo[key];
          return (
            <MetricCard
              key={key}
              shortName={shortNames[key]}
              name={info.name}
              value={m.value}
              numericValue={m.numericValue}
              description={info.description}
              delay={i * 0.05}
            />
          );
        })}
      </div>

      {/* Opportunities */}
      <OpportunitiesPanel opportunities={result.opportunities} />

      {/* AI */}
      <AIPanel analysisData={result} />

      {/* Bottom Actions */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 40,
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn-secondary"
          onClick={() => navigateTo('home')}
          style={{ flex: 1, minWidth: 180, height: 48 }}
        >
          Analyze Another URL
        </button>
        <button
          className="btn-primary"
          onClick={() => navigateTo('compare')}
          style={{ flex: 1, minWidth: 180 }}
        >
          <GitCompare size={16} />
          Compare with Another URL
        </button>
      </div>
    </div>
  );
}
