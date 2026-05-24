import { useState } from 'react';
import { Sparkles, RefreshCw, Cpu, Zap } from 'lucide-react';
import type { AnalysisResult, Recommendation } from '../App';
import { getRecommendations } from '../api';
import { getStoredGeminiKey } from './SettingsModal';

interface AIPanelProps {
  analysisData: AnalysisResult;
}

export default function AIPanel({ analysisData }: AIPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGeminiKey = !!getStoredGeminiKey();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const recs = await getRecommendations(analysisData);
      setRecommendations(recs);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-section page-enter">
      <h3 className="section-heading">
        <Sparkles size={18} style={{ color: 'var(--accent)' }} />
        AI-Powered Fix Suggestions
      </h3>
      <p className="section-subtext">
        Personalized recommendations based on your actual metrics
      </p>

      {!recommendations && !loading && !error && (
        <>
          <button
            className="ai-trigger-btn"
            onClick={fetchRecommendations}
          >
            {hasGeminiKey ? (
              <>
                <Sparkles size={18} />
                Generate with Gemini AI
              </>
            ) : (
              <>
                <Cpu size={18} />
                Generate Smart Recommendations
              </>
            )}
          </button>
          {!hasGeminiKey && (
            <p style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}>
              <Zap size={12} />
              Add a Gemini API key in Settings for real AI-powered analysis
            </p>
          )}
        </>
      )}

      {loading && (
        <div className="loading-center">
          <span className="spinner spinner-lg" style={{ color: 'var(--accent)' }} />
          <span className="loading-text">
            {hasGeminiKey ? 'Analyzing with Gemini AI...' : 'Generating recommendations...'}
          </span>
        </div>
      )}

      {error && (
        <div className="ai-error fade-in">
          <p>{error}</p>
          <button onClick={fetchRecommendations}>
            <RefreshCw size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Try Again
          </button>
        </div>
      )}

      {recommendations && (
        <div>
          {hasGeminiKey && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--accent)',
              marginBottom: 16,
            }}>
              <Sparkles size={12} />
              Powered by Google Gemini
            </div>
          )}
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="recommendation-card card-stagger"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span className={`rec-priority ${rec.priority}`}>
                {rec.priority}
              </span>
              <div className="rec-title">{rec.title}</div>
              <div className="rec-field">
                <div className="rec-field-label">Problem</div>
                <div className="rec-field-text">{rec.problem}</div>
              </div>
              <div className="rec-field">
                <div className="rec-field-label">Fix</div>
                <div className="rec-field-text">{rec.fix}</div>
              </div>
              <div className="rec-field">
                <div className="rec-field-label">Impact</div>
                <div className="rec-field-text">{rec.impact}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
