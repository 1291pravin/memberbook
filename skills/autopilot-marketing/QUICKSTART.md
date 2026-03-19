# Autopilot Marketing - Quick Start Guide

## What You Built

A fully autonomous social media marketing pipeline that:
- **Generates unique posts daily** (4 per day across platforms)
- **Posts automatically** to Instagram, Facebook, LinkedIn, Twitter/X
- **Tracks engagement** (likes, comments, shares, reach)
- **Manages credentials securely** (environment variables, git-ignored)
- **Auto-discovers your project** (reads CLAUDE.md, package.json)

**Platforms Supported:**
✅ Instagram
✅ Facebook
✅ LinkedIn
✅ Twitter/X

---

## Getting Started (5 Steps)

### Step 1: Create Social Media Accounts (if needed)
You need accounts for: Instagram (Business), Facebook (Business), LinkedIn (Company), Twitter (API access).

**If you already have accounts:**
→ Go to Step 2

**If you need to create them:**
→ We'll help you create them via browser. Just say "help me create accounts"

---

### Step 2: Gather API Credentials
Each platform requires API tokens/keys. This takes **30-60 minutes** per platform.

**For each platform, you'll get:**

| Platform | What You Get |
|----------|-------------|
| **Meta** | Business Account ID, Page Access Token, Instagram Account ID |
| **Twitter/X** | API Key, API Secret, Access Token, Token Secret |
| **LinkedIn** | Access Token, Organization ID |
| **Unsplash** | Access Key (free, for images) |

**Detailed setup guide:** See `references/api-setup.md`

---

### Step 3: Run `/autopilot-marketing setup`

This command will:
1. Detect your project (reads CLAUDE.md, package.json)
2. Ask for any missing info (website URL, audience, etc.)
3. Create `marketing-autopilot/` directory
4. Show you where to add credentials

**You provide:**
- Add your API credentials to `marketing-autopilot/CREDENTIALS.env`

---

### Step 4: Run `/autopilot-marketing strategy`

This command:
1. **PM Agent** reads your project info
2. Creates a 7-day content plan (`STRATEGY.md`)
3. Shows you the plan
4. Waits for your approval

**You review:**
- Is the content strategy good?
- Want to customize topics? Edit `STRATEGY.md` directly

---

### Step 5: Run `/autopilot-marketing start`

This starts the **daily posting cycle**:

```
9:00 AM → Creator Agent generates 4 posts (Instagram, Facebook, LinkedIn, Twitter)
9:15 AM → Scheduler Agent posts to all platforms + adds UTM tracking
9:30 AM → Analyzer Agent checks yesterday's engagement
9:45 AM → Done! Posts are live, analytics updated
```

**Every single day**, this happens automatically. You don't need to do anything.

---

## Daily Workflow

### What Happens Every Day

```
Your marketing is completely automated ✅
No more:
  ❌ Sitting down to write posts
  ❌ Copying captions across platforms
  ❌ Scheduling posts manually
  ❌ Checking engagement hours later

Your routine:
  ☑️ Check `/autopilot-marketing status` (optional)
  ☑️ See yesterday's engagement metrics
  ☑️ See today's scheduled posts
```

### View Status Anytime

```
/autopilot-marketing status
```

Shows:
- Today's scheduled posts (from STRATEGY.md)
- Yesterday's engagement (likes, comments, shares)
- Next 7 days' topics
- Last posting timestamp

---

## Customization

### Change Posting Time
Edit `marketing-autopilot/CONFIG.md`:
```
Posting Time: 2:00 PM (instead of 9:00 AM)
```

### Change Weekly Strategy
Edit `marketing-autopilot/STRATEGY.md` directly:
- Change daily themes
- Modify CTAs
- Adjust target audience tone

### Add New Platforms
Edit `marketing-autopilot/CONFIG.md` and add credential format (e.g., TikTok if available in future)

### Skip a Platform
Edit `marketing-autopilot/CONFIG.md`:
```
Platforms:
- Instagram: ✓ Configured
- Facebook: ✓ Configured
- LinkedIn: ✗ Disabled
- Twitter: ✓ Configured
```

---

## Important Files & Folders

