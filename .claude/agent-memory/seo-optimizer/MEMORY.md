# SEO Optimizer Agent Memory

## Project Context
MemberBook is a multi-tenant SaaS for gyms, libraries, and tuition centers in India. Built with Nuxt 4, deployed to Cloudflare Workers. Target market: Indian small business owners.

## SEO Implementation Patterns

### Nuxt SEO Best Practices
- Always use `useSeoMeta()` and `useHead()` composables
- Never manually inject `<meta>` tags in templates
- All public pages need canonical URLs
- Auth/dashboard pages must have `robots: "noindex, nofollow"`
- Use `config.public.appUrl` for dynamic URLs

### Required SEO Elements Per Page
1. Title (50-60 chars, format: "Page Title - MemberBook")
2. Meta description (150-160 chars)
3. Canonical URL
4. Open Graph tags (title, description, image, url, type)
5. Twitter Card tags
6. Structured data (JSON-LD) where applicable

### Public vs Private Pages
- **Public** (indexed): /, /features, /about, /gym, /library, /tuition, /blog, /privacy, /terms
- **Private** (noindexed): /login, /register, /onboarding, /dashboard/*, /invite/*

### Structured Data Schemas Used
- SoftwareApplication (homepage, industry pages)
- Organization (homepage, about page)
- FAQPage (homepage)
- BreadcrumbList (all nested pages)
- Blog & BlogPosting (blog pages)

### Industry Landing Pages
Created three optimized pages targeting specific industries:
- /gym - "Gym Management Software India"
- /library - "Library Management Software India"
- /tuition - "Tuition Center Management Software India"

Each follows same structure: Hero → Problems → Features → Use Cases → CTA

### File Locations
- Global SEO config: `nuxt.config.ts`
- Sitemap: `@nuxtjs/sitemap` module
- Robots: `public/robots.txt`
- Web manifest: `public/site.webmanifest`

## Action Items Remaining
1. Design OG image (1200x630px PNG)
2. Generate favicon set (use realfavicongenerator.net)
3. Set NUXT_PUBLIC_APP_URL environment variable
4. Write actual blog posts
5. Submit sitemap to search engines

## Common Mistakes to Avoid
- Don't forget canonical URLs
- Don't use relative paths for og:image or og:url
- Don't manually add meta tags in template
- Don't forget noindex on auth pages
- Don't create generic titles/descriptions

## Keywords Focus
Primary: member management software, gym management software India, library management software India, tuition center management India

See SEO_IMPLEMENTATION_SUMMARY.md for complete details.
