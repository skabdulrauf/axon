import { useState, useEffect, useRef } from 'react';
import { X, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '../App';
import { analyzeUrl } from '../api';

interface HomePageProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  navigateTo: (page: any) => void;
  hasHistory: boolean;
}

const POPULAR_SITES = [
  { label: 'google.com', url: 'https://google.com' },
  { label: 'github.com', url: 'https://github.com' },
  { label: 'wikipedia.org', url: 'https://wikipedia.org' },
  { label: 'stackoverflow.com', url: 'https://stackoverflow.com' },
  { label: 'bbc.com', url: 'https://bbc.com' },
];

const BLOCKED_DOMAINS = [
  'flipkart.com', 'myntra.com', 'ajio.com', 'meesho.com', 'nykaa.com',
  'amazon.in', 'amazon.com', 'paytm.com', 'bigbasket.com', 'zepto.co'
];

function checkIfBlocked(url: string): string | null {
  try {
    const hostname = new URL(url.includes('://') ? url : 'https://' + url).hostname.toLowerCase();
    const blocked = BLOCKED_DOMAINS.find(d => hostname === d || hostname.endsWith('.' + d));
    if (blocked) return `${blocked} blocks automated testing (bot protection). Try a different site.`;
  } catch {}
  return null;
}

export default function HomePage({ onAnalysisComplete, navigateTo, hasHistory }: HomePageProps) {
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const lastUrlRef = useRef('');
  const lastStrategyRef = useRef<'mobile' | 'desktop'>('mobile');
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    setWarning(url.trim() ? checkIfBlocked(url.trim()) : null);
  }, [url]);

  const runAnalysis = async (targetUrl: string, targetStrategy: 'mobile' | 'desktop') => {
    const blocked = checkIfBlocked(targetUrl);
    if (blocked) { setError(blocked); return; }

    setLoading(true);
    setError(null);
    setWarning(null);
    setCanRetry(false);
    lastUrlRef.current = targetUrl;
    lastStrategyRef.current = targetStrategy;
    
    try {
      const result = await analyzeUrl(targetUrl, targetStrategy);
      onAnalysisComplete(result);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
      setCanRetry(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { setError('Please enter a URL'); return; }
    await runAnalysis(url.trim(), strategy);
  };

  const handleRetry = () => {
    if (lastUrlRef.current) runAnalysis(lastUrlRef.current, lastStrategyRef.current);
  };

  const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="home-container page-enter">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="3.5" stroke="var(--accent)" strokeWidth="1" />
        <line x1="12" y1="1.5" x2="12" y2="5" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="22.5" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
        <line x1="1.5" y1="12" x2="5" y2="12" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
        <line x1="19" y1="12" x2="22.5" y2="12" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
      </svg>

      <h1 className="home-title">PerfLens</h1>
      <p className="home-subtitle">
        Real performance data from Google PageSpeed Insights API. Same data as the official tool.
      </p>

      <div className="home-divider" />

      <form className="home-form" onSubmit={handleSubmit}>
        <label className="input-label" htmlFor="url-input">Website URL</label>
        <input
          id="url-input"
          type="text"
          className="url-input"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          autoComplete="url"
          autoFocus
        />

        {warning && !loading && !error && (
          <div className="warning-hint fade-in">
            <AlertTriangle size={14} />
            <span>{warning}</span>
          </div>
        )}

        <div className="strategy-toggle">
          <button type="button" className={`strategy-btn ${strategy === 'mobile' ? 'active' : ''}`} onClick={() => setStrategy('mobile')} disabled={loading}>
            📱 Mobile
          </button>
          <button type="button" className={`strategy-btn ${strategy === 'desktop' ? 'active' : ''}`} onClick={() => setStrategy('desktop')} disabled={loading}>
            🖥️ Desktop
          </button>
        </div>

        <button type="submit" className="analyze-btn" disabled={loading}>
          {loading ? (<><span className="spinner" /> Analyzing...</>) : (<><Search size={18} /> Analyze</>)}
        </button>
      </form>

      {error && (
        <div className="error-banner-full fade-in">
          <div className="error-banner-message"><span>{error}</span></div>
          <div className="error-banner-actions">
            {canRetry && (
              <button className="error-retry-btn" onClick={handleRetry}>
                <RefreshCw size={14} /> Try Again
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
            <div className="loading-detail">This typically takes 15–30 seconds</div>
            <div className="loading-elapsed"><span className="mono">{formatElapsed(elapsed)}</span> elapsed</div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="popular-section fade-in">
          <span className="input-label">Try a site that works well</span>
          <div className="popular-chips">
            {POPULAR_SITES.map(site => (
              <button key={site.label} type="button" className="popular-chip" onClick={() => { setUrl(site.url); setWarning(null); }}>
                {site.label}
              </button>
            ))}
          </div>
          <p className="popular-note">⚠️ Some sites (Flipkart, Amazon, etc.) block automated testing</p>
        </div>
      )}

      {hasHistory && !loading && (
        <button className="history-hint" onClick={() => navigateTo('history')}>
          View past analyses →
        </button>
      )}
    </div>
  );
}
