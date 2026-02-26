#!/usr/bin/env node
/**
 * MemberBook Analytics Report Generator
 * Authenticates with Google OAuth2, fetches GA4 + Search Console data,
 * and writes a Markdown report to reports/analytics-report-YYYY-MM-DD.md
 */

import http from 'http';
import { exec } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').replace(/\r/g, '').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}
const env = loadEnv();

// ── Config ────────────────────────────────────────────────────────────────────
const CLIENT_ID     = env.NUXT_OAUTH_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET;
const REDIRECT_PORT = 8787;
const REDIRECT_URI  = `http://localhost:${REDIRECT_PORT}/oauth2callback`;
const TOKEN_FILE    = join(ROOT, '.analytics-token.json');
const GA4_PROPERTY  = env.GA4_PROPERTY_ID || '524789436';
const SC_SITE       = env.SEARCH_CONSOLE_SITE_URL || 'https://memberbook.in/';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing NUXT_OAUTH_GOOGLE_CLIENT_ID or NUXT_OAUTH_GOOGLE_CLIENT_SECRET in .env');
  process.exit(1);
}

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
].join(' ');

// ── Token helpers ─────────────────────────────────────────────────────────────

async function exchangeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Token exchange failed: ${data.error} - ${data.error_description}`);
  return data;
}

async function refreshToken(refresh_token) {
  const body = new URLSearchParams({
    refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Token refresh failed: ${data.error}`);
  return data;
}

function saveToken(tokenData) {
  writeFileSync(TOKEN_FILE, JSON.stringify({
    ...tokenData,
    saved_at: Date.now(),
  }, null, 2));
}

async function getAccessToken() {
  // Try to use a saved token
  if (existsSync(TOKEN_FILE)) {
    const saved = JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
    const age = (Date.now() - saved.saved_at) / 1000;

    if (age < (saved.expires_in || 3600) - 60) {
      console.log('✓ Using cached access token');
      return saved.access_token;
    }

    if (saved.refresh_token) {
      console.log('↺ Refreshing access token...');
      try {
        const refreshed = await refreshToken(saved.refresh_token);
        saveToken({ ...saved, ...refreshed, saved_at: Date.now() });
        console.log('✓ Token refreshed');
        return refreshed.access_token;
      } catch (e) {
        console.log('Token refresh failed, re-authenticating:', e.message);
      }
    }
  }

  // Full OAuth flow
  return await runOAuthFlow();
}

