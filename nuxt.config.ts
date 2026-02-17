// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

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
      title: "MemberBook - Simple Member Management for Gyms, Libraries & Tuition Centers",
      meta: [
        { name: "description", content: "Manage memberships, subscriptions and payments for your gym, library or tuition center. Built for Indian small businesses. Free to start." },
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
      ],
      link: [
        // Favicons
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        // Performance optimizations
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      ],
    },
  },

  // Sitemap configuration
  sitemap: {
    exclude: [
      "/dashboard/**",
      "/onboarding",
      "/invite/**",
      "/login",
      "/register",
    ],
    defaults: {
      changefreq: "weekly",
      priority: 0.7,
    },
    urls: [
      { loc: "/", changefreq: "daily", priority: 1.0 },
      { loc: "/features", changefreq: "weekly", priority: 0.9 },
      { loc: "/about", changefreq: "monthly", priority: 0.8 },
      { loc: "/gym", changefreq: "weekly", priority: 0.9 },
      { loc: "/library", changefreq: "weekly", priority: 0.9 },
      { loc: "/tuition", changefreq: "weekly", priority: 0.9 },
      { loc: "/privacy", changefreq: "monthly", priority: 0.5 },
      { loc: "/terms", changefreq: "monthly", priority: 0.5 },
      { loc: "/blog", changefreq: "weekly", priority: 0.8 },
      { loc: "/blog/how-to-manage-gym-members", changefreq: "monthly", priority: 0.7 },
      { loc: "/blog/reduce-membership-payment-defaults", changefreq: "monthly", priority: 0.7 },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: false,
    },
  },
  css: ["~/assets/css/main.css"],
  hub: {
    db: "sqlite",
    cache: true,
  },
  runtimeConfig: {
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
      appUrl: ""
    },
  },
});
