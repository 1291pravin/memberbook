# Autopilot Marketing Workflow

## Overview

The Autopilot Marketing pipeline consists of 4 synchronized agents running daily:

```
┌─────────────────────────────────────────────────────────┐
│                  DAILY POSTING CYCLE                     │
└─────────────────────────────────────────────────────────┘

9:00 AM Start
    ↓
┌──────────────────────────────────┐
│  PM Agent (Initial Setup)        │
│  Creates STRATEGY.md (weekly)    │
│  - 7 daily topics                │
│  - Themes & CTAs                 │
│  - Platform-specific guidelines  │
└──────────────────────────────────┘
    ↓
Every Day at 9:00 AM
    ↓
┌──────────────────────────────────┐
│  Creator Agent                   │
│  Reads today's topic from        │
│  STRATEGY.md                     │
│  Generates 4 unique posts:       │
│  - Instagram (visual, casual)    │
│  - Facebook (storytelling)       │
│  - LinkedIn (professional)       │
│  - Twitter (punchy)              │
└──────────────────────────────────┘
    ↓
9:15 AM Posting
    ↓
┌──────────────────────────────────┐
│  Scheduler Agent                 │
│  Posts to all 4 platforms        │
│  - Fetches images from Unsplash  │
│  - Adds UTM tracking links       │
│  - Logs posts to POSTS_LOG.md    │
└──────────────────────────────────┘
    ↓
9:30 AM Analytics
    ↓
┌──────────────────────────────────┐
│  Analyzer Agent                  │
│  Checks yesterday's engagement:  │
│  - Likes, comments, shares       │
│  - Reach & impressions           │
│  - Updates POSTS_LOG.md          │
│  - Generates daily report        │
└──────────────────────────────────┘
    ↓
9:45 AM Complete

Schedule next day...
```

## File State During Workflow

### Before Setup
```
<project-root>/
└── (no marketing-autopilot directory)
```

### After `/autopilot-marketing setup`
```
marketing-autopilot/
├── CONFIG.md (project info, platforms, posting time)
├── STRATEGY.md (empty, waiting for PM Agent)
├── POSTS_LOG.md (empty, waiting for posts)
└── CREDENTIALS.env (user's API tokens, git-ignored)
```

### After `/autopilot-marketing strategy` (PM Agent)
```
marketing-autopilot/
├── CONFIG.md
├── STRATEGY.md ← NEW: 7-day topic plan
├── POSTS_LOG.md
└── CREDENTIALS.env
```

### After First Day's `/autopilot-marketing start` (Creator + Scheduler + Analyzer)
```
marketing-autopilot/
├── CONFIG.md
├── STRATEGY.md (unchanged)
├── POSTS_LOG.md ← NEW: Today's posts + yesterday's metrics
├── CREDENTIALS.env
└── today-posts.md (temp file, created during generation)
```

### After 7 Days
```
marketing-autopilot/
├── CONFIG.md (unchanged)
├── STRATEGY.md (unchanged, or refreshed weekly)
├── POSTS_LOG.md (contains 7 days of posts + metrics)
├── CREDENTIALS.env (unchanged)
└── ANALYTICS_WEEKLY.md (optional: weekly summary)
```

## State Machine

```
┌─────────────────────────────────────────┐
│  INITIAL STATE: Setup Required          │
│  User runs: /autopilot-marketing setup  │
└─────────────────────────────────────────┘
         ↓
    CONFIG.md created
    CREDENTIALS.env.example shown
         ↓
┌─────────────────────────────────────────┐
│  AWAITING_CREDENTIALS                   │
│  User fills CREDENTIALS.env             │
│  User runs: /autopilot-marketing setup  │
└─────────────────────────────────────────┘
         ↓
    Credentials validated
         ↓
┌─────────────────────────────────────────┐
│  READY_FOR_STRATEGY                     │
│  User runs: /autopilot-marketing start  │
│  OR: /autopilot-marketing strategy      │
└─────────────────────────────────────────┘
         ↓
    PM Agent creates STRATEGY.md
    User approves strategy
         ↓
┌─────────────────────────────────────────┐
│  RUNNING: Daily Posting Active          │
│  Every day at 9:00 AM:                  │
│  1. Creator generates posts             │
│  2. Scheduler posts to platforms        │
│  3. Analyzer checks engagement          │
└─────────────────────────────────────────┘
         ↓
    Runs daily until:
    /autopilot-marketing reset OR
    /autopilot-marketing strategy (refresh)
         ↓
┌─────────────────────────────────────────┐
│  RESET: Start Over                      │
│  STRATEGY.md cleared                    │
│  POSTS_LOG.md cleared                   │
│  Go back to: READY_FOR_STRATEGY         │
└─────────────────────────────────────────┘
```

## Detailed Agent Flows

### PM Agent Flow (Weekly Strategy)

```
INPUT: CONFIG.md, CLAUDE.md, README.md
  ↓
1. Read project information
   - Product name, website, audience
   - Key features, value props
   - Target pain points
  ↓
2. Plan 7 daily topics
   - Vary content types (edu, social proof, features, behind-the-scenes)
   - Align with product narrative
   - Plan CTAs strategically
  ↓
3. Create STRATEGY.md
   - Daily breakdown (Monday-Sunday)
   - Theme, content type, CTA for each day
   - Platform-specific guidelines
   - Content themes to rotate
  ↓
4. Propose strategy to user
   - User can edit STRATEGY.md if desired
   - User approves before daily posting starts

OUTPUT: STRATEGY.md (ready for Creator Agent)
```

