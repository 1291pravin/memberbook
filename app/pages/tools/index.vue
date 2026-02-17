<template>
  <div>
    <!-- Hero -->
    <section class="bg-slate-50 py-16 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800">
          Free Tools for Small Business Owners
        </h1>
        <p class="mt-4 text-lg text-slate-600">
          Practical tools built for gym owners, tuition centers, and libraries in India — completely free, no sign-up required.
        </p>
      </div>
    </section>

    <!-- Live Tools Grid -->
    <section class="py-14 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl font-semibold text-slate-800 mb-8">
          Free Tools — Ready to Use
        </h2>
        <div class="grid md:grid-cols-3 gap-6">
          <NuxtLink
            v-for="tool in liveTools"
            :key="tool.href"
            :to="tool.href"
            class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <div class="text-4xl mb-4">{{ tool.emoji }}</div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">
              {{ tool.title }}
            </h3>
            <p class="text-sm text-slate-600 flex-1 mb-5">
              {{ tool.description }}
            </p>
            <div class="mt-auto">
              <span class="inline-flex items-center justify-center rounded-lg font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 text-sm w-full text-center">
                {{ tool.cta }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Coming Soon Section -->
    <section class="py-12 px-4 bg-slate-50">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl font-semibold text-slate-800 mb-2">
          More Tools Coming Soon
        </h2>
        <p class="text-slate-600 mb-8">
          We're building more tools to help you run your business better.
        </p>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="tool in comingSoonTools"
            :key="tool.title"
            class="bg-white border border-slate-200 rounded-xl p-6 opacity-60 flex flex-col"
          >
            <div class="text-4xl mb-3">{{ tool.emoji }}</div>
            <div class="flex items-center gap-2 mb-2">
              <h3 class="text-base font-semibold text-slate-800">
                {{ tool.title }}
              </h3>
            </div>
            <div class="mt-auto pt-3">
              <AppBadge color="gray">
                Coming Soon
              </AppBadge>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="py-16 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl font-semibold text-slate-800 mb-3">
          Want us to build a specific tool?
        </h2>
        <p class="text-slate-600 mb-8">
          MemberBook helps you manage all of this automatically — members, payments, renewals, and more.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:hello@memberbook.app">
            <AppButton variant="secondary" size="lg">
              Request a Tool
            </AppButton>
          </a>
          <NuxtLink to="/register">
            <AppButton variant="primary" size="lg">
              Try MemberBook Free
            </AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

const liveTools = [
  {
    emoji: "💬",
    title: "WhatsApp Gym Renewal Reminder Generator",
    description: "Generate a personalized WhatsApp message for gym members whose membership is expiring. Supports English & Hinglish.",
    href: "/tools/whatsapp-gym-renewal-reminder",
    cta: "Generate Message →",
  },
  {
    emoji: "🧾",
    title: "Tuition Fee Receipt Generator",
    description: "Create a professional fee receipt for your coaching center or tuition class instantly. Download as PDF for free.",
    href: "/tools/tuition-fee-receipt-generator",
    cta: "Generate Receipt →",
  },
  {
    emoji: "📊",
    title: "Gym Membership Revenue Calculator",
    description: "Calculate your gym's monthly and annual revenue across different membership plans. Includes default rate analysis.",
    href: "/tools/gym-membership-revenue-calculator",
    cta: "Calculate Revenue →",
  },
];

const comingSoonTools = [
  { emoji: "📚", title: "Library Membership Fee Structure Planner" },
  { emoji: "🧾", title: "GST Invoice Generator for Coaching Institutes" },
  { emoji: "📉", title: "Gym Churn Rate & Retention Calculator" },
  { emoji: "💰", title: "Tuition Fee Collection Status Tracker" },
  { emoji: "🔧", title: "Gym Subscription Plan Price Optimizer" },
];

useSeoMeta({
  title: "Free Tools for Gym Owners, Tuition Centers & Libraries — MemberBook",
  description: "Free tools to manage your gym, tuition center, or library. Generate WhatsApp renewal reminders, fee receipts, and calculate gym revenue. Made for India.",
  ogTitle: "Free Tools for Gym Owners, Tuition Centers & Libraries — MemberBook",
  ogDescription: "Free tools to manage your gym, tuition center, or library. Generate WhatsApp renewal reminders, fee receipts, and calculate gym revenue. Made for India.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/tools`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Free Tools for Gym Owners, Tuition Centers & Libraries — MemberBook",
  twitterDescription: "Free tools to manage your gym, tuition center, or library. Generate WhatsApp renewal reminders, fee receipts, and calculate gym revenue. Made for India.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/tools` },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Free Tools for Gym Owners, Tuition Centers & Libraries",
        "url": `${appUrl}/tools`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "WhatsApp Gym Renewal Reminder Generator",
            "url": `${appUrl}/tools/whatsapp-gym-renewal-reminder`,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Tuition Fee Receipt Generator",
            "url": `${appUrl}/tools/tuition-fee-receipt-generator`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Gym Membership Revenue Calculator",
            "url": `${appUrl}/tools/gym-membership-revenue-calculator`,
          },
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
            "name": "Free Tools",
            "item": `${appUrl}/tools`,
          },
        ],
      }),
    },
  ],
});
</script>
