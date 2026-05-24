import { ArrowLeft, ArrowRight, Search, Trash2 } from 'lucide-react';
import type { AnalysisResult } from '../App';
import ScoreGauge from './ScoreGauge';

interface HistoryPageProps {
  history: AnalysisResult[];
  onSelect: (result: AnalysisResult) => void;
  onClear: () => void;
  onBack: () => void;
  navigateTo: (page: any) => void;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    return url;
  }
}

export default function HistoryPage({ history, onSelect, onClear, onBack, navigateTo }: HistoryPageProps) {
  return (
    <div className="history-container page-enter">
      {/* Nav */}
      <div className="analysis-nav">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back
        </button>
        {history.length > 0 && (
          <button className="clear-btn" onClick={onClear}>
            <Trash2 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Clear All
          </button>
        )}
      </div>

      <div className="history-header">
        <h2 className="history-heading">Analysis History</h2>
      </div>
      <p className="history-subtext">Your last 10 analyses</p>

      {history.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1" />
            <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <h3 className="empty-title">No analyses yet</h3>
          <p className="empty-text">Analyze a website to see results here</p>
          <button className="empty-btn" onClick={() => navigateTo('home')}>
            <Search size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Analyze a URL →
          </button>
        </div>
      ) : (
        <div>
          {history.map((item, i) => (
            <div
              key={`${item.url}-${item.strategy}-${item.analyzedAt}`}
              className="history-card card-stagger"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => onSelect(item)}
            >
              <div className="history-score-circle">
                <ScoreGauge score={item.score} size={40} showLabel={false} />
              </div>
              <div className="history-info">
                <div className="history-url">{shortenUrl(item.url)}</div>
                <div className="history-meta">
                  <span className="strategy-badge">{item.strategy}</span>
                  <span className="history-time">{formatRelativeTime(item.analyzedAt)}</span>
                </div>
              </div>
              <span className="history-arrow">
                <ArrowRight size={16} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
