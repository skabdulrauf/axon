/**
 * PerfLens API - Uses the EXACT same Google PageSpeed Insights API as pagespeed.web.dev
 * 
 * API Endpoint: https://www.googleapis.com/pagespeedonline/v5/runPagespeed
 * Documentation: https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
 * 
 * IMPORTANT: Lighthouse scores have natural variance of ±5 points between runs.
 * This is expected behavior, not a bug. Even running twice on pagespeed.web.dev
 * will give slightly different scores.
 */

import type { AnalysisResult, Recommendation, FieldData, FieldMetric } from './App';
import { getStoredPsiKey, getStoredGeminiKey } from './components/SettingsModal';

const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Store raw response for debugging/verification
let lastRawResponse: any = null;
export function getLastRawResponse() { return lastRawResponse; }

// Normalize URL exactly like Google does
function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url) throw new Error('Please enter a URL');
  
  // Add https:// if no protocol
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  try {
    const parsed = new URL(url);
    // Block localhost/private IPs
    const h = parsed.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) {
      throw new Error('Cannot analyze localhost or private IPs');
    }
    return parsed.href;
  } catch (e: any) {
    if (e.message.includes('Cannot analyze')) throw e;
    throw new Error('Invalid URL format');
  }
}

function shortenUrl(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

// Extract CrUX field data
function extractFieldData(loadingExperience: any): FieldData | null {
  if (!loadingExperience?.metrics) return null;
  const m = loadingExperience.metrics;
  
  const get = (key: string): FieldMetric => {
    const metric = m[key];
    if (!metric) return { category: null, percentile: null };
    return {
      category: metric.category || null,
      percentile: metric.percentile ?? null,
      distributions: metric.distributions || undefined,
    };
  };

  return {
    lcp: get('LARGEST_CONTENTFUL_PAINT_MS'),
    fid: get('FIRST_INPUT_DELAY_MS'),
    inp: get('INTERACTION_TO_NEXT_PAINT'),
    cls: get('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
    fcp: get('FIRST_CONTENTFUL_PAINT_MS'),
    ttfb: get('EXPERIMENTAL_TIME_TO_FIRST_BYTE'),
    overallCategory: loadingExperience.overall_category || null,
  };
}

/**
 * Call the Google PageSpeed Insights API
 * This is the EXACT same API that pagespeed.web.dev uses
 */
export async function analyzeUrl(
  inputUrl: string,
  strategy: 'mobile' | 'desktop'
): Promise<AnalysisResult> {
  const url = normalizeUrl(inputUrl);
  const apiKey = getStoredPsiKey();

  if (!apiKey) {
    throw new Error('API key required. Click ⚙ to add your Google PageSpeed API key.');
  }

  // Build API URL with exact same parameters as official pagespeed.web.dev
  const params = new URLSearchParams({
    url: url,
    key: apiKey,
    strategy: strategy,
    category: 'performance',
  });

  const apiUrl = `${PAGESPEED_API}?${params.toString()}`;
  
  // Log for debugging
  console.log('[PerfLens] API Request:', apiUrl.replace(apiKey, '***'));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout

  let response: Response;
  try {
    response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after 90 seconds. Try again or try a different URL.');
    }
    throw new Error(`Network error: ${err.message}`);
  }

  // Handle HTTP errors
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const errMsg = errBody?.error?.message || '';
    
    if (response.status === 400) {
      if (errMsg.includes('API key')) throw new Error('Invalid API key. Check your key in Settings (⚙).');
      throw new Error(errMsg || 'Bad request. Check the URL format.');
    }
    if (response.status === 403) {
      throw new Error('API access denied. Make sure PageSpeed Insights API is enabled in Google Cloud Console.');
    }
    if (response.status === 429) {
      throw new Error('API quota exceeded. Wait until tomorrow or use a different API key.');
    }
    if (response.status >= 500) {
      throw new Error('Google API server error. Please try again in a few minutes.');
    }
    throw new Error(errMsg || `API error (${response.status})`);
  }

  // Parse response
  const data = await response.json();
  lastRawResponse = data; // Store for debugging

  const lhr = data.lighthouseResult;
  if (!lhr) {
    throw new Error('No Lighthouse result returned. The URL may not be accessible.');
  }

  // Check for runtime errors in Lighthouse
  if (lhr.runtimeError?.code && lhr.runtimeError.code !== 'NO_ERROR') {
    const code = lhr.runtimeError.code;
    const msg = lhr.runtimeError.message || '';
    
    if (code === 'FAILED_DOCUMENT_REQUEST' || code === 'ERRORED_DOCUMENT_REQUEST') {
      throw new Error(`Cannot load "${shortenUrl(url)}". The site may be blocking automated testing or require authentication.`);
    }
    if (code === 'DNS_FAILURE') {
      throw new Error(`DNS lookup failed for "${shortenUrl(url)}". Check the URL.`);
    }
    if (code === 'NO_FCP') {
      throw new Error(`"${shortenUrl(url)}" didn't render any content. The page may be blank or block bots.`);
    }
    throw new Error(`Lighthouse error: ${msg || code}`);
  }

  // Verify we have performance data
  const perfCategory = lhr.categories?.performance;
  if (!perfCategory || perfCategory.score === null || perfCategory.score === undefined) {
    throw new Error('No performance score returned. The page may have failed to load properly.');
  }

  // SCORE: Google returns 0-1, multiply by 100 and round
  // This is EXACTLY what pagespeed.web.dev does
  const rawScore = perfCategory.score;
  const score = Math.round(rawScore * 100);

  console.log('[PerfLens] Score:', { raw: rawScore, calculated: score });

  // Extract metrics
  const audits = lhr.audits || {};
  const getMetric = (id: string) => {
    const a = audits[id];
    return {
      value: a?.displayValue || 'N/A',
      numericValue: a?.numericValue ?? 0,
      score: a?.score ?? 0,
    };
  };

  const metrics = {
    lcp: getMetric('largest-contentful-paint'),
    fcp: getMetric('first-contentful-paint'),
    cls: getMetric('cumulative-layout-shift'),
    tbt: getMetric('total-blocking-time'),
    si: getMetric('speed-index'),
    tti: getMetric('interactive'),
  };

  // Extract opportunities
  const perfRefs = perfCategory.auditRefs || [];
  const opportunities = perfRefs
    .filter((r: any) => r.group === 'load-opportunities')
    .map((r: any) => audits[r.id])
    .filter((a: any) => a && a.score !== null && a.score < 1)
    .sort((a: any, b: any) => (a.score || 0) - (b.score || 0))
    .slice(0, 8)
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description || '',
      displayValue: a.displayValue || '',
      score: a.score,
      savings: a.numericValue || 0,
    }));

  const diagnostics = perfRefs
    .filter((r: any) => r.group === 'diagnostics')
    .map((r: any) => audits[r.id])
    .filter((a: any) => a && a.score !== null && a.score < 1)
    .slice(0, 6)
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      displayValue: a.displayValue || '',
      score: a.score,
    }));

  // Field data (CrUX)
  const fieldData = extractFieldData(data.loadingExperience);

  return {
    score,
    metrics,
    opportunities,
    diagnostics,
    fieldData,
    hasFieldData: fieldData !== null && fieldData.overallCategory !== null,
    url,
    finalUrl: lhr.finalUrl || url,
    strategy,
    analyzedAt: new Date().toISOString(),
    lighthouseVersion: lhr.lighthouseVersion || '',
    fetchTime: lhr.fetchTime || '',
  };
}