```
marketing-autopilot/
├── CONFIG.md ← Project info, platforms, posting time
├── STRATEGY.md ← 7-day content plan (you can edit this!)
├── POSTS_LOG.md ← History of all posts + engagement metrics
└── CREDENTIALS.env ← API tokens (NEVER commit this!)
```

Add this to `.gitignore`:
```
marketing-autopilot/CREDENTIALS.env
```

---

## Troubleshooting

### "Credential validation failed"
**Problem:** Invalid API tokens
**Solution:**
1. Check `references/api-setup.md` for each platform
2. Verify tokens are correct and haven't expired
3. Update `CREDENTIALS.env` with new tokens
4. Run `/autopilot-marketing start` again

### "Failed to post to Instagram"
**Problem:** Meta API error
**Solution:**
1. Verify `META_BUSINESS_ACCOUNT_ID` and `META_INSTAGRAM_ACCOUNT_ID` are correct
2. Check if your business account is in good standing
3. Verify page access token is still valid

### "No posts generated"
**Problem:** STRATEGY.md missing today's entry
**Solution:**
1. Run `/autopilot-marketing strategy` to refresh
2. Check STRATEGY.md has entries for all 7 days

### "Engagement metrics not loading"
**Problem:** API rate limiting or permissions
**Solution:**
1. Wait 15 minutes (rate limit reset)
2. Verify each platform token has "read engagement" permissions
3. Some platforms (especially Twitter) have strict rate limits

---

## Advanced: Refreshing Strategy

To get a **new 7-day content plan**:

```
/autopilot-marketing strategy
```

This will regenerate `STRATEGY.md` with fresh topics while keeping `POSTS_LOG.md` intact.

---

## Advanced: Reset Everything

To clear everything and start over:

```
/autopilot-marketing reset
```

This clears:
- ✓ STRATEGY.md (empty)
- ✓ POSTS_LOG.md (empty)

This keeps:
- ✗ CONFIG.md (saved)
- ✗ CREDENTIALS.env (saved)

Then run `/autopilot-marketing strategy` to create a new plan.

---

## Analytics & Reporting

Every day, the **Analyzer Agent** pulls:
- **Instagram:** Likes, comments, shares, reach, impressions
- **Facebook:** Reactions, comments, shares, reach, impressions
- **LinkedIn:** Likes, comments, shares, engagement rate
- **Twitter:** Retweets, likes, replies, impressions

All tracked in `POSTS_LOG.md` + Google Analytics (via UTM parameters).

### View Performance

In Google Analytics, filter by:
- **Campaign:** `autopilot`
- **Source:** `instagram`, `facebook`, `linkedin`, `twitter`
- **Medium:** `social`

---

## Next Steps

1. **Get API credentials** (30-60 min) → See `references/api-setup.md`
2. **Run setup** (`/autopilot-marketing setup`)
3. **Review strategy** (`/autopilot-marketing strategy`)
4. **Start posting** (`/autopilot-marketing start`)
5. **Track performance** (`/autopilot-marketing status`)

---

## Support Files

- **`SKILL.md`** — Full skill documentation
- **`references/workflow.md`** — Detailed agent workflows
- **`references/api-setup.md`** — Platform-by-platform credential setup
- **`examples/strategy-example.md`** — Sample 7-day content plan
- **`examples/post-examples.md`** — Real post examples across platforms

---

## Questions?

**Common questions answered in:**
- `references/api-setup.md` — Credential & integration issues
- `references/workflow.md`  — How the pipeline works
- `examples/strategy-example.md` — Customization examples

**Your project details will be auto-detected from:**
- `CLAUDE.md` (product description, audience)
- `package.json` (project name, type)
- `README.md` (product info)

---

## Success Metrics

After 1-2 weeks, check:

| Metric | Target |
|--------|--------|
| Posts per week | 7 (one per day) ✓ |
| Total engagement | 500+ likes/week |
| Best performing platform | Track in Google Analytics |
| Engagement rate | 3-5% |
| Click-through to website | 50+ /week |

Adjust your STRATEGY.md based on what's working!

---

**You're all set! Ready to leave your marketing on autopilot?** 🚀
