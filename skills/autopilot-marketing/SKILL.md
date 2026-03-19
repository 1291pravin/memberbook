---
name: Autopilot Marketing
description: This skill should be used when the user asks to "setup autopilot marketing", "create marketing strategy", "start autopilot", "post to social media automatically", "schedule social posts", "track social engagement", "auto-post on Instagram/Facebook/LinkedIn/Twitter", or wants to leave marketing on autopilot. Automates daily social media posting, content generation, and engagement tracking across Instagram, Facebook, LinkedIn, and Twitter/X.
version: 0.1.0
---

# Autopilot Marketing

## Overview

Autopilot Marketing is an autonomous pipeline for daily social media content generation, posting, and performance tracking. It orchestrates four specialized agents (PM, Creator, Scheduler, Analyzer) that work together to:

1. **PM Agent** — Creates a weekly content strategy (STRATEGY.md) with daily topics, themes, and CTAs
2. **Creator Agent** — Generates unique posts for each platform with captions and images
3. **Scheduler Agent** — Posts to all platforms (Instagram, Facebook, LinkedIn, Twitter/X) with UTM-tracked links
4. **Analyzer Agent** — Tracks engagement metrics and generates daily performance reports

The entire workflow runs autonomously on a daily schedule. The user only needs to configure credentials once, then marketing runs on autopilot.

## Commands

| Command | What it does |
|---------|-------------|
| `/autopilot-marketing setup` | Initialize marketing autopilot: detect project, ask for platform credentials, create CONFIG.md |
| `/autopilot-marketing strategy` | PM Agent creates/updates STRATEGY.md with weekly content plan (topics, themes, CTAs) |
| `/autopilot-marketing start` | Begin daily posting cycle: triggers Creator → Scheduler → Analyzer chain |
| `/autopilot-marketing status` | Show today's scheduled posts, yesterday's engagement metrics, next week's topics |
| `/autopilot-marketing reset` | Clear strategy, posts log, and reset pipeline to initial state |

---

## Setup (`/autopilot-marketing setup`)

### Process

1. **Detect Project Context**
   - Read `package.json`, `CLAUDE.md`, `README.md` to understand the product
   - Extract: product name, website URL, target audience, key features

2. **Ask For Missing Information** (if needed)
   - Ask for website URL if not found
   - Ask for primary audience/tone if unclear
   - Ask for main product/service to highlight

3. **Create Directory Structure**
   ```
   <project-root>/
   └── marketing-autopilot/
       ├── CONFIG.md
       ├── STRATEGY.md (empty, to be filled by PM Agent)
       ├── POSTS_LOG.md (tracks all posted content)
       └── CREDENTIALS.env (git-ignored)
   ```

4. **Ask for Platform Credentials**
   - Explain that credentials are needed for Instagram, Facebook, LinkedIn, Twitter/X
   - For each platform, guide user on how to obtain credentials (API tokens, app IDs, etc.)
   - Credentials go in `CREDENTIALS.env` (git-ignored file)
   - Provide `.env.example` template

5. **Create CONFIG.md**
   ```markdown
   # Autopilot Marketing Config

   ## Project
   - **Name:** <detected from package.json>
   - **Website:** <detected or provided>
   - **Audience:** <detected or provided>
   - **Posting Time:** 9:00 AM (configurable)

   ## Platforms
   - Instagram: ✓ Configured
   - Facebook: ✓ Configured
   - LinkedIn: ✓ Configured
   - Twitter/X: ✓ Configured

   ## Strategy
   - **Frequency:** Daily
   - **Content Types:** Varied (tips, announcements, user testimonials, case studies)
   - **Image Source:** Unsplash (free stock) + Claude-generated
   - **Link Tracking:** UTM parameters

   ## Analyzer
   - **Metrics Tracked:** Likes, comments, shares, reach
   - **Report Frequency:** Daily
   ```