// ─────────────────────────────────────────────
// AI Recommendations
// ─────────────────────────────────────────────

export async function getRecommendations(data: AnalysisResult): Promise<Recommendation[]> {
  const key = getStoredGeminiKey();
  if (key) {
    try {
      return await callGemini(data, key);
    } catch (e) {
      console.warn('Gemini failed, using local:', e);
    }
  }
  return localRecommendations(data);
}

async function callGemini(data: AnalysisResult, apiKey: string): Promise<Recommendation[]> {
  const prompt = `Analyze this Lighthouse performance report and provide exactly 5 specific recommendations.

URL: ${data.url}
Score: ${data.score}/100 (${data.strategy})

Metrics:
- LCP: ${data.metrics.lcp.value}
- FCP: ${data.metrics.fcp.value}  
- CLS: ${data.metrics.cls.value}
- TBT: ${data.metrics.tbt.value}
- Speed Index: ${data.metrics.si.value}
- TTI: ${data.metrics.tti.value}

Issues: ${data.opportunities.slice(0, 5).map(o => o.title).join(', ')}

Return ONLY a JSON array with exactly 5 objects. Each must have: title, problem, fix, impact, priority (High/Medium/Low).`;

  const resp = await fetch(`${GEMINI_API}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    }),
  });

  if (!resp.ok) throw new Error('Gemini API error');

  const result = await resp.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const json = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const arr = JSON.parse(json);

  if (!Array.isArray(arr)) throw new Error('Invalid format');

  return arr.slice(0, 5).map((r: any) => ({
    title: r.title || '',
    problem: r.problem || '',
    fix: r.fix || '',
    impact: r.impact || '',
    priority: ['High', 'Medium', 'Low'].includes(r.priority) ? r.priority : 'Medium',
  }));
}

function localRecommendations(data: AnalysisResult): Recommendation[] {
  const recs: Recommendation[] = [];
  const m = data.metrics;

  if (m.lcp.numericValue > 2500) {
    recs.push({
      title: 'Improve Largest Contentful Paint',
      problem: `LCP is ${m.lcp.value}, above the 2.5s threshold.`,
      fix: 'Preload the LCP element (usually hero image). Use modern formats (WebP/AVIF). Implement a CDN.',
      impact: 'Could reduce LCP by 30-50%',
      priority: m.lcp.numericValue > 4000 ? 'High' : 'Medium',
    });
  }

  if (m.tbt.numericValue > 200) {
    recs.push({
      title: 'Reduce Total Blocking Time',
      problem: `TBT is ${m.tbt.value}, blocking interactivity.`,
      fix: 'Break up long JavaScript tasks. Code-split bundles. Defer non-critical scripts.',
      impact: 'Target under 200ms for good TBT',
      priority: m.tbt.numericValue > 600 ? 'High' : 'Medium',
    });
  }

  if (m.cls.numericValue > 0.1) {
    recs.push({
      title: 'Fix Layout Shifts',
      problem: `CLS is ${m.cls.value}, causing visual instability.`,
      fix: 'Set explicit dimensions on images/videos. Reserve space for dynamic content.',
      impact: 'Target CLS under 0.1',
      priority: m.cls.numericValue > 0.25 ? 'High' : 'Medium',
    });
  }

  if (m.fcp.numericValue > 1800) {
    recs.push({
      title: 'Speed Up First Paint',
      problem: `FCP is ${m.fcp.value}, users see blank screen too long.`,
      fix: 'Inline critical CSS. Eliminate render-blocking resources. Optimize server response time.',
      impact: 'Target FCP under 1.8s',
      priority: m.fcp.numericValue > 3000 ? 'High' : 'Medium',
    });
  }

  if (m.si.numericValue > 3400) {
    recs.push({
      title: 'Improve Speed Index',
      problem: `Speed Index is ${m.si.value}, visual progress is slow.`,
      fix: 'Prioritize visible content. Lazy-load below-fold images. Enable compression.',
      impact: 'Target Speed Index under 3.4s',
      priority: 'Medium',
    });
  }

  if (m.tti.numericValue > 3800) {
    recs.push({
      title: 'Reduce Time to Interactive',
      problem: `TTI is ${m.tti.value}, page takes too long to become usable.`,
      fix: 'Minimize JavaScript. Remove unused code. Defer third-party scripts.',
      impact: 'Target TTI under 3.8s',
      priority: m.tti.numericValue > 7300 ? 'High' : 'Medium',
    });
  }

  // Add from opportunities if we need more
  for (const opp of data.opportunities) {
    if (recs.length >= 5) break;
    recs.push({
      title: opp.title,
      problem: opp.displayValue || 'Identified by Lighthouse',
      fix: opp.description || 'Follow Lighthouse recommendations',
      impact: opp.displayValue || 'Improved performance',
      priority: opp.score < 0.5 ? 'High' : 'Medium',
    });
  }

  // Default for fast sites
  if (recs.length === 0) {
    recs.push({
      title: 'Great Performance!',
      problem: `Score of ${data.score} is excellent.`,
      fix: 'Monitor for regressions. Consider setting up performance budgets.',
      impact: 'Maintain current performance',
      priority: 'Low',
    });
  }

  return recs.slice(0, 5);
}
