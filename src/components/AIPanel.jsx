import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getRecommendations } from '../services/api';

const priorityStyles = {
  High: { bg: 'var(--poor-bg)', color: 'var(--poor)', border: 'rgba(239, 68, 68, 0.3)' },
  Medium: { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'rgba(245, 158, 11, 0.3)' },
  Low: { bg: 'var(--good-bg)', color: 'var(--good)', border: 'rgba(16, 185, 129, 0.3)' },
};

export default function AIPanel({ analysisData }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const recs = await getRecommendations(analysisData);
      setRecommendations(recs);
    } catch (err) {
      setError(err.message || 'AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        AI-Powered Fix Suggestions
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Personalized recommendations based on your actual metrics
      </p>

      {!recommendations && !loading && !error && (
        <button className="btn-primary" onClick={fetchRecommendations} style={{ maxWidth: 320 }}>
          <Sparkles size={18} />
          Generate Recommendations
        </button>
      )}

      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: 14,
          }}
        >
          <span className="spinner spinner--accent" />
          Analyzing with AI...
        </div>
      )}

      {error && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '20px 24px',
            background: 'var(--poor-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius)',
          }}
        >
          <span style={{ color: 'var(--poor)', fontSize: 14 }}>{error}</span>
          <button className="btn-secondary" onClick={fetchRecommendations} style={{ alignSelf: 'flex-start' }}>
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {recommendations && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recommendations.map((rec, i) => {
            const ps = priorityStyles[rec.priority] || priorityStyles.Medium;
            return (
              <div
                key={i}
                className="fade-in"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  opacity: 0,
                  animationFillMode: 'forwards',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  transition: 'var(--transition)',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: ps.bg,
                    color: ps.color,
                    border: `1px solid ${ps.border}`,
                    padding: '2px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {rec.priority}
                </span>

                <h4
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 14,
                    paddingRight: 80,
                  }}
                >
                  {rec.title}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <span className="label">Problem</span>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                      {rec.problem}
                    </p>
                  </div>
                  <div>
                    <span className="label">Fix</span>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                      {rec.fix}
                    </p>
                  </div>
                  <div>
                    <span className="label">Impact</span>
                    <p style={{ fontSize: 13, color: 'var(--accent)', marginTop: 3, lineHeight: 1.5 }}>
                      {rec.impact}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
