// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

const releaseId = process.env.NUXT_PUBLIC_RELEASE_ID || `build-${Date.now()}`;

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/hints", "@nuxthub/core", "nuxt-auth-utils", "@nuxtjs/sitemap", "nuxt-gtag"],

  // Global SEO defaults
  app: {
    head: {
      htmlAttrs: {
        lang: "en-IN",
      },
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "MemberBook - Gym, Library and Coaching Fee Reminders, Set Up for You",
      meta: [
        { name: "description", content: "Free forever software for Indian gyms, libraries and coaching centres. Send us your register and we set it up for you: members, plans, due dates and WhatsApp reminders with your UPI pay link." },
        { name: "format-detection", content: "telephone=no" },
        // Open Graph defaults
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "MemberBook" },
        { property: "og:locale", content: "en_IN" },
        // Twitter Card defaults
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@memberbook" },
        // Indian market targeting
        { name: "geo.region", content: "IN" },
        { name: "geo.placename", content: "India" },
        // Meta business domain verification (WhatsApp Cloud API)
        { name: "facebook-domain-verification", content: "dysv658f5r5hg964g2i8yh9fq7j0pj" },
      ],
      link: [
        // Favicons
        { rel: "icon", type: "image/svg+xml", href: "/brand/memberbook-mark.svg" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        // Brand fonts: Plus Jakarta Sans (UI and headlines), Instrument Serif (italic accents)
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
      ],
    },
  },

  // Canonical site URL for the sitemap and SEO modules (also set via NUXT_SITE_URL).
  site: {
    url: "https://memberbook.in",
    name: "MemberBook",
  },

  // Sitemap configuration
  sitemap: {
    exclude: [
      "/admin",
      "/admin/**",
      "/dashboard",
      "/dashboard/**",
      "/onboarding",
      "/invite/**",
      "/login",
      "/register",
      "/pay/**",
      "/checkin/**",
    ],
    defaults: {
      changefreq: "weekly",
      priority: 0.7,
    },
    urls: [
      { loc: "/", changefreq: "daily", priority: 1.0 },
      { loc: "/features", changefreq: "weekly", priority: 0.9 },
      { loc: "/about", changefreq: "monthly", priority: 0.8 },
      { loc: "/contact", changefreq: "monthly", priority: 0.8 },
      { loc: "/gym", changefreq: "weekly", priority: 0.9 },
      { loc: "/library", changefreq: "weekly", priority: 0.9 },
      { loc: "/tuition", changefreq: "weekly", priority: 0.9 },
      { loc: "/privacy", changefreq: "monthly", priority: 0.5 },
      { loc: "/terms", changefreq: "monthly", priority: 0.5 },
      { loc: "/blog", changefreq: "weekly", priority: 0.8 },
      { loc: "/blog/how-to-manage-gym-members", changefreq: "monthly", priority: 0.7 },
      { loc: "/blog/reduce-membership-payment-defaults", changefreq: "monthly", priority: 0.7 },
      { loc: "/blog/gym-owner-income-india", changefreq: "monthly", priority: 0.8 },
      { loc: "/blog/gym-bill-receipt-generator-india", changefreq: "monthly", priority: 0.8 },
      { loc: "/tools", changefreq: "weekly", priority: 0.9 },
      { loc: "/tools/whatsapp-gym-renewal-reminder", changefreq: "monthly", priority: 0.8 },
      { loc: "/tools/tuition-fee-receipt-generator", changefreq: "monthly", priority: 0.8 },
      { loc: "/tools/gym-membership-revenue-calculator", changefreq: "monthly", priority: 0.8 },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: false,
    },
  },
  css: ["~/assets/css/main.css"],
  nitro: {
    preset: "cloudflare-module",
    experimental: { tasks: true },
    // 03:30 UTC = 09:00 IST. The same cron must be listed in wrangler.jsonc "triggers".
    scheduledTasks: {
      "30 3 * * *": ["reminders:daily", "addons:billing", "admin:digest"],
    },
  },
  hub: {
    hosting: "cloudflare",
    db: "sqlite",
    // Member photos. In production use the Cloudflare R2 binding "BLOB";
    // in dev fall back to the local filesystem so `npm run dev` works without R2.
    blob: process.env.NODE_ENV === "production"
      ? { driver: "cloudflare-r2", binding: "BLOB" }
      : { driver: "fs", dir: ".data/hub/blob" },
  },
  runtimeConfig: {
    adminApiToken: "",
    adminPasswords: "",
    // Meta WhatsApp Cloud API for automatic fee reminders. Off until
    // NUXT_WHATSAPP_CLOUD_ENABLED=true and the token and phone number id are set
    // (NUXT_WHATSAPP_CLOUD_ACCESS_TOKEN, NUXT_WHATSAPP_CLOUD_PHONE_NUMBER_ID, ...).
    // Setup steps: docs/whatsapp-cloud-api-setup.md
    // Email for new WhatsApp inbox messages (must be a verified Email Routing
    // destination; sent through the ALERT_EMAIL send_email binding).
    inboxAlertEmail: "",
    // MemberBook's own UPI ID for add-on bills (NUXT_BILLING_UPI_ID). Until it is
    // set, owners with a bill see "we'll send payment details on WhatsApp".
    billingUpiId: "",
    billingPayeeName: "MemberBook",
    whatsappCloud: {
      enabled: false,
      accessToken: "",
      phoneNumberId: "",
      appSecret: "",
      webhookVerifyToken: "",
      templateName: "fee_reminder",
      templateLanguage: "en",
      apiVersion: "v22.0",
    },
    session: {
      maxAge: 60 * 60 * 24 * 365, // 1 year — effectively "no timeout"
    },
    oauth: {
      google: {
        clientId: "",
        clientSecret: "",
      },
    },
    public: {
      appUrl: "",
      releaseId,
      // Customer support channels shown in the app and on the website.
      // Override with NUXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER, NUXT_PUBLIC_SUPPORT_EMAIL
      // and NUXT_PUBLIC_SUPPORT_HOURS. Set the email to an empty string to hide it.
      supportWhatsappNumber: "919137849812",
      // WhatsApp contact links stay hidden until the support number is connected to the
      // Cloud API (Meta business verification). Set NUXT_PUBLIC_SUPPORT_WHATSAPP_LIVE=true then.
      supportWhatsappLive: false,
      supportEmail: "support@memberbook.in",
      supportHours: "Mon to Sat, 10 AM to 7 PM IST",
    },
  },
});
