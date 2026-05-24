import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'var(--good)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--poor)';
}

export default function ScoreGauge({ score, size = 160, showLabel = true }: ScoreGaugeProps) {
  const [animatedOffset, setAnimatedOffset] = useState<number | null>(null);
  const strokeWidth = size > 100 ? 4 : 3;
  const radius = (size / 2) - strokeWidth - 4;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const fontSize = size > 100 ? size * 0.22 : size * 0.30;
  const labelSize = size > 100 ? 10 : 8;

  useEffect(() => {
    setAnimatedOffset(circumference);
    const timer = setTimeout(() => setAnimatedOffset(targetOffset), 100);
    return () => clearTimeout(timer);
  }, [score, circumference, targetOffset]);

  return (
    <div style={{ display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset ?? circumference}
          style={{
            transition: 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
          opacity="0.75"
        />
        <text
          x={size / 2} y={showLabel ? size / 2 - 2 : size / 2 + 2}
          textAnchor="middle" dominantBaseline="central"
          fill="var(--text-primary)"
          style={{ fontFamily: "'DM Mono', monospace", fontSize: `${fontSize}px`, fontWeight: 400 }}
        >
          {score}
        </text>
        {showLabel && (
          <text
            x={size / 2} y={size / 2 + fontSize * 0.65}
            textAnchor="middle" dominantBaseline="central"
            fill="var(--text-faint)"
            style={{ fontSize: `${labelSize}px` }}
          >
            / 100
          </text>
        )}
      </svg>
    </div>
  );
}
