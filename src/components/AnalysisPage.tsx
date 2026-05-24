import { useState } from 'react';
import { ArrowLeft, GitCompare, Clock, Beaker, Users, ShieldCheck, Code, ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalysisResult, FieldMetric } from '../App';
import { getLastRawResponse } from '../api';
import ScoreGauge from './ScoreGauge';
import MetricCard from './MetricCard';
import OpportunitiesPanel from './OpportunitiesPanel';
import AIPanel from './AIPanel';

interface AnalysisPageProps {
  result: AnalysisResult;
  onBack: () => void;
  onCompare: () => void;
  navigateTo: (page: any) => void;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function getCategoryColor(category: string | null): string {
  if (category === 'FAST') return 'var(--good)';
  if (category === 'AVERAGE') return 'var(--warning)';
  if (category === 'SLOW') return 'var(--poor)';
  return 'var(--text-muted)';
}

function getCategoryLabel(category: string | null): string {
  if (category === 'FAST') return 'Good';
  if (category === 'AVERAGE') return 'Needs Improvement';
  if (category === 'SLOW') return 'Poor';
  return 'N/A';
}

function formatFieldValue(percentile: number | null, unit: string): string {
  if (percentile === null) return 'N/A';
  if (unit === 'ms') {
    if (percentile >= 1000) return `${(percentile / 1000).toFixed(1)} s`;
    return `${Math.round(percentile)} ms`;
  }
  if (unit === 'cls') return percentile.toFixed(2);
  return String(percentile);
}

function DistributionBar({ metric }: { metric: FieldMetric }) {
  if (!metric.distributions || metric.distributions.length === 0) return null;

  const d = metric.distributions;
  const good = Math.round((d[0]?.proportion ?? 0) * 100);
  const avg = Math.round((d[1]?.proportion ?? 0) * 100);
  const poor = Math.round((d[2]?.proportion ?? 0) * 100);

  return (
    <div className="dist-bar-wrap">
      <div className="dist-bar">
        {good > 0 && <div className="dist-seg dist-good" style={{ width: `${good}%` }} />}
        {avg > 0 && <div className="dist-seg dist-avg" style={{ width: `${avg}%` }} />}
        {poor > 0 && <div className="dist-seg dist-poor" style={{ width: `${poor}%` }} />}
      </div>
      <div className="dist-labels">
        <span className="dist-label" style={{ color: 'var(--good)' }}>{good}%</span>
        <span className="dist-label" style={{ color: 'var(--warning)' }}>{avg}%</span>
        <span className="dist-label" style={{ color: 'var(--poor)' }}>{poor}%</span>
      </div>
    </div>
  );
}

const METRIC_INFO = [
  { name: 'Largest Contentful Paint', shortName: 'LCP', key: 'lcp' as const, desc: 'Time until largest content element is visible' },
  { name: 'First Contentful Paint', shortName: 'FCP', key: 'fcp' as const, desc: 'Time until first text or image is painted' },
  { name: 'Cumulative Layout Shift', shortName: 'CLS', key: 'cls' as const, desc: 'Visual stability — lower is better' },
  { name: 'Total Blocking Time', shortName: 'TBT', key: 'tbt' as const, desc: 'Time main thread was blocked after FCP' },
  { name: 'Speed Index', shortName: 'SI', key: 'si' as const, desc: 'How quickly content is visually displayed' },
  { name: 'Time to Interactive', shortName: 'TTI', key: 'tti' as const, desc: 'Time until page is fully interactive' },
];

export default function AnalysisPage({ result, onBack, onCompare, navigateTo }: AnalysisPageProps) {
  const [showRawData, setShowRawData] = useState(false);
  const rawResponse = getLastRawResponse();

  // Extract key data directly from raw response for verification
  const rawScore = rawResponse?.lighthouseResult?.categories?.performance?.score;
  const rawScorePercent = rawScore !== null && rawScore !== undefined ? Math.round(rawScore * 100) : null;

  return (
    <div className="analysis-container page-enter">
      {/* Navigation */}
      <div className="analysis-nav">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="nav-actions">
          <button className="nav-action-btn" onClick={onCompare}>
            <GitCompare size={14} />
            Compare
          </button>
          <button className="nav-action-btn" onClick={() => navigateTo('history')}>
            <Clock size={14} />
            History
          </button>
        </div>
      </div>

      {/* URL Header + Verified Badge */}
      <div className="result-header">
        <div className="result-url-row">
          <span className="result-url mono">{result.finalUrl || result.url}</span>
          <span className="strategy-badge">{result.strategy}</span>
        </div>
        <div className="result-meta-row">
          <span className="result-meta">
            {formatTime(result.analyzedAt)} · Lighthouse {result.lighthouseVersion}
          </span>
          <span className="verified-badge">
            <ShieldCheck size={13} />
            Official Google PSI API
          </span>
        </div>
        <div className="variance-note">
          ℹ️ Lighthouse scores vary ±5 points between runs. This is normal — even pagespeed.web.dev shows different scores each time.
        </div>
      </div>

      {/* Raw API Data Toggle - for verification */}
      <div className="raw-data-section">
        <button 
          className="raw-data-toggle"
          onClick={() => setShowRawData(!showRawData)}
        >
          <Code size={14} />
          <span>Show Raw Google API Response</span>
          {showRawData ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {showRawData && rawResponse && (
          <div className="raw-data-content fade-in">
            <div className="raw-data-summary">
              <div className="raw-data-item">
                <span className="raw-label">API Endpoint:</span>
                <span className="raw-value mono">googleapis.com/pagespeedonline/v5/runPagespeed</span>
              </div>
              <div className="raw-data-item">
                <span className="raw-label">Raw Score (0-1):</span>
                <span className="raw-value mono">{rawScore?.toFixed(4) ?? 'N/A'}</span>
              </div>
              <div className="raw-data-item">
                <span className="raw-label">Score × 100:</span>
                <span className="raw-value mono">{rawScore ? (rawScore * 100).toFixed(2) : 'N/A'}</span>
              </div>
              <div className="raw-data-item">
                <span className="raw-label">Rounded (displayed):</span>
                <span className="raw-value mono" style={{ color: 'var(--accent)' }}>{rawScorePercent ?? 'N/A'}</span>
              </div>
              <div className="raw-data-item">
                <span className="raw-label">Lighthouse Version:</span>
                <span className="raw-value mono">{rawResponse?.lighthouseResult?.lighthouseVersion}</span>
              </div>
              <div className="raw-data-item">
                <span className="raw-label">Fetch Time:</span>
                <span className="raw-value mono">{rawResponse?.lighthouseResult?.fetchTime}</span>
              </div>
              <div className="raw-data-item">
                <span className="raw-label">Final URL:</span>
                <span className="raw-value mono">{rawResponse?.lighthouseResult?.finalUrl}</span>
              </div>
            </div>
            <details className="raw-json-details">
              <summary>View Full JSON Response</summary>
              <pre className="raw-json mono">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Field Data Section (Real User Data - CrUX) */}
      {result.hasFieldData && result.fieldData && (
        <div className="field-data-section card-stagger" style={{ animationDelay: '0s' }}>
          <div className="section-header">
            <div className="section-header-left">
              <Users size={18} style={{ color: 'var(--accent)' }} />
              <h3 className="section-title">Discover what your real users are experiencing</h3>
            </div>
          </div>
          <p className="section-desc">
            Chrome User Experience Report · Field data collected over the previous 28-day period
          </p>

          <div className="field-overall">
            <span style={{ color: getCategoryColor(result.fieldData.overallCategory) }}>
              {result.fieldData.overallCategory === 'FAST' && '✓ '}
              {result.fieldData.overallCategory === 'SLOW' && '✗ '}
              {result.fieldData.overallCategory === 'AVERAGE' && '△ '}
            </span>
            <span>
              Core Web Vitals Assessment: {' '}
              <strong style={{ color: getCategoryColor(result.fieldData.overallCategory) }}>
                {result.fieldData.overallCategory === 'FAST' ? 'Passed' :
                 result.fieldData.overallCategory === 'SLOW' ? 'Failed' : 'Needs Improvement'}
              </strong>
            </span>
          </div>

          <div className="field-metrics-list">
            {[
              { label: 'First Contentful Paint (FCP)', data: result.fieldData.fcp, unit: 'ms' },
              { label: 'Largest Contentful Paint (LCP)', data: result.fieldData.lcp, unit: 'ms' },
              { label: 'Interaction to Next Paint (INP)', data: result.fieldData.inp, unit: 'ms' },
              { label: 'Cumulative Layout Shift (CLS)', data: result.fieldData.cls, unit: 'cls' },
              { label: 'Time to First Byte (TTFB)', data: result.fieldData.ttfb, unit: 'ms' },
            ].filter(m => m.data.percentile !== null).map(({ label, data, unit }) => (
              <div key={label} className="field-metric-row">
                <div className="field-row-left">
                  <div className="field-row-name">{label}</div>
                  <DistributionBar metric={data} />
                </div>
                <div className="field-row-right">
                  <div className="field-row-value mono" style={{ color: getCategoryColor(data.category) }}>
                    {formatFieldValue(data.percentile, unit)}
                  </div>
                  <div className="field-row-status" style={{ color: getCategoryColor(data.category) }}>
                    {getCategoryLabel(data.category)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!result.hasFieldData && (
        <div className="no-field-data card-stagger" style={{ animationDelay: '0s' }}>
          <Users size={16} />
          <span>
            The Chrome User Experience Report does not have sufficient real-world speed data for this page.
          </span>
        </div>
      )}

      {/* Lab Data Section (Lighthouse) */}
      <div className="lab-data-section">
        <div className="section-header">
          <div className="section-header-left">
            <Beaker size={18} style={{ color: 'var(--accent)' }} />
            <h3 className="section-title">Diagnose performance issues</h3>
          </div>
        </div>
        <p className="section-desc">
          Lab data — analysis from a simulated page load using Lighthouse. These values may vary from real-world experience.
        </p>

        <div className="lab-score-section">
          <ScoreGauge score={result.score} size={160} />
          <div className="score-label">Performance</div>
          <div className="score-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--good)' }} /> 90–100</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--warning)' }} /> 50–89</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--poor)' }} /> 0–49</span>
          </div>
        </div>

        <h4 className="metrics-heading">Metrics</h4>
        <div className="metrics-grid">
          {METRIC_INFO.map((info, i) => (
            <MetricCard
              key={info.key}
              name={info.name}
              shortName={info.shortName}
              data={result.metrics[info.key]}
              description={info.desc}
              delay={i * 0.05}
            />
          ))}
        </div>
      </div>

      {/* Opportunities */}
      <OpportunitiesPanel opportunities={result.opportunities} />

      {/* AI Panel */}
      <AIPanel analysisData={result} />

      {/* Bottom CTA */}
      <div className="bottom-cta">
        <button className="cta-primary" onClick={onBack}>
          Analyze Another URL
        </button>
        <button className="cta-secondary" onClick={onCompare}>
          Compare with Another URL
        </button>
      </div>
    </div>
  );
}
