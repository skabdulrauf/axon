import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import AnalysisPage from './components/AnalysisPage';
import ComparePage from './components/ComparePage';
import HistoryPage from './components/HistoryPage';
import { getHistory, clearHistory } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const navigateTo = useCallback((page) => {
    setCurrentPage(page);
    if (page === 'history') {
      refreshHistory();
    }
    if (page === 'compare') {
      setCompareResult(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [refreshHistory]);

  const handleAnalysisComplete = useCallback((result) => {
    setAnalysisResult(result);
    setCompareResult(null);
    refreshHistory();
  }, [refreshHistory]);

  const handleCompareComplete = useCallback((result) => {
    setCompareResult(result);
  }, []);

  const handleHistorySelect = useCallback((result) => {
    setAnalysisResult(result);
    setCompareResult(null);
    setCurrentPage('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onAnalysisComplete={handleAnalysisComplete}
            navigateTo={navigateTo}
          />
        );
      case 'analysis':
        if (!analysisResult) {
          return (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                No analysis data. Start by analyzing a URL.
              </p>
              <button className="btn-primary" onClick={() => navigateTo('home')} style={{ maxWidth: 220, margin: '0 auto' }}>
                Go to Analyzer
              </button>
            </div>
          );
        }
        return (
          <AnalysisPage
            result={analysisResult}
            navigateTo={navigateTo}
          />
        );
      case 'compare':
        return (
          <ComparePage
            firstResult={analysisResult}
            compareResult={compareResult}
            onCompareComplete={handleCompareComplete}
            navigateTo={navigateTo}
          />
        );
      case 'history':
        return (
          <HistoryPage
            history={history}
            onSelect={handleHistorySelect}
            onClear={handleClearHistory}
            navigateTo={navigateTo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentPage={currentPage} navigateTo={navigateTo} />
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>
    </div>
  );
}