6. **Create CREDENTIALS.env.example**
   ```
   # Instagram/Facebook (Meta)
   META_BUSINESS_ACCOUNT_ID=your_business_id
   META_PAGE_ACCESS_TOKEN=your_access_token
   META_INSTAGRAM_ACCOUNT_ID=your_instagram_id

   # Twitter/X
   TWITTER_API_KEY=your_api_key
   TWITTER_API_SECRET=your_api_secret
   TWITTER_ACCESS_TOKEN=your_access_token
   TWITTER_ACCESS_TOKEN_SECRET=your_token_secret

   # LinkedIn
   LINKEDIN_ACCESS_TOKEN=your_access_token
   LINKEDIN_ORGANIZATION_ID=your_org_id

   # Unsplash (free images)
   UNSPLASH_ACCESS_KEY=your_access_key

   # Google Analytics (optional, for UTM tracking)
   GOOGLE_ANALYTICS_ID=your_ga_id

   # Project Info
   WEBSITE_URL=https://your-website.com
   BUSINESS_NAME=Your Company Name
   ```

7. **Confirm Setup**
   - Tell user: "Autopilot Marketing initialized. Fill in CREDENTIALS.env, then run `/autopilot-marketing strategy` to create your content plan."

---

## Strategy (`/autopilot-marketing strategy`)

### Pre-Checks

- Verify `marketing-autopilot/CONFIG.md` exists
- Verify credentials are in `CREDENTIALS.env` (or ask user to fill them in)

### Process

**Spawn PM Agent** as a TaskCreate sub-agent with this instruction:

```
You are a PM Agent in an Autopilot Marketing pipeline.

Your job: Create a comprehensive content strategy for next 7 days.

## Instructions

1. Read these files:
   - marketing-autopilot/CONFIG.md (project info, platforms)
   - CLAUDE.md or package.json (product details)
   - CREDENTIALS.env (to confirm platforms are ready)

2. Understand the Project:
   - What product/service does this company offer?
   - Who is the target audience?
   - What are key value propositions?
   - What does the website do? (Lead generation, sales, education, etc.)

3. Create STRATEGY.md with this structure:

   ```markdown
   # Content Strategy

   ## Project: <Product Name>
   - Website: <URL>
   - Audience: <description>
   - Goal: Drive traffic, educate, build community

   ## Weekly Plan

   ### Day 1 (Monday)
   - **Theme:** Educational tip about <topic>
   - **Platforms:** All 4 (Instagram, Facebook, LinkedIn, Twitter)
   - **Content Type:** How-to / Tips / Insights
   - **CTA:** "Learn more at <website>"
   - **Keywords:** <relevant keywords for product>

   ### Day 2 (Tuesday)
   - **Theme:** User testimonial / Case study
   - ...

   ### Day 3-7
   - ...

   ## Content Themes (rotate these)
   - Educational (tips, how-tos, industry insights)
   - Social proof (testimonials, case studies, results)
   - Product features (highlight key capabilities)
   - Behind-the-scenes (team, culture, development)
   - Industry news / Trending topics
   - CTAs (sign up, try free, visit website)

   ## Platform-Specific Notes
   - **Instagram:** Focus on visuals, 3-5 hashtags, emojis
   - **Facebook:** Longer captions, community engagement, calls-to-action
   - **LinkedIn:** Professional insights, thought leadership, statistics
   - **Twitter:** Short, punchy, trending topics, conversation

   ## Analytics Goals
   - Drive traffic to website
   - Increase engagement
   - Build brand awareness
   - Generate leads
   ```

4. Do NOT:
   - Create actual posts yet (that's the Creator Agent's job)
   - Post to platforms
   - Make assumptions about product — read the source code/docs

5. After creating STRATEGY.md, output:
   - Summary of 7-day plan
   - Key themes identified
   - Recommended CTAs
```

### After PM Agent Completes

1. Show the user the generated STRATEGY.md
2. Ask: "Does this strategy look good? You can edit STRATEGY.md if you want to customize topics, CTAs, or themes. Then run `/autopilot-marketing start` to begin daily posting."

---

## Start Daily Posting (`/autopilot-marketing start`)

### Pre-Checks

