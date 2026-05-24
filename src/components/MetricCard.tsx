import type { MetricData } from '../App';

interface MetricCardProps {
  name: string;
  shortName: string;
  data: MetricData;
  description: string;
  delay: number;
}

const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  lcp: { good: 2500, poor: 4000 },
  fcp: { good: 1800, poor: 3000 },
  cls: { good: 0.1, poor: 0.25 },
  tbt: { good: 200, poor: 600 },
  si: { good: 3400, poor: 5800 },
  tti: { good: 3800, poor: 7300 },
};

function getStatus(shortName: string, numericValue: number): 'good' | 'warning' | 'poor' {
  const key = shortName.toLowerCase();
  const t = THRESHOLDS[key];
  if (!t) return 'warning';
  if (numericValue <= t.good) return 'good';
  if (numericValue >= t.poor) return 'poor';
  return 'warning';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'good': return 'Good';
    case 'warning': return 'Needs Work';
    case 'poor': return 'Poor';
    default: return 'Unknown';
  }
}

export default function MetricCard({ name, shortName, data, description, delay }: MetricCardProps) {
  const status = getStatus(shortName, data.numericValue);

  return (
    <div
      className={`metric-card ${status} card-stagger`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="metric-name">{name}</div>
      <div className="metric-value">{data.value}</div>
      <span className={`metric-status ${status}`}>
        {getStatusLabel(status)}
      </span>
      <div className="metric-desc">{description}</div>
    </div>
  );
}
