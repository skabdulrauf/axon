import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { Opportunity } from '../App';

interface OpportunitiesPanelProps {
  opportunities: Opportunity[];
}

export default function OpportunitiesPanel({ opportunities }: OpportunitiesPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (opportunities.length === 0) {
    return (
      <div className="opportunities-section page-enter">
        <h3 className="section-heading">
          Issues Found
          <span className="count-badge">0</span>
        </h3>
        <div className="no-issues">
          <CheckCircle size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          No significant issues found — great performance!
        </div>
      </div>
    );
  }

  return (
    <div className="opportunities-section page-enter">
      <h3 className="section-heading">
        Issues Found
        <span className="count-badge">{opportunities.length}</span>
      </h3>
      {opportunities.map((opp, i) => {
        const isOpen = expanded.has(opp.id);
        return (
          <div
            key={opp.id}
            className="opportunity-card card-stagger"
            style={{ animationDelay: `${i * 0.05}s` }}
            onClick={() => toggle(opp.id)}
          >
            <div className="opp-header">
              <span className="opp-title">{opp.title}</span>
              {opp.displayValue && (
                <span className="opp-value">{opp.displayValue}</span>
              )}
              <span className="opp-toggle">
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </div>
            {isOpen && opp.description && (
              <div className="opp-desc fade-in">{opp.description}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
