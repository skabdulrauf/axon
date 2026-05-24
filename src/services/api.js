// API Service - All calls go through backend /api endpoints
// Fallback to direct API calls only for demo/static builds

const API_BASE = '/api';

// Keys for fallback mode only (when backend unavailable)
const FALLBACK_PAGESPEED_KEY = 'AIzaSyCIih5edrF8SzYLJGIoYBqQt_ZroZRIEBE';
const FALLBACK_GEMINI_KEY = 'AIzaSyCPraMXKoMWmSsJiTHRrWR4hBZa4B2cbEo';

let useDirectApi = false;

// Check if backend is available
async function checkBackend() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// Initialize - check backend on first call
let backendChecked = false;
async function ensureBackendCheck() {
  if (!backendChecked) {
    backendChecked = true;
    const available = await checkBackend();
    useDirectApi = !available;
    if (useDirectApi) {
      console.log('Backend not available, using direct API calls');
    }
  }
}

// Fetch with timeout and retry
async function fetchWithRetry(url, options = {}, retries = 1, timeoutMs = 90000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        throw new Error('Network error. Please check your connection.');
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// URL normalization
function normalizeUrl(input) {
  let url = (input || '').trim();
  if (!url) throw new Error('Please enter a URL');
  
  url = url.replace(/^["']+|["']+$/g, '');
  
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.')
    ) {
      throw new Error('Private URLs cannot be analyzed');
    }
    
    return parsed.href;
  } catch (e) {
    if (e.message === 'Private URLs cannot be analyzed') throw e;
    throw new Error('Please enter a valid URL');
  }
}

// Direct PageSpeed API call (fallback)
async function analyzeDirectly(normalizedUrl, strategy) {
  const params = new URLSearchParams({
    url: normalizedUrl,
    strategy: strategy,
    key: FALLBACK_PAGESPEED_KEY,
    category: 'performance',
  });
  
  const response = await fetchWithRetry(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
    {},
    1,
    120000
  );
  
  if (!response.ok) {
    let errorMsg = 'Could not analyze this URL.';
    try {
      const err = await response.json();
      if (err?.error?.message) {
        const msg = err.error.message;
        if (msg.includes('DNS_FAILURE')) errorMsg = 'Could not reach this website.';
        else if (msg.includes('NOT_HTML')) errorMsg = 'URL does not point to an HTML page.';
      }
    } catch {}
    throw new Error(errorMsg);
  }
  
  const data = await response.json();
  const lhr = data.lighthouseResult;
  
  if (!lhr) throw new Error('No Lighthouse data returned.');
  
  const audits = lhr.audits || {};
  const categories = lhr.categories || {};
  const perfCategory = categories.performance || {};
  
  const safeAudit = (id) => {
    const audit = audits[id];
    if (!audit) return { value: 'N/A', numericValue: 0, score: 0 };
    return {
      value: audit.displayValue || 'N/A',
      numericValue: audit.numericValue || 0,
      score: audit.score ?? 0,
    };
  };
  
  const perfRefs = perfCategory.auditRefs || [];
  
  return {
    score: Math.round((perfCategory.score ?? 0) * 100),
    metrics: {
      lcp: safeAudit('largest-contentful-paint'),
      fcp: safeAudit('first-contentful-paint'),
      cls: safeAudit('cumulative-layout-shift'),
      tbt: safeAudit('total-blocking-time'),
      si: safeAudit('speed-index'),
      tti: safeAudit('interactive'),
    },
    opportunities: perfRefs
      .filter(ref => ref.group === 'load-opportunities')
      .map(ref => audits[ref.id])
      .filter(a => a && a.score !== null && a.score < 1 && a.details)
      .slice(0, 6)
      .map(a => ({
        id: a.id,
        title: a.title,
        description: a.description || '',
        displayValue: a.displayValue || '',
        score: a.score,
      })),
    diagnostics: perfRefs
      .filter(ref => ref.group === 'diagnostics')
      .map(ref => audits[ref.id])
      .filter(a => a && a.score !== null && a.score < 1)
      .slice(0, 4)
      .map(a => ({
        id: a.id,
        title: a.title,
        displayValue: a.displayValue || '',
        score: a.score,
      })),
    url: normalizedUrl,
    strategy,
    analyzedAt: new Date().toISOString(),
    pageTitle: lhr.finalUrl || normalizedUrl,
  };
}

// Main analyze function
export async function analyzeUrl(url, strategy, onProgress) {
  await ensureBackendCheck();
  
  const normalizedUrl = normalizeUrl(url);
  onProgress?.('Starting analysis...');
  
  if (useDirectApi) {
    onProgress?.('Running Lighthouse audit...');
    return await analyzeDirectly(normalizedUrl, strategy);
  }
  
  // Use backend
  onProgress?.('Connecting to server...');
  
  const response = await fetchWithRetry(
    `${API_BASE}/analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: normalizedUrl, strategy }),
    },
    1,
    120000
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Analysis failed');
  }
  
  return data;
}

// AI Recommendations
export async function getRecommendations(analysisData) {
  await ensureBackendCheck();
  
  if (useDirectApi) {
    return await getRecommendationsDirectly(analysisData);
  }
  
  const response = await fetchWithRetry(
    `${API_BASE}/recommendations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysisData }),
    },
    1,
    20000
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'AI analysis failed');
  }
  
  return data.recommendations;
}

// Direct Gemini API call (fallback)
async function getRecommendationsDirectly(analysisData) {
  const oppList = (analysisData.opportunities || [])
    .map(o => `- ${o.title}: ${o.displayValue}`)
    .join('\n') || 'None';
    
  const prompt = `You are a senior web performance engineer. A website has been analyzed with Google Lighthouse.

Website: ${analysisData.url}
Overall Performance Score: ${analysisData.score}/100
Strategy: ${analysisData.strategy}

Metrics:
- LCP: ${analysisData.metrics.lcp.value}
- FCP: ${analysisData.metrics.fcp.value}
- CLS: ${analysisData.metrics.cls.value}
- TBT: ${analysisData.metrics.tbt.value}
- Speed Index: ${analysisData.metrics.si.value}
- TTI: ${analysisData.metrics.tti.value}

Top Issues:
${oppList}

Give exactly 5 specific, actionable recommendations.

Return ONLY a valid JSON array with these fields:
{
  "title": "short title",
  "problem": "what's wrong",
  "fix": "how to fix it",
  "impact": "which metric improves",
  "priority": "High" or "Medium" or "Low"
}`;

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${FALLBACK_GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
      }),
    },
    1,
    20000
  );
  
  if (!response.ok) {
    throw new Error('AI analysis failed');
  }
  
  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const match = text.match(/\[[\s\S]*\]/);
  if (match) text = match[0];
  
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

// History management
const HISTORY_KEY = 'perflens_history';
const MAX_HISTORY = 10;

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addToHistory(result) {
  const history = getHistory();
  const filtered = history.filter(
    h => !(h.url === result.url && h.strategy === result.strategy)
  );
  filtered.unshift(result);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
