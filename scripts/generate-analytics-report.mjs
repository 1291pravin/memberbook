#!/usr/bin/env node
/**
 * MemberBook Analytics Report Generator
 * Authenticates with Google OAuth2, fetches GA4 + Search Console data,
 * and writes a Markdown report to reports/analytics-report-YYYY-MM-DD.md
 */

import http from 'http';
import os from 'os';
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

// Cloudflare Analytics and D1 reporting.
// Prefer an explicit API token for automation; fall back to Wrangler OAuth for local runs.
const CF_ACCOUNT_ID  = env.CLOUDFLARE_ACCOUNT_ID;
const CF_WORKER_NAME = env.CLOUDFLARE_WORKER_NAME || 'memberbook';
const CF_API_TOKEN   = env.CLOUDFLARE_API_TOKEN || env.CF_API_TOKEN;

function getWranglerD1DatabaseId() {
  const wranglerPath = join(ROOT, 'wrangler.jsonc');
  if (!existsSync(wranglerPath)) return null;
  const content = readFileSync(wranglerPath, 'utf8');
  return content.match(/"database_id"\s*:\s*"([^"]+)"/)?.[1] ?? null;
}

const CF_D1_DATABASE_ID = env.CLOUDFLARE_D1_DATABASE_ID || env.D1_DATABASE_ID || getWranglerD1DatabaseId();
const TEST_ORG_NAME_PATTERN = new RegExp(env.ANALYTICS_TEST_ORG_PATTERN || '\\b(test|demo|sample)\\b', 'i');

function getWranglerOAuthToken() {
  // Wrangler stores OAuth tokens in its config dir
  const candidates = [
    join(process.env.APPDATA || '', 'xdg.config', '.wrangler', 'config', 'default.toml'),
    join(os.homedir(), '.wrangler', 'config', 'default.toml'),
    join(process.env.XDG_CONFIG_HOME || '', '.wrangler', 'config', 'default.toml'),
  ];
  for (const p of candidates) {
    if (!p || !existsSync(p)) continue;
    const content = readFileSync(p, 'utf8');
    const tokenMatch = content.match(/^oauth_token\s*=\s*"(.+)"/m);
    const expiryMatch = content.match(/^expiration_time\s*=\s*"(.+)"/m);
    if (tokenMatch) {
      if (expiryMatch && new Date(expiryMatch[1]) < new Date()) {
        console.warn('⚠️  Wrangler OAuth token expired. Run: npx wrangler login (from outside project dir)');
        return null;
      }
      return tokenMatch[1];
    }
  }
  return null;
}

const CF_OAUTH_TOKEN = CF_API_TOKEN || getWranglerOAuthToken();
const CF_ENABLED     = !!(CF_OAUTH_TOKEN && CF_ACCOUNT_ID);
const CF_D1_ENABLED  = !!(CF_OAUTH_TOKEN && CF_ACCOUNT_ID && CF_D1_DATABASE_ID);

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

// ── Cloudflare Workers Analytics ─────────────────────────────────────────────

async function cfGraphQL(query, variables = {}) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_OAUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (data.errors?.length) {
    throw new Error(`Cloudflare GraphQL: ${data.errors.map(e => e.message).join('; ')}`);
  }
  return data.data;
}

async function cfGraphQLSafe(query, variables = {}) {
  try { return await cfGraphQL(query, variables); }
  catch (e) { return { _error: e.message }; }
}

async function cfRequest(path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_OAUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) {
    const message = data.errors?.map(e => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(`Cloudflare API: ${message}`);
  }
  return data.result;
}

async function cfD1Query(sql) {
  return cfRequest(`/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`, { sql });
}

async function cfD1QuerySafe(sql) {
  try { return await cfD1Query(sql); }
  catch (e) { return { _error: e.message }; }
}