function runOAuthFlow() {
  return new Promise((resolve, reject) => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',
      });

    let server;

    server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith('/oauth2callback')) return;

      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400);
        res.end(`<h1>Authorization failed: ${error}</h1><p>You can close this tab.</p>`);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="font-family:sans-serif;text-align:center;padding:50px">
        <h2>✅ Authorized!</h2>
        <p>You can close this tab and return to the terminal.</p>
        </body></html>
      `);
      server.close();

      try {
        console.log('✓ Got authorization code, exchanging for tokens...');
        const tokens = await exchangeCode(code);
        saveToken(tokens);
        console.log('✓ Tokens saved');
        resolve(tokens.access_token);
      } catch (e) {
        reject(e);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log('\n🔐 Opening browser for Google authorization...');
      console.log('   If the browser does not open, visit this URL manually:');
      console.log(`   ${authUrl}\n`);

      // Open browser (Windows)
      exec(`start "" "${authUrl}"`, (err) => {
        if (err) {
          // Try other platforms
          exec(`xdg-open "${authUrl}"`, () => {});
        }
      });
    });

    server.on('error', reject);

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Auth timeout — no response within 2 minutes'));
    }, 120_000);
  });
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function ga4Report(token, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`GA4 error: ${JSON.stringify(data.error)}`);
  return data;
}

async function scQuery(token, body) {
  const encoded = encodeURIComponent(SC_SITE);
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (data.error) {
    const msg = data.error?.message ?? JSON.stringify(data.error);
    throw new Error(`Search Console: ${msg}`);
  }
  return data;
}

async function scQuerySafe(token, body) {
  try { return await scQuery(token, body); }
  catch (e) { return { _error: e.message, rows: [] }; }
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function parseGA4Overview(report) {
  const metricHeaders = report.metricHeaders.map(h => h.name);
  const rows = {};
  for (const dr of (report.rows || [])) {
    const rangeName = dr.dimensionValues?.[0]?.value ?? 'unknown';
    const vals = {};
    dr.metricValues.forEach((v, i) => { vals[metricHeaders[i]] = parseFloat(v.value); });
    rows[rangeName] = vals;
  }
  return rows;
}

function parseGA4DimMetric(report) {
  const metricHeaders = report.metricHeaders.map(h => h.name);
  return (report.rows || []).map(row => {
    const obj = { dim: row.dimensionValues[0].value };
    row.metricValues.forEach((v, i) => { obj[metricHeaders[i]] = parseFloat(v.value); });
    return obj;
  });
}

function pct(val, prev) {
  if (!prev || prev === 0) return 'N/A';
  const p = ((val - prev) / prev) * 100;
  return (p >= 0 ? '+' : '') + p.toFixed(1) + '%';
}

function fmtDur(seconds) {
  if (!seconds || isNaN(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function fmtNum(n) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return Math.round(n).toLocaleString('en-IN');
}

function fmtPct(n) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return (n * 100).toFixed(1) + '%';
}

// ── Report generator ──────────────────────────────────────────────────────────

async function generateReport() {
  console.log('🚀 MemberBook Analytics Report Generator\n');

  const token = await getAccessToken();
  console.log('\n📊 Fetching data from Google APIs...\n');

  // ── GA4 Fetches ──────────────────────────────────────────────────────────

  const [
    ga4Overview,
    ga4OverviewPrev,
    ga4Sources,
    ga4Pages,
    ga4Devices,
    ga4Countries,
    ga4Daily,
    scOverview,
    scQueries,
    scPages,
    scDevices,
  ] = await Promise.all([
    // GA4: Overview current period (last 28 days)
    ga4Report(token, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViews' },
      ],
    }),

    // GA4: Overview previous period (29-56 days ago)
    ga4Report(token, {
      dateRanges: [{ startDate: '56daysAgo', endDate: '29daysAgo' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViews' },
      ],
    }),

    // GA4: Traffic sources
    ga4Report(token, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),

    // GA4: Top pages
    ga4Report(token, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'bounceRate' }],
      dimensions: [{ name: 'pagePath' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),

    // GA4: Device breakdown
    ga4Report(token, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }],
      dimensions: [{ name: 'deviceCategory' }],
    }),

    // GA4: Countries
    ga4Report(token, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'country' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),

    // GA4: Daily sessions for trend
    ga4Report(token, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),

    // Search Console: Overview (last 28d vs prev 28d)
    scQuerySafe(token, {
      startDate: nDaysAgo(28),
      endDate:   today(),
      dimensions: [],
    }),

    // Search Console: Top queries
    scQuerySafe(token, {
      startDate:  nDaysAgo(28),
      endDate:    today(),
      dimensions: ['query'],
      rowLimit:   25,
      orderBy:    [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    }),

    // Search Console: Top pages
    scQuerySafe(token, {
      startDate:  nDaysAgo(28),
      endDate:    today(),
      dimensions: ['page'],
      rowLimit:   10,
      orderBy:    [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
    }),

    // Search Console: Device breakdown
    scQuerySafe(token, {
      startDate:  nDaysAgo(28),
      endDate:    today(),
      dimensions: ['device'],
    }),
  ]);

  console.log('✓ All data fetched\n');

  // ── Parse data ────────────────────────────────────────────────────────────

  function extractTotals(report) {
    const headers = (report.metricHeaders ?? []).map(h => h.name);
    const row = report.rows?.[0];
    if (!row) return {};
    const obj = {};
    row.metricValues.forEach((v, i) => { obj[headers[i]] = parseFloat(v.value); });
    return obj;
  }

  const cur = extractTotals(ga4Overview);
  const prv = extractTotals(ga4OverviewPrev);

  const sources  = parseGA4DimMetric(ga4Sources);
  const pages    = parseGA4DimMetric(ga4Pages);
  const devices  = parseGA4DimMetric(ga4Devices);
  const countries = parseGA4DimMetric(ga4Countries);
  const daily    = parseGA4DimMetric(ga4Daily);

  // Last 7 days vs prev 7 days from daily data
  const last7  = daily.slice(-7).reduce((s, d) => s + (d.sessions || 0), 0);
  const prev7  = daily.slice(-14, -7).reduce((s, d) => s + (d.sessions || 0), 0);

  // SC data
  const scError = scOverview?._error ?? null;
  if (scError) console.warn(`⚠️  Search Console unavailable: ${scError}`);

  const scCur = scOverview?.rows?.[0] ?? {};
  const scQRows = scQueries?.rows ?? [];
  const scPRows = scPages?.rows ?? [];
  const scDRows = scDevices?.rows ?? [];

  // Opportunities: queries ranked 5-20 with >30 impressions
  const opportunities = scQRows.filter(r =>
    r.position >= 4 && r.position <= 20 && r.impressions >= 30
  ).slice(0, 8);

  // ── Build report ──────────────────────────────────────────────────────────

  const reportDate  = today();
  const periodStart = nDaysAgo(28);

  const bounceStatus =
    cur.bounceRate < 0.40 ? '🟢 Excellent' :
    cur.bounceRate < 0.60 ? '🟡 Normal' : '🔴 High';

  const avgCTR = scCur.ctr ?? 0;
  const ctrStatus =
    avgCTR >= 0.05 ? '🟢 Good' :
    avgCTR >= 0.02 ? '🟡 Average' : '🔴 Low';

  // Executive summary bullets
  const summaryBullets = [];
  const sessionTrend = pct(cur.sessions, prv.sessions);
  if (sessionTrend !== 'N/A') {
    const dir = cur.sessions >= prv.sessions ? 'up' : 'down';
    summaryBullets.push(`Sessions are **${sessionTrend}** period-over-period (${fmtNum(cur.sessions)} vs ${fmtNum(prv.sessions)}).`);
  }
  if (scCur.clicks) summaryBullets.push(`Search Console shows **${fmtNum(scCur.clicks)} clicks** from **${fmtNum(scCur.impressions)} impressions** in the last 28 days.`);
  if (scCur.position) summaryBullets.push(`Average search position is **${scCur.position?.toFixed(1)}** — ${scCur.position < 20 ? 'appearing on the first two pages' : 'room for improvement'}.`);
  if (opportunities.length > 0) summaryBullets.push(`**${opportunities.length} keyword opportunities** found ranking between positions 5-20 with decent impressions.`);

  // Top traffic source
  const topSource = sources[0];
  if (topSource) summaryBullets.push(`Top traffic source: **${topSource.dim}** (${fmtNum(topSource.sessions)} sessions).`);

  const md = `# MemberBook Analytics Report
