import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from dist/ in production
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// URL validation helper
function normalizeUrl(input) {
  let url = (input || '').trim();
  if (!url) return { error: 'Please enter a valid URL' };

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Block private IPs and localhost
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return { error: 'Private URLs cannot be analyzed' };
    }

    return { url: parsed.href };
  } catch {
    return { error: 'Please enter a valid URL' };
  }
}

// POST /api/analyze
app.post('/api/analyze', async (req, res) => {
  try {
    const { url, strategy = 'mobile' } = req.body;

    const normalized = normalizeUrl(url);
    if (normalized.error) {
      return res.status(400).json({ error: normalized.error });
    }

    const normalizedUrl = normalized.url;
    const apiKey = process.env.PAGESPEED_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(normalizedUrl)}&strategy=${strategy}&category=performance&key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    let response;
    try {
      response = await fetch(apiUrl, { signal: controller.signal });
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        return res.status(504).json({ error: 'Analysis timed out. The URL may be slow or unreachable.' });
      }
      return res.status(504).json({ error: 'Network error. Please try again.' });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      let errorMsg = 'Could not analyze this URL. Make sure it is publicly accessible.';
      try {
        const errBody = await response.json();
        const apiError = errBody?.error?.message;
        if (apiError) {
          if (apiError.includes('FAILED_DOCUMENT_REQUEST') || apiError.includes('DNS_FAILURE')) {
            errorMsg = 'Could not reach this website. Make sure the URL is correct and the site is online.';
          } else if (apiError.includes('ERRORED_DOCUMENT_REQUEST')) {
            errorMsg = 'The website returned an error. It may be down or blocking automated requests.';
          } else if (apiError.includes('NOT_HTML')) {
            errorMsg = 'The URL does not point to an HTML page.';
          }
        }
      } catch {}
      return res.status(502).json({ error: errorMsg });
    }

    const data = await response.json();
    const lhr = data.lighthouseResult;

    if (!lhr) {
      return res.status(502).json({ error: 'No Lighthouse data returned. Please try again.' });
    }

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

    const score = Math.round((perfCategory.score ?? 0) * 100);

    const metrics = {
      lcp: safeAudit('largest-contentful-paint'),
      fcp: safeAudit('first-contentful-paint'),
      cls: safeAudit('cumulative-layout-shift'),
      tbt: safeAudit('total-blocking-time'),
      si: safeAudit('speed-index'),
      tti: safeAudit('interactive'),
    };

    const perfRefs = perfCategory.auditRefs || [];

    const opportunities = perfRefs
      .filter((ref) => ref.group === 'load-opportunities')
      .map((ref) => audits[ref.id])
      .filter((audit) => audit && audit.score !== null && audit.score < 1 && audit.details)
      .slice(0, 6)
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description || '',
        displayValue: audit.displayValue || '',
        score: audit.score,
      }));

    const diagnostics = perfRefs
      .filter((ref) => ref.group === 'diagnostics')
      .map((ref) => audits[ref.id])
      .filter((audit) => audit && audit.score !== null && audit.score < 1)
      .slice(0, 4)
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        displayValue: audit.displayValue || '',
        score: audit.score,
      }));

    res.json({
      score,
      metrics,
      opportunities,
      diagnostics,
      url: normalizedUrl,
      strategy,
      analyzedAt: new Date().toISOString(),
      pageTitle: lhr.finalUrl || normalizedUrl,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { analysisData } = req.body;

    if (!analysisData) {
      return res.status(400).json({ error: 'Analysis data is required' });
    }

    const geminiKey = process.env.GEMINI_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const oppList = (analysisData.opportunities || [])
      .map((o) => `- ${o.title}: ${o.displayValue}`)
      .join('\n') || 'None identified';

    const prompt = `You are a senior web performance engineer. A website has been analyzed with Google Lighthouse.

Website: ${analysisData.url}
Overall Performance Score: ${analysisData.score}/100
Strategy: ${analysisData.strategy}

Metrics:
- LCP (Largest Contentful Paint): ${analysisData.metrics.lcp.value}
- FCP (First Contentful Paint): ${analysisData.metrics.fcp.value}
- CLS (Cumulative Layout Shift): ${analysisData.metrics.cls.value}
- TBT (Total Blocking Time): ${analysisData.metrics.tbt.value}
- Speed Index: ${analysisData.metrics.si.value}
- TTI (Time to Interactive): ${analysisData.metrics.tti.value}

Top Issues Found:
${oppList}

Give exactly 5 specific, actionable recommendations to improve this website's performance.
Base your recommendations on the actual metric values and issues above — not generic advice.

Return ONLY a valid JSON array. No markdown. No backticks. No explanation. No extra text. Just the raw JSON array.

Each object in the array must have exactly these fields:
{
  "title": "short action-oriented title",
  "problem": "one sentence explaining what the data shows is wrong",
  "fix": "2-3 sentences with the exact technical fix",
  "impact": "which metric this will improve and by roughly how much",
  "priority": "High" or "Medium" or "Low"
}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
          }),
          signal: controller.signal,
        }
      );
    } catch {
      clearTimeout(timeout);
      return res.status(500).json({ error: 'AI analysis timed out. Please try again.' });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean markdown wrappers
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Extract JSON array
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      text = arrayMatch[0];
    }

    let recommendations;
    try {
      recommendations = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
    }

    res.json({ recommendations });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PerfLens server running on http://localhost:${PORT}`);
});
