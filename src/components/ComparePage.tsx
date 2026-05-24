import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, X, RefreshCw } from 'lucide-react';
import type { AnalysisResult } from '../App';
import { analyzeUrl } from '../api';
import ScoreGauge from './ScoreGauge';

interface ComparePageProps {
  firstResult: AnalysisResult;
  onBack: () => void;
  onCompareComplete: (result: AnalysisResult) => void;
  compareResult: AnalysisResult | null;
}

type MetricKey = 'lcp' | 'fcp' | 'cls' | 'tbt' | 'si' | 'tti';

const METRIC_LABELS: { key: MetricKey; label: string; desc: string }[] = [
  { key: 'lcp', label: 'LCP', desc: 'Largest Contentful Paint' },
  { key: 'fcp', label: 'FCP', desc: 'First Contentful Paint' },
  { key: 'cls', label: 'CLS', desc: 'Cumulative Layout Shift' },
  { key: 'tbt', label: 'TBT', desc: 'Total Blocking Time' },
  { key: 'si', label: 'SI', desc: 'Speed Index' },
  { key: 'tti', label: 'TTI', desc: 'Time to Interactive' },
];

function shortenUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default function ComparePage({
  firstResult,
  onBack,
  onCompareComplete,
  compareResult,
}: ComparePageProps) {
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>(firstResult.strategy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const lastUrlRef = useRef('');
  const lastStrategyRef = useRef<'mobile' | 'desktop'>(firstResult.strategy);
  const startTimeRef = useRef(0);

  // Elapsed time counter
  useEffect(() => {
    if (!loading) {
      setElapsed(0);
      return;
    }
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const runAnalysis = async (targetUrl: string, targetStrategy: 'mobile' | 'desktop') => {
    setLoading(true);
    setError(null);
    setCanRetry(false);
    lastUrlRef.current = targetUrl;
    lastStrategyRef.current = targetStrategy;
    try {
      const result = await analyzeUrl(targetUrl, targetStrategy);
      onCompareComplete(result);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    await runAnalysis(url.trim(), strategy);
  };

  const handleRetry = () => {
    if (lastUrlRef.current) {
      runAnalysis(lastUrlRef.current, lastStrategyRef.current);
    }
  };

  const formatElapsed = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  // Determine winners per metric (lower is better for all)
  const getMetricWinner = (key: MetricKey): 1 | 2 | 0 => {
    if (!compareResult) return 0;
    const v1 = firstResult.metrics[key].numericValue;
    const v2 = compareResult.metrics[key].numericValue;
    if (v1 < v2) return 1;
    if (v2 < v1) return 2;
    return 0;
  };

  const countWins = () => {
    if (!compareResult) return { wins1: 0, wins2: 0 };
    let wins1 = 0, wins2 = 0;
    METRIC_LABELS.forEach(({ key }) => {
      const w = getMetricWinner(key);
      if (w === 1) wins1++;
      if (w === 2) wins2++;
    });
    return { wins1, wins2 };
  };

  if (!compareResult) {
    return (
      <div className="compare-container page-enter">
        <div className="analysis-nav">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Analysis
          </button>
        </div>

        <div className="compare-input-section">
          <h2 className="compare-heading">Compare with Another URL</h2>
          <p className="compare-subtext">
            Analyze a second URL and see a side-by-side breakdown
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Comparing against:</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-primary)' }}>
                {shortenUrl(firstResult.url)}
              </span>
              <span className="strategy-badge" style={{ marginLeft: 'auto' }}>
                {firstResult.strategy}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="input-label">Second Website URL</label>
            <input
              type="text"
              className="url-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
            />

            <div className="strategy-toggle">
              <button
                type="button"
                className={`strategy-btn ${strategy === 'mobile' ? 'active' : ''}`}
                onClick={() => setStrategy('mobile')}
                disabled={loading}
              >
                📱 Mobile
              </button>
              <button
                type="button"
                className={`strategy-btn ${strategy === 'desktop' ? 'active' : ''}`}
                onClick={() => setStrategy('desktop')}
                disabled={loading}
              >
                🖥️ Desktop
              </button>
            </div>

            <button type="submit" className="analyze-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Analyze & Compare
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="error-banner-full fade-in">
              <div className="error-banner-message">
                <span>{error}</span>
              </div>
              <div className="error-banner-actions">
                {canRetry && (
                  <button className="error-retry-btn" onClick={handleRetry}>
                    <RefreshCw size={14} />
                    Try Again
                  </button>
                )}
                <button className="error-dismiss-btn" onClick={() => { setError(null); setCanRetry(false); }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-panel fade-in">
              <div className="loading-spinner-wrap">
                <span className="spinner spinner-lg" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="loading-info">
                <div className="loading-title">Running Lighthouse audit...</div>
                <div className="loading-detail">
                  This typically takes 15–30 seconds
                </div>
                <div className="loading-elapsed">
                  <span className="mono">{formatElapsed(elapsed)}</span> elapsed
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { wins1, wins2 } = countWins();
  const scoreDiff = Math.abs(firstResult.score - compareResult.score);
  const scoreWinner = firstResult.score > compareResult.score ? 1 : compareResult.score > firstResult.score ? 2 : 0;

  return (
    <div className="compare-container page-enter">
      <div className="analysis-nav">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Analysis
        </button>
      </div>

      <div className="compare-columns">
        <div className="compare-col card-stagger" style={{ animationDelay: '0s' }}>
          <div className="compare-col-url">{shortenUrl(firstResult.url)}</div>
          <span className="strategy-badge">{firstResult.strategy}</span>
          <div style={{ marginTop: 16 }}>
            <ScoreGauge score={firstResult.score} size={120} />
          </div>
        </div>
        <div className="compare-col card-stagger" style={{ animationDelay: '0.1s' }}>
          <div className="compare-col-url">{shortenUrl(compareResult.url)}</div>
          <span className="strategy-badge">{compareResult.strategy}</span>
          <div style={{ marginTop: 16 }}>
            <ScoreGauge score={compareResult.score} size={120} />
          </div>
        </div>
      </div>

      <div className="winner-banner fade-in">
        <div className="winner-text">
          {scoreDiff <= 5
            ? '🤝 Both sites perform similarly'
            : scoreWinner === 1
            ? `🏆 ${shortenUrl(firstResult.url)} is faster by ${scoreDiff} points`
            : `🏆 ${shortenUrl(compareResult.url)} is faster by ${scoreDiff} points`}
        </div>
      </div>

      <table className="compare-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>{shortenUrl(firstResult.url)}</th>
            <th>{shortenUrl(compareResult.url)}</th>
            <th style={{ textAlign: 'center' }}>Winner</th>
          </tr>
        </thead>
        <tbody>
          {METRIC_LABELS.map(({ key, label, desc }, i) => {
            const winner = getMetricWinner(key);
            return (
              <tr key={key} className="card-stagger" style={{ animationDelay: `${i * 0.05}s` }}>
                <td className="metric-label" title={desc}>
                  {label}
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                    {desc}
                  </span>
                </td>
                <td className={`val-cell ${winner === 1 ? 'winner' : ''}`}>
                  {firstResult.metrics[key].value}
                </td>
                <td className={`val-cell ${winner === 2 ? 'winner' : ''}`}>
                  {compareResult.metrics[key].value}
                </td>
                <td className="winner-check">
                  {winner === 1 && <span title={shortenUrl(firstResult.url)}>✓ 1st</span>}
                  {winner === 2 && <span title={shortenUrl(compareResult.url)}>✓ 2nd</span>}
                  {winner === 0 && <span style={{ color: 'var(--text-muted)' }}>Tie</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="summary-card fade-in">
        <div className="summary-title">Overall Comparison</div>
        <div className="summary-scores">
          <div className="summary-score-item">
            <div
              className="summary-score-num mono"
              style={{ color: scoreWinner === 1 || scoreWinner === 0 ? 'var(--good)' : 'var(--text-secondary)' }}
            >
              {firstResult.score}
            </div>
            <div className="summary-score-url">{shortenUrl(firstResult.url)}</div>
          </div>
          <div style={{ color: 'var(--text-muted)', alignSelf: 'center', fontSize: 20 }}>vs</div>
          <div className="summary-score-item">
            <div
              className="summary-score-num mono"
              style={{ color: scoreWinner === 2 ? 'var(--good)' : 'var(--text-secondary)' }}
            >
              {compareResult.score}
            </div>
            <div className="summary-score-url">{shortenUrl(compareResult.url)}</div>
          </div>
        </div>
        <div className="summary-wins">
          <span className="summary-win-item">
            {shortenUrl(firstResult.url)} wins {wins1} metric{wins1 !== 1 ? 's' : ''}
          </span>
          <span className="summary-win-item">
            {shortenUrl(compareResult.url)} wins {wins2} metric{wins2 !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