// ── Data helpers ──────────────────────────────────────────────────────────────

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

  // ISO 8601 date helpers for Cloudflare API
  const cfDateStart = nDaysAgo(28) + 'T00:00:00Z';
  const cfDateEnd   = today() + 'T23:59:59Z';

  const [
    ga4Overview,
    ga4OverviewPrev,
    ga4Sources,
    ga4Pages,
    ga4Devices,
    ga4Countries,
    ga4Daily,
    ga4FunnelEvents,
    scOverview,
    scQueries,
    scPages,
    scDevices,
    cfOverview,
    cfDaily,
    d1CustomerData,
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

    // GA4: Funnel event counts
    ga4Report(token, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [
              'primary_cta_click',
              'register_page_view',
              'registration_submit',
              'registration_success',
              'organization_created',
              'onboarding_completed',
              'contact_submit',
              'contact_submission_success',
            ],
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
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

    // Cloudflare Workers: Overview (last 28 days)
    CF_ENABLED
      ? cfGraphQLSafe(`query ($accountTag: String!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject!) {
          viewer {
            accounts(filter: {accountTag: $accountTag}) {
              workersInvocationsAdaptive(limit: 1, filter: $filter) {
                sum { requests errors subrequests }
                quantiles { cpuTimeP50 cpuTimeP75 cpuTimeP99 }
              }
            }
          }
        }`, {
          accountTag: CF_ACCOUNT_ID,
          filter: {
            scriptName: CF_WORKER_NAME,
            datetime_geq: cfDateStart,
            datetime_leq: cfDateEnd,
          },
        })
      : Promise.resolve(null),

    // Cloudflare Workers: Daily trend
    CF_ENABLED
      ? cfGraphQLSafe(`query ($accountTag: String!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject!) {
          viewer {
            accounts(filter: {accountTag: $accountTag}) {
              workersInvocationsAdaptive(limit: 100, filter: $filter, orderBy: [date_ASC]) {
                dimensions { date }
                sum { requests errors subrequests }
                quantiles { cpuTimeP50 cpuTimeP99 }
              }
            }
          }
        }`, {
          accountTag: CF_ACCOUNT_ID,
          filter: {
            scriptName: CF_WORKER_NAME,
            datetime_geq: cfDateStart,
            datetime_leq: cfDateEnd,
          },
        })
      : Promise.resolve(null),

    // D1: Customer and product-activity reporting
    CF_D1_ENABLED
      ? cfD1QuerySafe(`
          SELECT
            (SELECT COUNT(*) FROM users) AS users_total,
            (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now','-28 days')) AS users_last_28d,
            (SELECT COUNT(*) FROM users WHERE created_at >= datetime('now','-56 days') AND created_at < datetime('now','-28 days')) AS users_prev_28d,
            (SELECT COUNT(*) FROM organizations) AS orgs_total,
            (SELECT COUNT(*) FROM organizations WHERE created_at >= datetime('now','-28 days')) AS orgs_last_28d,
            (SELECT COUNT(*) FROM organizations WHERE created_at >= datetime('now','-56 days') AND created_at < datetime('now','-28 days')) AS orgs_prev_28d,
            (SELECT COUNT(*) FROM organizations WHERE demo_data_ids IS NULL AND lower(name) NOT LIKE '%test%' AND lower(name) NOT LIKE '%demo%' AND lower(name) NOT LIKE '%sample%') AS real_orgs_total,
            (SELECT COUNT(*) FROM organizations WHERE demo_data_ids IS NULL AND lower(name) NOT LIKE '%test%' AND lower(name) NOT LIKE '%demo%' AND lower(name) NOT LIKE '%sample%' AND created_at >= datetime('now','-28 days')) AS real_orgs_last_28d,
            (SELECT COUNT(*) FROM organizations WHERE demo_data_ids IS NULL AND lower(name) NOT LIKE '%test%' AND lower(name) NOT LIKE '%demo%' AND lower(name) NOT LIKE '%sample%' AND created_at >= datetime('now','-56 days') AND created_at < datetime('now','-28 days')) AS real_orgs_prev_28d,
            (SELECT COUNT(*) FROM contact_submissions) AS contact_submissions_total,
            (SELECT COUNT(*) FROM contact_submissions WHERE created_at >= datetime('now','-28 days')) AS contact_submissions_last_28d,
            (SELECT COUNT(*) FROM members) AS members_total,
            (SELECT COUNT(*) FROM members WHERE created_at >= datetime('now','-28 days')) AS members_last_28d,
            (SELECT COUNT(*) FROM payments) AS payments_total,
            (SELECT COUNT(*) FROM payments WHERE created_at >= datetime('now','-28 days')) AS payments_last_28d,
            (SELECT COUNT(*) FROM subscription_plans) AS plans_total,
            (SELECT COUNT(*) FROM subscription_plans WHERE created_at >= datetime('now','-28 days')) AS plans_last_28d,
            (SELECT COUNT(*) FROM check_ins) AS checkins_total,
            (SELECT COUNT(*) FROM check_ins WHERE created_at >= datetime('now','-28 days')) AS checkins_last_28d;
          SELECT date(created_at) AS date, COUNT(*) AS new_real_orgs
          FROM organizations
          WHERE demo_data_ids IS NULL AND lower(name) NOT LIKE '%test%' AND lower(name) NOT LIKE '%demo%' AND lower(name) NOT LIKE '%sample%' AND created_at >= datetime('now','-56 days')
          GROUP BY date(created_at)
          ORDER BY date;
          SELECT type, COUNT(*) AS real_orgs
          FROM organizations
          WHERE demo_data_ids IS NULL AND lower(name) NOT LIKE '%test%' AND lower(name) NOT LIKE '%demo%' AND lower(name) NOT LIKE '%sample%'
          GROUP BY type
          ORDER BY real_orgs DESC;
          SELECT
            o.id,
            o.name,
            o.type,
            date(o.created_at) AS created_date,
            CASE WHEN o.demo_data_ids IS NOT NULL OR lower(o.name) LIKE '%test%' OR lower(o.name) LIKE '%demo%' OR lower(o.name) LIKE '%sample%' THEN 1 ELSE 0 END AS is_test_or_demo,
            COUNT(DISTINCT m.id) AS members,
            COUNT(DISTINCT p.id) AS payments,
            COUNT(DISTINCT sp.id) AS plans,
            COUNT(DISTINCT ci.id) AS checkins
          FROM organizations o
          LEFT JOIN members m ON m.org_id = o.id
          LEFT JOIN payments p ON p.org_id = o.id
          LEFT JOIN subscription_plans sp ON sp.org_id = o.id
          LEFT JOIN check_ins ci ON ci.org_id = o.id
          GROUP BY o.id
          ORDER BY o.created_at DESC;
        `)
      : Promise.resolve(null),
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
  const funnelEvents = parseGA4DimMetric(ga4FunnelEvents);

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

  // CF data
  const cfError = cfOverview?._error ?? null;
  if (CF_ENABLED && cfError) console.warn(`⚠️  Cloudflare Workers unavailable: ${cfError}`);
  if (!CF_ENABLED) console.log('ℹ️  Cloudflare analytics skipped (no CLOUDFLARE_API_TOKEN/Wrangler OAuth token or CLOUDFLARE_ACCOUNT_ID). Run: npx wrangler login or set CLOUDFLARE_API_TOKEN');

  const cfStats = (() => {
    if (!CF_ENABLED || cfError || !cfOverview) return null;
    const nodes = cfOverview?.viewer?.accounts?.[0]?.workersInvocationsAdaptive;
    if (!nodes?.length) return null;
    const n = nodes[0];
    return {
      requests: n.sum.requests,
      errors: n.sum.errors,
      subrequests: n.sum.subrequests,
      errorRate: n.sum.requests > 0 ? n.sum.errors / n.sum.requests : 0,
      cpuP50: n.quantiles.cpuTimeP50,
      cpuP75: n.quantiles.cpuTimeP75,
      cpuP99: n.quantiles.cpuTimeP99,
    };
  })();

  const cfDailyRows = (() => {
    if (!CF_ENABLED || !cfDaily || cfDaily._error) return [];
    const nodes = cfDaily?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? [];
    return nodes.map(n => ({
      date: n.dimensions.date,
      requests: n.sum.requests,
      errors: n.sum.errors,
      subrequests: n.sum.subrequests,
      cpuP50: n.quantiles.cpuTimeP50,
      cpuP99: n.quantiles.cpuTimeP99,
    }));
  })();

  const d1Error = d1CustomerData?._error ?? null;
  if (CF_D1_ENABLED && d1Error) console.warn(`⚠️  D1 customer reporting unavailable: ${d1Error}`);
  if (!CF_D1_ENABLED) console.log('ℹ️  D1 customer reporting skipped (missing Cloudflare token/account/database id)');

  const customerStats = (() => {
    if (!CF_D1_ENABLED || d1Error || !Array.isArray(d1CustomerData)) return null;
    const overview = d1CustomerData[0]?.results?.[0];
    if (!overview) return null;
    const recentOrgs = d1CustomerData[3]?.results ?? [];
    return {
      ...overview,
      newRealOrgsByDate: d1CustomerData[1]?.results ?? [],
      realOrgsByType: d1CustomerData[2]?.results ?? [],
      recentOrgs,
      activeRealOrgs: recentOrgs.filter(org =>
        !org.is_test_or_demo && ((org.members ?? 0) > 0 || (org.payments ?? 0) > 0 || (org.plans ?? 0) > 0 || (org.checkins ?? 0) > 0)
      ).length,
    };
  })();

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
    summaryBullets.push(`Sessions are **${sessionTrend}** period-over-period (${fmtNum(cur.sessions)} vs ${fmtNum(prv.sessions)}).`);
  }
  if (scCur.clicks) summaryBullets.push(`Search Console shows **${fmtNum(scCur.clicks)} clicks** from **${fmtNum(scCur.impressions)} impressions** in the last 28 days.`);
  if (scCur.position) summaryBullets.push(`Average search position is **${scCur.position?.toFixed(1)}** — ${scCur.position < 20 ? 'appearing on the first two pages' : 'room for improvement'}.`);
  if (opportunities.length > 0) summaryBullets.push(`**${opportunities.length} keyword opportunities** found ranking between positions 5-20 with decent impressions.`);

  if (cfStats) {
    summaryBullets.push(`Cloudflare Workers handled **${fmtNum(cfStats.requests)} requests** with a **${fmtPct(cfStats.errorRate)} error rate** (p99 CPU: ${(cfStats.cpuP99 / 1000).toFixed(1)}ms).`);
  }

  if (customerStats) {
    summaryBullets.push(`D1 shows **${fmtNum(customerStats.real_orgs_last_28d)} new real organization(s)** this period (${fmtNum(customerStats.real_orgs_prev_28d)} in the previous 28 days).`);
  }

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

### Funnel Events

| Event | Count | Users |
|-------|-------|-------|
${(() => {
  const expectedEvents = [
    'primary_cta_click',
    'register_page_view',
    'registration_submit',
    'registration_success',
    'organization_created',
    'onboarding_completed',
    'contact_submit',
    'contact_submission_success',
  ];
  const eventMap = new Map(funnelEvents.map(event => [event.dim, event]));
  return expectedEvents.map(eventName => {
    const event = eventMap.get(eventName);
    return `| \`${eventName}\` | ${fmtNum(event?.eventCount ?? 0)} | ${fmtNum(event?.totalUsers ?? 0)} |`;
  }).join('\n');
})()}

${(() => {
  const eventMap = new Map(funnelEvents.map(event => [event.dim, event]));
  const ctaClicks = eventMap.get('primary_cta_click')?.eventCount ?? 0;
  const registerViews = eventMap.get('register_page_view')?.eventCount ?? 0;
  const registrationSuccess = eventMap.get('registration_success')?.eventCount ?? 0;
  const orgCreated = eventMap.get('organization_created')?.eventCount ?? 0;
  const rate = (part, whole) => whole > 0 ? ((part / whole) * 100).toFixed(1) + '%' : 'N/A';
  return `> **Funnel rates:** CTA to register view ${rate(registerViews, ctaClicks)} · register view to signup ${rate(registrationSuccess, registerViews)} · signup to organization created ${rate(orgCreated, registrationSuccess)}.`;
})()}

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

${customerStats ? `## Customer and Product Activity

### Overview from D1

| Metric | Value |
|--------|-------|
| Total users | ${fmtNum(customerStats.users_total)} |
| New users, last 28 days | ${fmtNum(customerStats.users_last_28d)} |
| New users, previous 28 days | ${fmtNum(customerStats.users_prev_28d)} |
| Total organizations | ${fmtNum(customerStats.orgs_total)} |
| Real organizations | ${fmtNum(customerStats.real_orgs_total)} |
| New real organizations, last 28 days | ${fmtNum(customerStats.real_orgs_last_28d)} |
| New real organizations, previous 28 days | ${fmtNum(customerStats.real_orgs_prev_28d)} |
| Active real organizations | ${fmtNum(customerStats.activeRealOrgs)} |
| Contact submissions, last 28 days | ${fmtNum(customerStats.contact_submissions_last_28d)} |
| Members added, last 28 days | ${fmtNum(customerStats.members_last_28d)} |
| Payments recorded, last 28 days | ${fmtNum(customerStats.payments_last_28d)} |
| Plans created, last 28 days | ${fmtNum(customerStats.plans_last_28d)} |
| Check-ins, last 28 days | ${fmtNum(customerStats.checkins_last_28d)} |

### Real Organizations by Type

| Type | Organizations |
|------|---------------|
${customerStats.realOrgsByType.map(row => `| ${row.type} | ${fmtNum(row.real_orgs)} |`).join('\n') || '| - | 0 |'}

### Recent Organizations

| Created | Organization | Type | Real/Test | Members | Payments | Plans | Check-ins |
|---------|--------------|------|-----------|---------|----------|-------|-----------|
${customerStats.recentOrgs.slice(0, 10).map(org => `| ${org.created_date} | ${org.name} | ${org.type} | ${org.is_test_or_demo ? 'test/demo' : 'real'} | ${fmtNum(org.members)} | ${fmtNum(org.payments)} | ${fmtNum(org.plans)} | ${fmtNum(org.checkins)} |`).join('\n')}

> Real organization reporting excludes seeded demo data and organization names matching \`${TEST_ORG_NAME_PATTERN.source}\`.

---
` : CF_D1_ENABLED && d1Error ? `## Customer and Product Activity

> ⚠️ **D1 customer reporting unavailable:** ${d1Error}

---
` : ''}

${cfStats ? `## Cloudflare Workers

### Overview (Last 28 Days)

| Metric | Value |
|--------|-------|
| Total Requests | ${fmtNum(cfStats.requests)} |
| Errors | ${fmtNum(cfStats.errors)} |
| Error Rate | ${fmtPct(cfStats.errorRate)} |
| Subrequests | ${fmtNum(cfStats.subrequests)} |
| CPU Time p50 | ${(cfStats.cpuP50 / 1000).toFixed(1)}ms |
| CPU Time p75 | ${(cfStats.cpuP75 / 1000).toFixed(1)}ms |
| CPU Time p99 | ${(cfStats.cpuP99 / 1000).toFixed(1)}ms |

${cfDailyRows.length > 0 ? `### Daily Trend

| Date | Requests | Errors | Error Rate | CPU p50 | CPU p99 |
|------|----------|--------|------------|---------|---------|
${cfDailyRows.map(d => `| ${d.date} | ${fmtNum(d.requests)} | ${fmtNum(d.errors)} | ${d.requests > 0 ? fmtPct(d.errors / d.requests) : '—'} | ${(d.cpuP50 / 1000).toFixed(1)}ms | ${(d.cpuP99 / 1000).toFixed(1)}ms |`).join('\n')}` : ''}

---
` : CF_ENABLED && cfError ? `## Cloudflare Workers

> ⚠️ **Workers analytics unavailable:** ${cfError}

---
` : ''}
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
*Data source: GA4 Property ${GA4_PROPERTY} · Search Console ${SC_SITE}${cfStats ? ` · Cloudflare Worker ${CF_WORKER_NAME}` : ''}*
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
