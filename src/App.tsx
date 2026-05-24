import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import AnalysisPage from './components/AnalysisPage';
import ComparePage from './components/ComparePage';
import HistoryPage from './components/HistoryPage';
import SettingsModal from './components/SettingsModal';
import './App.css';

export interface MetricData {
  value: string;
  numericValue: number;
  score: number;
}

export interface FieldMetric {
  category: 'FAST' | 'AVERAGE' | 'SLOW' | null;
  percentile: number | null;
  distributions?: { min: number; max: number; proportion: number }[];
}

export interface FieldData {
  lcp: FieldMetric;
  fid: FieldMetric;
  inp: FieldMetric;
  cls: FieldMetric;
  fcp: FieldMetric;
  ttfb: FieldMetric;
  overallCategory: 'FAST' | 'AVERAGE' | 'SLOW' | null;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  displayValue: string;
  score: number;
  savings?: number;
}

export interface Diagnostic {
  id: string;
  title: string;
  displayValue: string;
  score: number;
}

export interface AnalysisResult {
  score: number;
  metrics: {
    lcp: MetricData;
    fcp: MetricData;
    cls: MetricData;
    tbt: MetricData;
    si: MetricData;
    tti: MetricData;
  };
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
  fieldData: FieldData | null;
  hasFieldData: boolean;
  url: string;
  finalUrl: string;
  strategy: 'mobile' | 'desktop';
  analyzedAt: string;
  lighthouseVersion: string;
  fetchTime: string;
}

export interface Recommendation {
  title: string;
  problem: string;
  fix: string;
  impact: string;
  priority: 'High' | 'Medium' | 'Low';
}

type Page = 'home' | 'analysis' | 'compare' | 'history';

const HISTORY_KEY = 'perflens_history';

function loadHistory(): AnalysisResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(history: AnalysisResult[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [compareResult, setCompareResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>(loadHistory);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Hidden settings: Ctrl+Shift+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        setSettingsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addToHistory = useCallback((result: AnalysisResult) => {
    setHistory(prev => {
      const filtered = prev.filter(
        h => !(h.url === result.url && h.strategy === result.strategy)
      );
      const updated = [result, ...filtered].slice(0, 10);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const onAnalysisComplete = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setCompareResult(null);
    addToHistory(result);
    navigateTo('analysis');
  }, [addToHistory, navigateTo]);

  const onCompareComplete = useCallback((result: AnalysisResult) => {
    setCompareResult(result);
    addToHistory(result);
  }, [addToHistory]);

  const onSelectFromHistory = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setCompareResult(null);
    navigateTo('analysis');
  }, [navigateTo]);

  const onClearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onAnalysisComplete={onAnalysisComplete}
            navigateTo={navigateTo}
            hasHistory={history.length > 0}
          />
        );
      case 'analysis':
        return analysisResult ? (
          <AnalysisPage
            result={analysisResult}
            onBack={() => navigateTo('home')}
            onCompare={() => navigateTo('compare')}
            navigateTo={navigateTo}
          />
        ) : (
          <HomePage
            onAnalysisComplete={onAnalysisComplete}
            navigateTo={navigateTo}
            hasHistory={history.length > 0}
          />
        );
      case 'compare':
        return analysisResult ? (
          <ComparePage
            firstResult={analysisResult}
            onBack={() => navigateTo('analysis')}
            onCompareComplete={onCompareComplete}
            compareResult={compareResult}
          />
        ) : (
          <HomePage
            onAnalysisComplete={onAnalysisComplete}
            navigateTo={navigateTo}
            hasHistory={history.length > 0}
          />
        );
      case 'history':
        return (
          <HistoryPage
            history={history}
            onSelect={onSelectFromHistory}
            onClear={onClearHistory}
            onBack={() => {
              navigateTo(analysisResult ? 'analysis' : 'home');
            }}
            navigateTo={navigateTo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header currentPage={currentPage} navigateTo={navigateTo} />
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
