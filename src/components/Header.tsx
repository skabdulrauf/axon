import { Activity, Clock } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  navigateTo: (page: any) => void;
}

export default function Header({ currentPage, navigateTo }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-logo" onClick={() => navigateTo('home')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10.5" stroke="var(--accent)" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="3.5" stroke="var(--accent)" strokeWidth="1" />
          <line x1="12" y1="1.5" x2="12" y2="5" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
          <line x1="12" y1="19" x2="12" y2="22.5" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
          <line x1="1.5" y1="12" x2="5" y2="12" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
          <line x1="19" y1="12" x2="22.5" y2="12" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <span className="header-logo-text">PerfLens</span>
      </div>

      {currentPage !== 'home' && (
        <nav className="header-nav">
          <button
            className={`header-nav-btn ${currentPage === 'analysis' ? 'active' : ''}`}
            onClick={() => navigateTo('home')}
          >
            <Activity size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Analyze
          </button>
          <button
            className={`header-nav-btn ${currentPage === 'history' ? 'active' : ''}`}
            onClick={() => navigateTo('history')}
          >
            <Clock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            History
          </button>
        </nav>
      )}
    </header>
  );
}
