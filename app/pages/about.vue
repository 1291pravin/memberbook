<template>
  <div>
    <!-- Hero -->
    <section class="py-16 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800">
          About MemberBook
        </h1>
        <p class="mt-4 text-xl text-slate-600">
          Simple member management software built for Indian small businesses.
        </p>
      </div>
    </section>

    <!-- Our Story -->
    <section class="py-12 px-4">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-slate-800 mb-6">Our Story</h2>
        <div class="prose prose-slate max-w-none">
          <p class="text-lg text-slate-600 leading-relaxed mb-4">
            MemberBook was born from a simple observation: small business owners in India spend too much time managing spreadsheets, WhatsApp groups, and paper registers instead of focusing on growing their business.
          </p>
          <p class="text-lg text-slate-600 leading-relaxed mb-4">
            We saw gym owners juggling multiple Excel files, library managers losing track of memberships, and tuition center owners manually sending payment reminders. There had to be a better way.
          </p>
          <p class="text-lg text-slate-600 leading-relaxed">
            So we built MemberBook - a simple, affordable, and powerful member management platform designed specifically for the needs of Indian small businesses.
          </p>
        </div>
      </div>
    </section>

    <!-- Our Mission -->
    <section class="py-12 px-4 bg-primary-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-slate-800 mb-6">Our Mission</h2>
        <div class="text-lg text-slate-600 leading-relaxed">
          <p class="mb-4">
            To empower every small business owner in India with simple, affordable tools to manage their members and grow their business.
          </p>
          <p>
            We believe technology should make your life easier, not more complicated. That's why MemberBook is designed to be intuitive, mobile-friendly, and built for how Indian businesses actually work.
          </p>
        </div>
      </div>
    </section>

    <!-- Why MemberBook -->
    <section class="py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-slate-800 mb-8 text-center">Why Choose MemberBook?</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div v-for="reason in reasons" :key="reason.title" class="bg-white rounded-xl p-6 border border-slate-200">
            <div class="text-3xl mb-3">{{ reason.emoji }}</div>
            <h3 class="text-xl font-semibold text-slate-800 mb-2">{{ reason.title }}</h3>
            <p class="text-slate-600">{{ reason.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Who We Serve -->
    <section class="py-12 px-4 bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl font-bold text-slate-800 mb-8 text-center">Who We Serve</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="industry in industries" :key="industry.name" class="text-center">
            <div class="text-5xl mb-3">{{ industry.emoji }}</div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">{{ industry.name }}</h3>
            <p class="text-sm text-slate-600">{{ industry.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 text-center">
      <div class="max-w-xl mx-auto">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Join us today</h2>
        <p class="text-lg text-slate-600 mb-8">
          Start managing your members the simple way. No credit card required.
        </p>
        <NuxtLink to="/register">
          <AppButton size="lg">Get Started Free</AppButton>
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
  title: "About Us - MemberBook Member Management Software",
  description: "Learn about MemberBook, a simple member management platform built for Indian gyms, libraries, and tuition centers. Our mission is to help small businesses grow.",
  ogTitle: "About MemberBook - Built for Indian Small Businesses",
  ogDescription: "Simple, affordable member management software designed specifically for gyms, libraries, and tuition centers in India.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/about`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "About MemberBook - Member Management Made Simple",
  twitterDescription: "Learn about our mission to empower Indian small businesses with simple member management tools.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/about` },
  ],
  script: [
    // Organization Schema
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "MemberBook",
        "url": appUrl,
        "logo": `${appUrl}/logo.png`,
        "description": "Simple member management software for Indian small businesses including gyms, libraries, and tuition centers",
        "foundingDate": "2025",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN",
        },
        "areaServed": {
          "@type": "Country",
          "name": "India",
        },
        "sameAs": [
          "https://twitter.com/memberbook",
          "https://facebook.com/memberbook",
          "https://linkedin.com/company/memberbook",
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Support",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi"],
        },
      }),
    },
  ],
});

const reasons = [
  {
    emoji: "🇮🇳",
    title: "Built for India",
    description: "Designed specifically for Indian businesses with features like WhatsApp integration, INR currency, and local payment methods.",
  },
  {
    emoji: "💰",
    title: "Affordable",
    description: "Free to start with transparent pricing. No hidden fees. Pay only for what you use.",
  },
  {
    emoji: "📱",
    title: "Mobile-First",
    description: "Works perfectly on smartphones and tablets. Manage your business from anywhere.",
  },
  {
    emoji: "⚡",
    title: "Simple & Fast",
    description: "No complicated setup. Start managing members in minutes, not hours.",
  },
  {
    emoji: "🔒",
    title: "Secure",
    description: "Your data is encrypted and securely stored. We take privacy seriously.",
  },
  {
    emoji: "🤝",
    title: "Local Support",
    description: "Customer support in English and Hindi. We understand your needs.",
  },
];

const industries = [
  {
    emoji: "🏋️",
    name: "Gyms & Fitness",
    description: "Perfect for gyms, fitness centers, yoga studios, and personal trainers",
  },
  {
    emoji: "📚",
    name: "Libraries",
    description: "Ideal for lending libraries and reading rooms",
  },
  {
    emoji: "🎓",
    name: "Tuition Centers",
    description: "Great for coaching classes, tuition centers, and training institutes",
  },
];
</script>
