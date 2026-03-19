# API Credentials Setup Guide

This guide walks through obtaining API credentials for each social media platform.

## Meta (Instagram & Facebook)

### What You Need
- Instagram Business Account
- Facebook Business Account
- Meta Business Manager account

### Step-by-Step

1. **Create Meta Business Account**
   - Go to business.facebook.com
   - Click "Create Account"
   - Fill in business name, email, password
   - Accept terms and continue

2. **Set Up Your App**
   - Go to developers.facebook.com
   - Click "My Apps" → "Create App"
   - Choose "Business" as app type
   - Fill in app name, app purpose
   - Click "Create App ID"

3. **Add Products**
   - In your app, go to "Products" → "Add Products"
   - Add "Facebook Login"
   - Add "Instagram Graph API"

4. **Get Access Token**
   - Go to Tools → Graph API Explorer
   - Select your app from top right dropdown
   - Click "Get Token" → "Get User Access Token"
   - Select permissions:
     - `instagram_basic`
     - `instagram_content_publishing`
     - `pages_read_engagement`
     - `pages_manage_posts`
   - Copy the token

5. **Get Business Account ID**
   - Go to business.facebook.com → Settings
   - Copy "Business Account ID"

6. **Get Instagram Account ID**
   - In Graph API Explorer, run:
     ```
     GET /me?fields=instagram_business_account
     ```
   - Copy the Instagram Account ID from response

### Credentials to Add to CREDENTIALS.env
```
META_BUSINESS_ACCOUNT_ID=<your_business_id>
META_PAGE_ACCESS_TOKEN=<your_long_lived_access_token>
META_INSTAGRAM_ACCOUNT_ID=<your_instagram_id>
```

### Limitations
- Free tier: 10 API calls per minute
- Business tier: Higher limits after review
- Rate limiting: Respect X-RateLimit headers

---

## Twitter/X API

### What You Need
- Twitter Developer Account
- Elevated access approval

### Step-by-Step

1. **Apply for Developer Account**
   - Go to developer.twitter.com
   - Click "Sign Up"
   - Complete application form
   - Twitter reviews (may take 24-48 hours)
   - Approve terms and create account

2. **Request Elevated Access**
   - In Developer Portal, go to Dashboard
   - Click on your project
   - Go to "Products" → "Twitter API v2"
   - Request "Elevated" access
   - Complete questionnaire
   - Twitter approves (usually instant)

3. **Create Keys**
   - Go to "Keys and Tokens" tab
   - Click "Generate" for API Key
   - Click "Generate" for API Secret Key
   - Copy both (save securely)

4. **Create Access Tokens**
   - Click "Generate" for Access Token
   - Click "Generate" for Access Token Secret
   - Copy both

5. **Set App Permissions**
   - Go to "App Settings"
   - Set "App Permissions" to "Read and Write"
   - Save changes

### Credentials to Add to CREDENTIALS.env
```
TWITTER_API_KEY=<your_api_key>
TWITTER_API_SECRET=<your_api_secret>
TWITTER_ACCESS_TOKEN=<your_access_token>
TWITTER_ACCESS_TOKEN_SECRET=<your_token_secret>
```

### Limitations
- Free tier: 300 posts per month
- Basic tier: Limited rate limiting
- Premium tier: Higher limits (requires payment)

---

## LinkedIn API

### What You Need
- LinkedIn Business Account or Personal Account
- LinkedIn Developer Account
- Organization/Company Page

### Step-by-Step

1. **Create LinkedIn App**
   - Go to linkedin.com/developers/apps
   - Click "Create App"
   - Fill in app name, page (select your company page)
   - Accept legal agreement
   - Click "Create App"

2. **Request Access**
   - Go to "Auth" tab
   - Under "Authorized redirect URLs", add your domain
   - Go to "Products" → Request "Sign In with LinkedIn"
   - Request "Share on LinkedIn" (for posting)
   - LinkedIn reviews (24-48 hours)

3. **Get Credentials**
   - Go to "Auth" tab
   - Copy "Client ID" and "Client Secret"
   - Use these to get Access Token via OAuth flow

4. **Get Organization ID**
   - Go to your Company Page on LinkedIn
   - Copy the page URL ID
   - Or use LinkedIn API Explorer to fetch

### Credentials to Add to CREDENTIALS.env
```
LINKEDIN_ACCESS_TOKEN=<your_access_token>
LINKEDIN_ORGANIZATION_ID=<your_organization_id>
```

### Limitations
- Free tier: 10 posts per month
- Premium tier: Unlimited posts (requires payment)
- Rate limiting: 100 requests per day

---

## Unsplash API (Free Images)

### What You Need
- Unsplash Account (free)
- API Key (free)

### Step-by-Step

1. **Create Unsplash Account**
   - Go to unsplash.com
   - Click "Sign up"
   - Complete registration

2. **Register App**
   - Go to unsplash.com/developers
   - Click "Your apps"
   - Click "New Application"
   - Accept terms
   - Fill in app name and description
   - Click "Create Application"

3. **Get Access Key**
   - Your app is created
   - Go to "Keys" section
   - Copy "Access Key"

