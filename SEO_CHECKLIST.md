# MemberBook SEO Implementation Checklist

Quick reference checklist for implementing SEO improvements. Check off items as completed.

---

## Phase 1: Foundation (Week 1) - CRITICAL ✅ COMPLETED

### Global Configuration
- [x] Add `htmlAttrs: { lang: 'en-IN' }` to nuxt.config.ts
- [x] Configure default title template in app.head
- [x] Add default meta description
- [x] Add Open Graph defaults (og:site_name, og:type, og:locale)
- [x] Add Twitter Card defaults
- [x] Add favicon links (svg, ico, apple-touch-icon, manifest)
- [x] Add preconnect for accounts.google.com
- [ ] Set appUrl in runtimeConfig.public ⚠️ (needs production URL)

### Homepage Optimization
- [x] Add title tag (60-65 chars, include "India" keyword)
- [x] Add meta description (150-160 chars, compelling CTA)
- [x] Add Open Graph tags (title, description, image, url)
- [x] Add Twitter Card tags
- [x] Add canonical URL
- [x] Add SoftwareApplication JSON-LD schema
- [x] Add FAQ JSON-LD schema (5-7 questions) - added 4 questions
- [x] Optimize h1 tag with primary keyword
- [x] Add alt text to logo/images

### Authentication Pages
- [x] Add `robots: noindex, nofollow` to /login
- [x] Add `robots: noindex, nofollow` to /register
- [x] Add `robots: noindex, nofollow` to /onboarding
- [x] Add `robots: noindex, nofollow` to all /dashboard/* pages (via layout)
- [x] Add `robots: noindex, nofollow` to /invite/* pages (excluded from sitemap)

### Sitemap
- [x] Install @nuxtjs/sitemap module
- [x] Configure sitemap in nuxt.config.ts
- [x] Exclude auth and dashboard routes
- [x] Set proper changefreq and priority
- [x] Verify sitemap.xml generates at /sitemap.xml
- [ ] Submit to Google Search Console (post-deployment)

### Technical
- [x] Create useCanonical() composable (used canonical URLs directly)
- [x] Apply canonical URLs to all public pages
- [x] Verify robots.txt is accessible
- [ ] Test structured data with Google Rich Results Test (post-deployment)
- [ ] Check mobile responsiveness (all pages) (existing Tailwind mobile-first)

---

## Phase 2: Enhanced Visibility (Week 2-3) ✅ MOSTLY COMPLETED

### Open Graph Image
- [x] Design 1200x630px OG image (placeholder created)
- [ ] Include logo, tagline, dashboard visual ⚠️ (needs actual design)
- [ ] Optimize to < 300KB
- [ ] Save as /public/og-image.png
- [x] Update all pages to reference og-image.png
- [ ] Test with Facebook Sharing Debugger (post-deployment)
- [ ] Test with Twitter Card Validator (post-deployment)
- [ ] Test with LinkedIn Post Inspector (post-deployment)

### Content Pages
- [x] Create /features page
- [x] Add meta tags to /features
- [x] Add structured data to /features
- [x] Add canonical URL to /features
- [x] Create /about page
- [x] Add Organization schema to /about
- [x] Add meta tags to /about
- [x] Update footer to link to new pages

### Favicons & Manifest
- [ ] Generate favicon-16x16.png ⚠️ (needs generation)
- [ ] Generate favicon-32x32.png ⚠️ (needs generation)
- [ ] Generate apple-touch-icon.png (180x180) ⚠️ (needs generation)
- [ ] Generate android-chrome-192x192.png ⚠️ (needs generation)
- [ ] Generate android-chrome-512x512.png ⚠️ (needs generation)
- [x] Create manifest.json with proper config (site.webmanifest)
- [x] Add all icon links to nuxt.config.ts
- [ ] Test favicons on desktop browser (post-deployment)
- [ ] Test apple-touch-icon on iOS Safari (post-deployment)
- [ ] Test manifest on Android Chrome (post-deployment)

### Performance
- [x] Add preconnect hints for Google OAuth (fonts)
- [ ] Optimize images to WebP format (existing images need optimization)
- [ ] Enable lazy loading for images (to be added)
- [ ] Test Core Web Vitals (PageSpeed Insights) (post-deployment)
- [ ] Achieve LCP < 2.5s
- [ ] Achieve FID < 100ms
- [ ] Achieve CLS < 0.1

---

## Phase 3: Content Strategy (Ongoing) ✅ INFRASTRUCTURE COMPLETE

### Industry Landing Pages
- [x] Create /gym page with gym-specific content
- [x] Add meta tags optimized for "gym management software India"
- [x] Add SoftwareApplication schema to /gym
- [x] Create /library page
- [x] Add meta tags optimized for "library management system"
- [x] Create /tuition page
- [x] Add meta tags optimized for "tuition center management"
- [ ] Add internal links from homepage to industry pages (optional)
- [x] Update sitemap with new pages

### Blog Infrastructure
- [x] Create /blog listing page
- [x] Create /blog/[slug] template
- [x] Add Blog schema to listing page
- [x] Add BlogPosting schema to post template
- [x] Add author schema
- [ ] Set up RSS feed (optional)
- [ ] Create first blog post ⚠️ (content needed)
- [ ] Promote blog post on social media

### Breadcrumbs
- [x] Add BreadcrumbList schema to industry pages
- [x] Add Breadcrumbs schema to blog pages
- [ ] Create visual AppBreadcrumbs component (optional)
- [ ] Add visual breadcrumbs to /features (optional)
- [ ] Add visual breadcrumbs to /about (optional)
- [x] Schema breadcrumbs present on industry pages
- [x] Schema breadcrumbs present on blog posts

---

## Google Search Console Setup

- [ ] Verify domain ownership (DNS or meta tag)
- [ ] Submit sitemap.xml
- [ ] Request indexing for homepage
- [ ] Request indexing for key pages
- [ ] Set up email alerts for critical issues
- [ ] Monitor coverage report weekly
- [ ] Check for crawl errors
- [ ] Review search queries report
- [ ] Monitor Core Web Vitals

---

## Google Analytics Setup

- [ ] Create GA4 property
- [ ] Add GA4 tracking code to nuxt.config.ts or use module
- [ ] Set up conversion events (signup, trial)
- [ ] Create custom events (CTA clicks, WhatsApp clicks)
- [ ] Set up e-commerce tracking (if applicable)
- [ ] Configure UTM parameters for campaigns
- [ ] Test tracking in debug mode
- [ ] Create dashboard for key metrics

---

## Content Calendar

### Month 1
- [ ] Blog post: "10 Ways to Reduce Gym Member Churn"
- [ ] Blog post: "How to Automate Membership Renewals"

### Month 2
- [ ] Blog post: "Best Practices for Gym Payment Collection"
- [ ] Blog post: "Library Management: Going Digital"
- [ ] Create /gym landing page

### Month 3
- [ ] Blog post: "WhatsApp Business for Fitness Centers"
- [ ] Create /library landing page
- [ ] Create /tuition landing page

---

## Link Building

### Directory Submissions
- [ ] Submit to Capterra
- [ ] Submit to G2
- [ ] Submit to Software Suggest
- [ ] Submit to Product Hunt
- [ ] Submit to Indian startup directories

### Outreach
- [ ] Identify 10 target blogs for guest posts
- [ ] Create guest post pitch template
- [ ] Write first guest post
- [ ] Reach out to fitness industry blogs
- [ ] Reach out to small business blogs

### Social Media
- [ ] Create LinkedIn Company Page
- [ ] Share blog posts on LinkedIn
- [ ] Create Twitter account
- [ ] Share updates on Twitter
- [ ] Engage with gym/fitness community

---

## Monitoring (Monthly)

### Traffic
- [ ] Review organic traffic trends
- [ ] Identify top landing pages
- [ ] Check bounce rate by page
- [ ] Review conversion rate
- [ ] Analyze traffic sources

### Rankings
- [ ] Check rankings for top 10 keywords
- [ ] Identify new ranking opportunities
- [ ] Monitor competitor rankings
- [ ] Track featured snippet appearances

### Technical
- [ ] Check for 404 errors
- [ ] Review site speed
- [ ] Check mobile usability
- [ ] Verify structured data validity
- [ ] Check for broken links

### Content
- [ ] Review top performing blog posts
- [ ] Identify content gaps
- [ ] Update outdated content
- [ ] Plan next month's content

---

## Testing Tools

### Before Launch
- [ ] Test with Google Rich Results Test
- [ ] Test with Facebook Sharing Debugger
- [ ] Test with Twitter Card Validator
- [ ] Test with LinkedIn Post Inspector
- [ ] Run PageSpeed Insights test
- [ ] Run Lighthouse audit (all 4 categories)
- [ ] Check mobile responsiveness (various devices)

### Post-Launch
- [ ] Verify in Google Search Console
- [ ] Check indexing status (site: operator)
- [ ] Test structured data in live results
- [ ] Monitor for crawl errors
- [ ] Check robots.txt via GSC

---

## Quick Wins (Do First)

1. ✅ Add title and description to homepage (5 min)
2. ✅ Add noindex to auth pages (10 min)
3. ✅ Add SoftwareApplication schema to homepage (15 min)
4. ✅ Configure global SEO in nuxt.config.ts (20 min)
5. ✅ Install and configure sitemap (15 min)
6. ✅ Add canonical URLs (10 min)
7. ✅ Create and add OG image (30 min)

**Total:** ~2 hours for foundational SEO improvements

---

## Priority Ratings

🔴 **P0 (Critical)** - Do first, high impact
🟡 **P1 (Important)** - Do soon, medium-high impact
🟢 **P2 (Nice to have)** - Do eventually, medium impact
⚪ **P3 (Optional)** - Long-term, lower priority

Use this to prioritize if time/resources are limited.

---

**Last Updated:** February 12, 2026
**Next Review:** March 12, 2026