**Period:** ${periodStart} → ${reportDate} (last 28 days)
**Generated:** ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC

---

## Executive Summary

${summaryBullets.map(b => `- ${b}`).join('\n')}

---

## Google Analytics 4

### Overview

| Metric | Last 28 Days | Prev 28 Days | Change |
|--------|-------------|-------------|--------|
| Sessions | ${fmtNum(cur.sessions)} | ${fmtNum(prv.sessions)} | ${pct(cur.sessions, prv.sessions)} |
| Active Users | ${fmtNum(cur.activeUsers)} | ${fmtNum(prv.activeUsers)} | ${pct(cur.activeUsers, prv.activeUsers)} |
| New Users | ${fmtNum(cur.newUsers)} | ${fmtNum(prv.newUsers)} | ${pct(cur.newUsers, prv.newUsers)} |
| Page Views | ${fmtNum(cur.screenPageViews)} | ${fmtNum(prv.screenPageViews)} | ${pct(cur.screenPageViews, prv.screenPageViews)} |
| Bounce Rate | ${fmtPct(cur.bounceRate)} | ${fmtPct(prv.bounceRate)} | ${bounceStatus} |
| Avg. Session Duration | ${fmtDur(cur.averageSessionDuration)} | ${fmtDur(prv.averageSessionDuration)} | — |

> **Week-over-week:** Last 7 days had **${fmtNum(last7)} sessions** vs ${fmtNum(prev7)} the prior 7 days (${pct(last7, prev7)}).

### Traffic Sources

| Channel | Sessions | Users |
|---------|----------|-------|
${sources.map(s => `| ${s.dim} | ${fmtNum(s.sessions)} | ${fmtNum(s.activeUsers)} |`).join('\n')}

### Top Pages

| Page | Views | Users | Bounce Rate |
|------|-------|-------|-------------|
${pages.map(p => `| \`${p.dim}\` | ${fmtNum(p.screenPageViews)} | ${fmtNum(p.activeUsers)} | ${fmtPct(p.bounceRate)} |`).join('\n')}

### Device Breakdown

| Device | Sessions | Share |
|--------|----------|-------|
${(() => {
  const total = devices.reduce((s, d) => s + d.sessions, 0);
  return devices.map(d => `| ${d.dim} | ${fmtNum(d.sessions)} | ${((d.sessions / total) * 100).toFixed(1)}% |`).join('\n');
})()}

### Top Countries

| Country | Sessions | Users |
|---------|----------|-------|
${countries.map(c => `| ${c.dim} | ${fmtNum(c.sessions)} | ${fmtNum(c.activeUsers)} |`).join('\n')}

---

## Google Search Console