- Verify `marketing-autopilot/STRATEGY.md` exists
- Verify `CREDENTIALS.env` has all required tokens

### Process

Spawn the daily agent chain:

1. **Creator Agent** — Generates posts for today
2. **Scheduler Agent** — Posts to platforms
3. **Analyzer Agent** — Checks yesterday's engagement

**Creator Agent Instruction:**

```
You are a Creator Agent in the Autopilot Marketing pipeline.

Your job: Generate unique posts for today across all 4 platforms.

## Instructions

1. Read these files:
   - marketing-autopilot/STRATEGY.md (today's topic/theme)
   - marketing-autopilot/CONFIG.md (project info)
   - CLAUDE.md (product details)

2. Identify Today's Topic:
   - Find today's date
   - Look up the corresponding entry in STRATEGY.md
   - Extract: Theme, Content Type, CTA, Keywords

3. Generate 4 Unique Posts (one per platform):

   ### Instagram Post
   - Caption: 100-150 characters, friendly tone, 3-5 hashtags, emojis
   - Image: Describe a visually appealing image (Scheduler will find it)
   - Example: "Level up your <feature>! 🚀 Learn how <key benefit>. Link in bio → <link>"

   ### Facebook Post
   - Caption: 150-250 characters, conversational, storytelling, clear CTA
   - Image: Same as Instagram or alternative
   - Example: "Did you know? <statistic>. That's why we built <product> to help you <benefit>. Check it out → <link>"

   ### LinkedIn Post
   - Caption: 200-300 characters, professional, industry insights, thought leadership
   - Image: Professional/data-driven visual
   - Example: "In today's <industry>, <trend> is changing how teams work. We're excited to help with <feature>. Learn more → <link>"

   ### Twitter Post
   - Caption: Under 280 characters, punchy, conversational, trending keywords if relevant
   - Image: Eye-catching graphic or screenshot
   - Example: "Just shipped <feature> to help you <benefit>. 🎉 Check it out → <link>"

4. For each post:
   - Write unique copy (don't repeat)
   - Highlight different aspects of product/value
   - Include the website link (Scheduler will add UTM params)
   - Suggest image type/style

5. Output all 4 posts in this format:

   ```markdown
   # Posts for <Today's Date>

   ## Instagram
   **Caption:** ...
   **Image:** ...

   ## Facebook
   **Caption:** ...
   **Image:** ...

   ## LinkedIn
   **Caption:** ...
   **Image:** ...

   ## Twitter
   **Caption:** ...
   **Image:** ...
   ```

6. Do NOT:
   - Actually post to platforms
   - Generate images
   - Add UTM links (Scheduler does that)
```

**Scheduler Agent Instruction:**

```
You are a Scheduler Agent in the Autopilot Marketing pipeline.

Your job: Take the Creator's posts and publish them to all platforms.

## Instructions

1. Read:
   - Posts generated by Creator Agent
   - marketing-autopilot/CONFIG.md
   - CREDENTIALS.env (for API tokens)

2. For Each Platform:
   - Fetch the platform-specific post from Creator
   - Generate UTM-tracked link: <website>?utm_source=<platform>&utm_medium=social&utm_campaign=autopilot&utm_content=<date>
   - Find/download an appropriate image from Unsplash based on suggested image type
   - Post to platform using MCP server calls

3. Log Each Post:
   - Platform: Instagram | Facebook | LinkedIn | Twitter
   - Posted at: <timestamp>
   - Link: <UTM-tracked URL>
   - Engagement metrics: 0 (will be updated by Analyzer)

4. Update POSTS_LOG.md:
   ```markdown
   # Posts Log

   ## <Today's Date>

   - **Instagram:** Posted at 9:00 AM | <caption preview> | <link>
   - **Facebook:** Posted at 9:05 AM | <caption preview> | <link>
   - **LinkedIn:** Posted at 9:10 AM | <caption preview> | <link>
   - **Twitter:** Posted at 9:15 AM | <caption preview> | <link>
   ```

5. Do NOT:
   - Generate new content (use Creator's posts)
   - Modify captions
   - Skip platforms
```

