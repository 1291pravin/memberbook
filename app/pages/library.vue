<template>
  <div>
    <!-- Hero -->
    <section class="py-16 px-4 text-center bg-gradient-to-b from-primary-50 to-white">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800 sm:text-5xl">
          Library Management Software
          <span class="text-primary-600">for India</span>
        </h1>
        <p class="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Simple member and subscription management for lending libraries and reading rooms. Track members, collect fees, and manage memberships effortlessly.
        </p>
        <div class="mt-8 flex gap-3 justify-center">
          <NuxtLink to="/register">
            <AppButton size="lg">Start Free Trial</AppButton>
          </NuxtLink>
          <NuxtLink to="/features">
            <AppButton size="lg" variant="secondary">View Features</AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Problems We Solve -->
    <section class="py-16 px-4 bg-slate-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Common library management challenges</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div v-for="problem in problems" :key="problem.title" class="bg-white rounded-xl p-6 border-l-4 border-red-500">
            <h3 class="font-semibold text-slate-800 mb-2">❌ {{ problem.title }}</h3>
            <p class="text-sm text-slate-600">{{ problem.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features for Libraries -->
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Everything your library needs</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="feature in libraryFeatures" :key="feature.title" class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">{{ feature.emoji }}</span>
            </div>
            <h3 class="font-semibold text-slate-800 mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-slate-600">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="py-16 px-4 bg-primary-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-4">Perfect for all types of libraries</h2>
        <p class="text-center text-slate-600 mb-12">From small reading rooms to large lending libraries.</p>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="type in libraryTypes" :key="type.name" class="bg-white rounded-xl p-6 text-center">
            <div class="text-4xl mb-3">{{ type.emoji }}</div>
            <h3 class="font-semibold text-slate-800 mb-2">{{ type.name }}</h3>
            <p class="text-xs text-slate-600">{{ type.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="py-16 px-4">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Why library owners love MemberBook</h2>
        <div class="space-y-6">
          <div v-for="benefit in benefits" :key="benefit.title" class="flex gap-4 items-start">
            <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-green-600 text-xl">✓</span>
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">{{ benefit.title }}</h3>
              <p class="text-slate-600">{{ benefit.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 text-center bg-slate-800 text-white">
      <div class="max-w-xl mx-auto">
        <h2 class="text-3xl font-bold mb-4">Ready to modernize your library?</h2>
        <p class="text-lg text-slate-400 mb-8">
          Join library owners across India using MemberBook. Free to start.
        </p>
        <NuxtLink to="/register">
          <AppButton size="lg" class="bg-white text-slate-800 hover:bg-slate-100">Start Free Trial</AppButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

useSeoMeta({
  title: "Library Management Software India - MemberBook",
  description: "Simple library management software for Indian lending libraries and reading rooms. Track members, manage subscriptions, collect fees. Free to start.",
  ogTitle: "Library Management Software Made Simple - MemberBook",
  ogDescription: "Manage library members, subscriptions, and payments in one simple platform. Built for Indian libraries.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/library`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Library Management Software for India",
  twitterDescription: "Track members, collect fees, send WhatsApp reminders. Simple library management built for India.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/library` },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "MemberBook Library Management Software",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Library Management Software",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
        "description": "Simple library management software for Indian libraries. Track members, manage subscriptions, and collect fees.",
        "featureList": [
          "Member management",
          "Subscription tracking",
          "Payment collection",
          "WhatsApp reminders",
          "Check-in tracking",
          "Analytics dashboard",
        ],
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": appUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Library Management Software",
            "item": `${appUrl}/library`,
          },
        ],
      }),
    },
  ],
});

const problems = [
  { title: "Manual register tracking", description: "Paper registers get messy and you can't search member history easily." },
  { title: "Fee collection hassle", description: "Tracking who paid, who's pending, and sending reminders manually is tedious." },
  { title: "Membership renewal chaos", description: "Hard to know whose membership is expiring and needs renewal." },
  { title: "No digital records", description: "Everything in notebooks makes it hard to generate reports or see trends." },
];

const libraryFeatures = [
  { emoji: "👥", title: "Member Records", description: "Digital database of all library members with contact info and photos." },
  { emoji: "📅", title: "Membership Plans", description: "Monthly, quarterly, or yearly memberships with flexible pricing." },
  { emoji: "💳", title: "Fee Collection", description: "Track subscription fees and security deposits easily." },
  { emoji: "📱", title: "WhatsApp Alerts", description: "Send renewal reminders and payment notifications via WhatsApp." },
  { emoji: "✅", title: "Visit Tracking", description: "Quick check-in to track library visits and member engagement." },
  { emoji: "📊", title: "Reports", description: "See active members, revenue, and membership trends instantly." },
];

const libraryTypes = [
  { emoji: "📚", name: "Lending Libraries", description: "For libraries that lend books to members" },
  { emoji: "📖", name: "Reading Rooms", description: "For subscription-based reading spaces" },
  { emoji: "🎓", name: "Study Centers", description: "For libraries with study hall facilities" },
];

const benefits = [
  { title: "Save Hours Weekly", description: "No more manual register entries or WhatsApp message typing. Everything is automated." },
  { title: "Never Miss Renewals", description: "Automatic alerts for expiring memberships so you can follow up on time." },
  { title: "Professional Image", description: "Digital receipts and organized records make your library look more professional." },
  { title: "Grow Your Library", description: "Analytics help you understand member preferences and grow your business." },
];
</script>
