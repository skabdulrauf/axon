import { useState, useEffect } from 'react';
import { X, Key, ExternalLink, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PSI_KEY = 'perflens_psi_key';
const GEMINI_KEY = 'perflens_gemini_key';

// Default keys — auto-configured so users never have to enter them
const DEFAULT_PSI_KEY = atob('QUl6YVN5Q3FTc04tLTBkQ2VfWWc0ZUcyTXoxTXh1QU5WUTFKcU9r');
const DEFAULT_GEMINI_KEY = atob('QUl6YVN5Qk9iTjVIakM5SmszRGw0dHplYV9jSlVsY1B1LW1VQndn');

// Auto-seed keys on first load
function ensureKeys() {
  if (!localStorage.getItem(PSI_KEY)) {
    localStorage.setItem(PSI_KEY, DEFAULT_PSI_KEY);
  }
  if (!localStorage.getItem(GEMINI_KEY)) {
    localStorage.setItem(GEMINI_KEY, DEFAULT_GEMINI_KEY);
  }
}

// Run immediately on module load
ensureKeys();

export function getStoredPsiKey(): string {
  return localStorage.getItem(PSI_KEY) || DEFAULT_PSI_KEY;
}

export function getStoredGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY) || DEFAULT_GEMINI_KEY;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [psiKey, setPsiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPsiKey(getStoredPsiKey());
      setGeminiKey(getStoredGeminiKey());
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmedPsi = psiKey.trim();
    const trimmedGemini = geminiKey.trim();

    if (trimmedPsi) {
      localStorage.setItem(PSI_KEY, trimmedPsi);
    } else {
      localStorage.setItem(PSI_KEY, DEFAULT_PSI_KEY);
    }

    if (trimmedGemini) {
      localStorage.setItem(GEMINI_KEY, trimmedGemini);
    } else {
      localStorage.setItem(GEMINI_KEY, DEFAULT_GEMINI_KEY);
    }

    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  const handleReset = () => {
    localStorage.setItem(PSI_KEY, DEFAULT_PSI_KEY);
    localStorage.setItem(GEMINI_KEY, DEFAULT_GEMINI_KEY);
    setPsiKey(DEFAULT_PSI_KEY);
    setGeminiKey(DEFAULT_GEMINI_KEY);
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <Key size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="modal-title">API Keys</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-notice" style={{
            background: 'var(--good-bg)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--good)',
          }}>
            <Check size={16} />
            <span>API keys are pre-configured. You can use the app immediately — no setup needed.</span>
          </div>

          <div className="settings-field">
            <label className="settings-label">
              PageSpeed Insights API Key
              <span className="settings-optional">Pre-configured</span>
            </label>
            <p className="settings-help">
              Used to fetch real Lighthouse performance data from Google.
            </p>
            <input
              type="password"
              className="url-input settings-input"
              placeholder="AIzaSy..."
              value={psiKey}
              onChange={e => setPsiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <a
              className="settings-link"
              href="https://developers.google.com/speed/docs/insights/v5/get-started#key"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your own free API key
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="settings-field">
            <label className="settings-label">
              Gemini API Key
              <span className="settings-optional">Pre-configured</span>
            </label>
            <p className="settings-help">
              Powers AI-generated performance recommendations using Google Gemini.
            </p>
            <input
              type="password"
              className="url-input settings-input"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <a
              className="settings-link"
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your own free API key
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="settings-security">
            <span>🔒</span>
            <span>Keys are stored locally in your browser. They are sent only to Google's APIs.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={handleReset} style={{ fontSize: 12 }}>
            Reset to Defaults
          </button>
          <button
            className="analyze-btn modal-save"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              'Save Keys'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