**Analyzer Agent Instruction:**

```
You are an Analyzer Agent in the Autopilot Marketing pipeline.

Your job: Check engagement on yesterday's posts and summarize performance.

## Instructions

1. Read:
   - POSTS_LOG.md (yesterday's posts)
   - CREDENTIALS.env (for API tokens)

2. For Each Yesterday's Post:
   - Call MCP servers to fetch engagement metrics:
     - Instagram: likes, comments, shares, reach
     - Facebook: reactions, comments, shares, reach
     - LinkedIn: likes, comments, shares
     - Twitter: retweets, likes, replies

3. Update POSTS_LOG.md with metrics:
   ```markdown
   ## <Yesterday's Date>

   - **Instagram:** 45 likes | 8 comments | 3 shares | 120 reach
   - **Facebook:** 32 reactions | 5 comments | 2 shares | 98 reach
   - **LinkedIn:** 28 likes | 4 comments | 1 share
   - **Twitter:** 52 retweets | 120 likes | 18 replies

   ### Summary
   - Best performing post: <platform> (<metric>)
   - Total engagement: 312
   - Top-performing theme: <theme>
   ```

4. Output Performance Report:
   ```
   ## Daily Marketing Report

   ### Yesterday's Performance
   - Total posts: 4
   - Total engagement: <number>
   - Best platform: <platform>
   - Most engaging content type: <type>

   ### Key Insights
   - <highest engagement post>
   - <lowest engagement post>
   - <recommendation for tomorrow>
   ```

5. Do NOT:
   - Modify STRATEGY.md
   - Generate new posts
```

### After All Agents Complete

1. Show user a summary:
   - "✅ Posted to all 4 platforms"
   - "📊 Yesterday's engagement: <summary>"
   - "📅 Tomorrow's topic: <from STRATEGY.md>"
2. Schedule next day's posting automatically (using CronCreate for next day at 9 AM)

---

## Status (`/autopilot-marketing status`)

Display:
- Today's date
- Posts scheduled for today (from STRATEGY.md)
- Yesterday's engagement metrics (from POSTS_LOG.md)
- Next 7 days' topics (from STRATEGY.md)
- Last posting timestamp

---

## Reset (`/autopilot-marketing reset`)

1. Clear `marketing-autopilot/STRATEGY.md` (empty it)
2. Clear `marketing-autopilot/POSTS_LOG.md` (empty it)
3. Keep `marketing-autopilot/CONFIG.md` and `CREDENTIALS.env` (user re-enters strategy next time)
4. Confirm: "Autopilot Marketing reset. Run `/autopilot-marketing strategy` to create a new content plan."

---

## Orchestration Rules

After each agent completes:
1. Check for errors in STRATEGY.md, POSTS_LOG.md, or engagement metrics
2. If Creator failed → ask user for feedback on post quality
3. If Scheduler failed → check CREDENTIALS.env validity
4. If Analyzer failed → note platforms with missing metrics (some APIs may have rate limits)

---

## Important Notes

### Credentials Security
- `CREDENTIALS.env` must be added to `.gitignore`
- Never commit real tokens to version control
- Tokens are environment-specific

### API Limitations
- Meta (Instagram/Facebook): May have rate limits (handles up to 10 posts/day)
- Twitter/X: API access requires elevated access (handled in setup)
- LinkedIn: Requires organization-level token
- Unsplash: Free tier (up to 50 requests/hour)

### Content Quality
- Each post is unique and platform-specific
- Images are sourced from Unsplash (free, no attribution required)
- UTM links track traffic back to website
- Engagement metrics updated daily

## Additional Resources

For detailed setup, workflows, and troubleshooting:
- **`references/workflow.md`** — Complete PM → Creator → Scheduler → Analyzer flow
- **`references/api-setup.md`** — Step-by-step credential setup for all platforms
- **`references/platforms.md`** — Platform-specific guidelines and best practices

Working examples and reference files:
- **`examples/strategy-example.md`** — Sample 7-day content strategy
- **`examples/post-examples.md`** — Sample posts across all platforms