### Creator Agent Flow (Daily Content)

```
INPUT: STRATEGY.md, CONFIG.md, CLAUDE.md, TODAY's DATE
  ↓
1. Determine today's date
  ↓
2. Look up today's topic in STRATEGY.md
   - Extract: Theme, Content Type, CTA, Keywords
  ↓
3. Generate 4 platform-specific posts
   - Instagram: Visual, casual, hashtags, emojis (100-150 chars)
   - Facebook: Storytelling, conversational, CTA (150-250 chars)
   - LinkedIn: Professional, insights, thought leadership (200-300 chars)
   - Twitter: Punchy, trending, short (< 280 chars)
  ↓
4. For each post:
   - Write unique copy
   - Suggest image type/style
   - Include CTA
   - Reference website link (no UTM yet)
  ↓
5. Output posts in structured format

OUTPUT: 4 unique posts (ready for Scheduler Agent)
```

### Scheduler Agent Flow (Posting + UTM Tracking)

```
INPUT: Creator's posts, CONFIG.md, CREDENTIALS.env
  ↓
1. For each platform:
  ↓
   a) Get the platform-specific post from Creator
      - Extract caption & image suggestion
  ↓
   b) Generate UTM-tracked link
      <website>?utm_source=<platform>&utm_medium=social&utm_campaign=autopilot&utm_content=<date>
  ↓
   c) Fetch image from Unsplash
      - Search Unsplash API based on image suggestion
      - Download high-quality image
  ↓
   d) Post to platform using MCP server
      - Meta API (Instagram/Facebook)
      - Twitter API (Twitter/X)
      - LinkedIn API (LinkedIn)
  ↓
   e) Log post details
      - Platform, timestamp, caption preview, UTM link
  ↓
2. Update POSTS_LOG.md
   - Add today's posts
   - Include: platform, time, caption, link
  ↓
3. Confirm all posts successful

OUTPUT: Posts live on all platforms, POSTS_LOG.md updated
```

### Analyzer Agent Flow (Engagement Tracking)

```
INPUT: POSTS_LOG.md, CREDENTIALS.env, YESTERDAY's DATE
  ↓
1. Identify yesterday's posts in POSTS_LOG.md
  ↓
2. For each yesterday's post:
  ↓
   a) Use MCP server to fetch platform metrics
      - Instagram: likes, comments, shares, reach
      - Facebook: reactions, comments, shares, reach
      - LinkedIn: likes, comments, shares
      - Twitter: retweets, likes, replies
  ↓
   b) Aggregate metrics
      - Total engagement
      - Per-platform breakdown
      - Best performing post
  ↓
3. Identify insights
   - Which content type performed best?
   - Which platform generated most engagement?
   - What was the reach?
  ↓
4. Update POSTS_LOG.md with metrics
   - Add engagement numbers to yesterday's posts
   - Note performance summary
  ↓
5. Generate daily report
   - Total engagement
   - Best performing post & theme
   - Recommendation for tomorrow

OUTPUT: POSTS_LOG.md updated, Daily report generated
```

## Error Handling & Recovery

### If Creator Agent Fails
```
ERROR: Cannot generate posts
  ↓
REASON: Likely topic not found in STRATEGY.md
  ↓
ACTION:
  1. Check STRATEGY.md has today's date entry
  2. Check date format matches
  3. Run /autopilot-marketing strategy again
  4. Run /autopilot-marketing start again
```

### If Scheduler Agent Fails
```
ERROR: Cannot post to platform
  ↓
REASON: Invalid credentials or API error
  ↓
ACTION:
  1. Verify CREDENTIALS.env has all tokens
  2. Check tokens are not expired
  3. Verify API access level (some require elevated access)
  4. Check platform API status
  5. Re-run /autopilot-marketing start
```

### If Analyzer Agent Fails
```
ERROR: Cannot fetch engagement metrics
  ↓
REASON: API rate limit or permissions issue
  ↓
ACTION:
  1. Some platforms have rate limits (esp. Twitter)
  2. Wait 15 minutes and retry
  3. Check API access level
  4. Metrics will be updated next cycle
```

## Customization Points

### Posting Time
Default: 9:00 AM
Edit in `CONFIG.md` → `Posting Time` field
Scheduler will use this for CronCreate

### Strategy Duration
Default: 7 days (weekly)
PM Agent can create 14-30 day strategies too
Edit STRATEGY.md directly to extend

### Platform Coverage
Modify in `CONFIG.md` → `Platforms` section
Can disable any platform (e.g., skip LinkedIn if not needed)

### Image Source
Default: Unsplash (free, no attribution needed)
Alternative: Custom images (provide directory path)
Edit in CONFIG.md → `Image Source`

### Content Themes
Edit STRATEGY.md directly to change daily themes
Mix-and-match content types based on product needs

### UTM Parameters
Customize in Scheduler Agent logic
Add additional parameters for campaign tracking