### Credentials to Add to CREDENTIALS.env
```
UNSPLASH_ACCESS_KEY=<your_access_key>
```

### Limitations
- Free tier: 50 requests per hour
- No attribution required (but appreciated)
- Images are CC0 licensed

---

## Google Analytics (Optional)

### What You Need
- Google Analytics Account
- Tracking ID from your website

### Step-by-Step

1. **Set Up Google Analytics**
   - Go to analytics.google.com
   - Click "Admin" → "Create Property"
   - Fill in property name, website URL
   - Create property

2. **Get Tracking ID**
   - Go to Property Settings
   - Copy "Tracking ID" (looks like UA-XXXXXXXXX-X for GA4)

3. **Add UTM Parameters**
   - Scheduler Agent will add these automatically:
     - `utm_source=instagram` (or facebook, linkedin, twitter)
     - `utm_medium=social`
     - `utm_campaign=autopilot`
     - `utm_content=<date>`

### Credentials to Add to CREDENTIALS.env
```
GOOGLE_ANALYTICS_ID=<your_tracking_id>
```

### Benefits
- Track traffic from each platform
- See which posts drive engagement
- Understand audience behavior
- Optimize future content

---

## .env File Template

Create `marketing-autopilot/CREDENTIALS.env` with this template:

```bash
# ==========================================
# AUTOPILOT MARKETING CREDENTIALS
# ==========================================

# Meta (Instagram & Facebook)
META_BUSINESS_ACCOUNT_ID=your_business_id_here
META_PAGE_ACCESS_TOKEN=your_long_lived_token_here
META_INSTAGRAM_ACCOUNT_ID=your_instagram_id_here

# Twitter/X
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_token_secret_here

# LinkedIn
LINKEDIN_ACCESS_TOKEN=your_linkedin_token_here
LINKEDIN_ORGANIZATION_ID=your_org_id_here

# Unsplash (Free Images)
UNSPLASH_ACCESS_KEY=your_unsplash_key_here

# Google Analytics (Optional)
GOOGLE_ANALYTICS_ID=your_ga_tracking_id

# Project Info (Auto-filled during setup)
WEBSITE_URL=https://your-website.com
BUSINESS_NAME=Your Company Name
```

### Security Notes

1. **Never commit CREDENTIALS.env to git**
   - Add to `.gitignore`: `marketing-autopilot/CREDENTIALS.env`

2. **Use Environment Variables**
   - On production, set via environment instead of .env file
   - Example: `export TWITTER_API_KEY=...`

3. **Token Rotation**
   - Twitter: Regenerate tokens monthly
   - LinkedIn: Tokens expire after 1 year
   - Meta: Long-lived tokens last 60 days

4. **Access Levels**
   - Most platforms allow you to limit token permissions
   - Only grant permissions needed (e.g., post + read engagement)
   - Avoid giving admin or delete permissions

---

## Troubleshooting

### Meta API Issues

**Problem:** "Invalid access token"
- **Solution:** Token may have expired. Get a new long-lived token

**Problem:** "Page not found"
- **Solution:** Verify META_INSTAGRAM_ACCOUNT_ID is correct

### Twitter API Issues

**Problem:** "Elevated access required"
- **Solution:** Request elevated access in Developer Portal

**Problem:** "Rate limit exceeded"
- **Solution:** Wait 15 minutes, then retry

### LinkedIn API Issues

**Problem:** "Invalid OAuth token"
- **Solution:** Re-authenticate via OAuth flow

**Problem:** "Organization ID not found"
- **Solution:** Verify LINKEDIN_ORGANIZATION_ID is your company page ID, not your personal profile ID

### Unsplash Issues

**Problem:** "Rate limit exceeded (50/hour)"
- **Solution:** Switch to premium tier or wait until next hour

---

## Testing Credentials

### Quick Credential Test

```bash
# Test Meta API
curl -X GET "https://graph.instagram.com/me?fields=id,username&access_token=$META_PAGE_ACCESS_TOKEN"

# Test Twitter API
curl -H "Authorization: Bearer $TWITTER_ACCESS_TOKEN" \
  "https://api.twitter.com/2/tweets/search/recent?query=test"

# Test LinkedIn API
curl -H "Authorization: Bearer $LINKEDIN_ACCESS_TOKEN" \
  "https://api.linkedin.com/v2/me"

# Test Unsplash API
curl "https://api.unsplash.com/photos/random?client_id=$UNSPLASH_ACCESS_KEY"
```

If all return valid responses, credentials are working!

---

## Keeping Tokens Fresh

### Token Expiration Schedule

| Platform | Lifetime | Refresh | Action |
|----------|----------|---------|--------|
| Meta | 60 days | Auto | Monitor expiry date |
| Twitter | Permanent | Manual | Regenerate monthly for security |
| LinkedIn | 1 year | Manual | Refresh before expiry |
| Unsplash | Permanent | None | No action needed |

### Monitoring

- Set calendar reminders for token refresh dates
- Test credentials weekly in /autopilot-marketing status
- Update CREDENTIALS.env when tokens refresh