${scError
  ? `> ⚠️ **Search Console data unavailable.** The authenticated account does not have access to \`${SC_SITE}\`.\n>\n> **Fix:** In [Search Console](https://search.google.com/search-console) → Settings → Users and Permissions → add \`1291pravin@gmail.com\` as a Full User, then re-run this report.`
  : `### Overview (Last 28 Days)

| Metric | Value | Status |
|--------|-------|--------|
| Total Clicks | ${fmtNum(scCur.clicks ?? 0)} | — |
| Total Impressions | ${fmtNum(scCur.impressions ?? 0)} | — |
| Average CTR | ${fmtPct(scCur.ctr ?? 0)} | ${ctrStatus} |
| Average Position | ${(scCur.position ?? 0).toFixed(1)} | — |

### Top Queries by Clicks

| Query | Clicks | Impressions | CTR | Position |
|-------|--------|-------------|-----|----------|
${scQRows.map(r => `| ${r.keys?.[0] ?? '—'} | ${fmtNum(r.clicks)} | ${fmtNum(r.impressions)} | ${fmtPct(r.ctr)} | ${r.position.toFixed(1)} |`).join('\n')}

### Top Pages by Clicks

| Page | Clicks | Impressions | CTR | Position |
|------|--------|-------------|-----|----------|
${scPRows.map(r => `| \`${(r.keys?.[0] ?? '').replace(/^https:\/\/memberbook\.in/, '')}\` | ${fmtNum(r.clicks)} | ${fmtNum(r.impressions)} | ${fmtPct(r.ctr)} | ${r.position.toFixed(1)} |`).join('\n')}

### Device Performance (Search)

| Device | Clicks | Impressions | CTR | Avg. Position |
|--------|--------|-------------|-----|---------------|
${scDRows.map(r => `| ${r.keys?.[0] ?? '—'} | ${fmtNum(r.clicks)} | ${fmtNum(r.impressions)} | ${fmtPct(r.ctr)} | ${r.position.toFixed(1)} |`).join('\n')}

${opportunities.length > 0 ? `### Keyword Opportunities (Positions 5–20)

These queries have impressions but rank below the top 4 — good candidates for content improvement or internal linking.

| Query | Clicks | Impressions | CTR | Position |
|-------|--------|-------------|-----|----------|
${opportunities.map(r => `| ${r.keys?.[0] ?? '—'} | ${fmtNum(r.clicks)} | ${fmtNum(r.impressions)} | ${fmtPct(r.ctr)} | ${r.position.toFixed(1)} |`).join('\n')}` : ''}`}

---

## Recommendations

### Quick Wins
${scQRows.length > 0 ? `1. **Improve CTR for high-impression queries** — Optimize meta titles and descriptions for queries with >100 impressions but low CTR.` : ''}
${cur.bounceRate > 0.60 ? `1. **Reduce bounce rate (currently ${fmtPct(cur.bounceRate)})** — Review landing pages for mobile UX issues and page load speed.` : ''}
${opportunities.length > 0 ? `1. **Target quick wins** — Focus content efforts on these keywords near page 1: ${opportunities.slice(0, 3).map(r => `_${r.keys?.[0]}_`).join(', ')}.` : ''}
${last7 > prev7 ? `1. **Momentum is positive** — Sessions trended up WoW. Double down on whatever drove traffic this week.` : `1. **Session dip this week** — Investigate traffic drop vs prior week (${fmtNum(last7)} vs ${fmtNum(prev7)}).`}

### SEO Opportunities
${opportunities.slice(0, 5).map((r, i) => `${i + 1}. Improve content for **"${r.keys?.[0]}"** (position ${r.position.toFixed(1)}, ${fmtNum(r.impressions)} impressions).`).join('\n') || '- No immediate opportunities identified with current data.'}

---
*Report generated by MemberBook analytics-reporter agent*
*Data source: GA4 Property ${GA4_PROPERTY} · Search Console ${SC_SITE}*
`;

  // ── Save report ───────────────────────────────────────────────────────────

  const reportsDir = join(ROOT, 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir);

  const filename = `analytics-report-${reportDate}.md`;
  const filepath = join(reportsDir, filename);
  writeFileSync(filepath, md);

  console.log(`\n✅ Report saved to reports/${filename}\n`);
  console.log('─'.repeat(60));
  console.log(md.slice(0, 3000));
  if (md.length > 3000) console.log('\n... (see full report in the file)');
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ── Run ───────────────────────────────────────────────────────────────────────

generateReport().catch(err => {
  console.error('\n❌ Error:', err.stack || err.message);
  process.exit(1);
});
