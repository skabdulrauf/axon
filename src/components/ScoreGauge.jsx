import React, { useEffect, useState } from 'react';

function getScoreColor(score) {
  if (score >= 90) return 'var(--good)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--poor)';
}

function getScoreLabel(score) {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

export default function ScoreGauge({ score, size = 160, showLabel = true }) {
  const [animated, setAnimated] = useState(false);
  const strokeWidth = size > 100 ? 8 : 6;
  const radius = (size / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const center = size / 2;
  const fontSize = size > 100 ? size * 0.25 : size * 0.3;
  const labelSize = size > 100 ? 12 : 10;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background glow */}
        <circle
          cx={center}
          cy={center}
          r={radius + 2}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.08"
        />
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{
            transition: 'stroke-dashoffset 1.2s ease-out',
            transform: 'rotate(-90deg)',
            transformOrigin: `${center}px ${center}px`,
          }}
        />
        {/* Score number */}
        <text
          x={center}
          y={showLabel ? center - 2 : center + 4}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: `${fontSize}px`,
            fontWeight: 500,
            fill: color,
          }}
        >
          {score}
        </text>
        {/* Label text */}
        {showLabel && size > 80 && (
          <text
            x={center}
            y={center + fontSize * 0.7}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: `${labelSize}px`,
              fill: 'var(--text-muted)',
            }}
          >
            {getScoreLabel(score)}
          </text>
        )}
      </svg>
    </div>
  );
}
