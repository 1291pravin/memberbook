---
name: memberbook-analytics
description: Generate and analyze a comprehensive MemberBook analytics report covering GA4, Search Console, and Cloudflare Workers data
triggers:
  - analytics report
  - how is memberbook performing
  - site performance
  - GA4 report
  - search console report
  - cloudflare analytics
  - memberbook analytics
  - generate analytics
---

# MemberBook Analytics Report

Generate a comprehensive analytics report for MemberBook and provide deep, actionable analysis.

## Workflow

### Step 1: Generate the Report

Run the data collection script from the project root:

```bash
cd C:/Projects/MemberBook && node scripts/generate-analytics-report.mjs
```

This script:
- Authenticates with Google OAuth2 (may open browser on first run)
- Fetches GA4, Search Console, and Cloudflare Workers data for the last 28 days
- Saves a markdown report to `reports/analytics-report-YYYY-MM-DD.md`

If the script fails, troubleshoot the error and inform the user.

### Step 2: Read the Reports

1. Read the newly generated report from `C:/Projects/MemberBook/reports/`
2. Look for up to 2 previous reports in the same directory for trend comparison
3. Read `references/analysis-framework.md` in this skill directory for metric thresholds and analysis patterns

### Step 3: Analyze and Present

Using the analysis framework, provide:

1. **Executive Summary** (3-5 bullet points)
   - Overall health verdict (healthy / needs attention / critical)
   - Most significant change from prior period
   - One-line on each data source (GA4, Search Console, Cloudflare)

2. **Trend Analysis** (compare with previous reports if available)
   - Session/traffic trajectory (improving, flat, declining)
   - Search visibility trend
   - Infrastructure performance trend

3. **Health Assessment by Source**
   - **GA4:** Traffic quality, engagement, channel mix
   - **Search Console:** Organic growth, keyword strength, CTR health
   - **Cloudflare Workers:** Reliability, performance, capacity

4. **Top 5 Prioritized Recommendations**
   - Ranked by expected impact
   - Each with: what to do, why it matters, estimated effort (low/medium/high)

5. **Watch List**
   - Metrics approaching threshold boundaries
   - Emerging trends (positive or negative) to monitor next period

Keep the analysis specific to MemberBook's context as an early-stage SaaS targeting gyms, libraries, and tuition centers in India.

### Step 4: Generate Task File

After presenting the analysis, create an actionable task file at `C:/Projects/MemberBook/reports/tasks-YYYY-MM-DD.md` that any agent can pick up and execute. The file must:

1. **Use checkbox format** — `[ ]` for todo, `[x]` for done, `[-]` for skipped
2. **One task per recommendation** — each with:
   - Priority (P0 = highest leverage, P1 = important, P2 = nice to have)
   - Impact and effort ratings (HIGH/MEDIUM/LOW)
   - Area label (SEO, Content, CRO, Infrastructure, etc.)
   - A **"Why"** section explaining the data-backed reason
   - **Subtasks** broken into specific, implementable steps an agent can act on without additional context
   - A **"Success metric"** defining how to measure if the task worked
3. **Include a Watch Items section** — metrics to monitor next period (not actionable tasks, just flags)
4. **Be self-contained** — any agent reading this file should understand what to do, why, and how to verify success without needing to read the analytics report

Tell the user the task file has been created and where to find it.
