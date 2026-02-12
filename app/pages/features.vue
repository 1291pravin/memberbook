<template>
  <div>
    <!-- Hero -->
    <section class="py-12 px-4 text-center bg-gradient-to-b from-primary-50 to-white">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800">
          Everything you need to manage your members
        </h1>
        <p class="mt-4 text-lg text-slate-600">
          Powerful features designed specifically for Indian gyms, libraries, and tuition centers.
        </p>
      </div>
    </section>

    <!-- Core Features -->
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="grid md:grid-cols-2 gap-12">
          <div v-for="feature in coreFeatures" :key="feature.title" class="flex gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">{{ feature.emoji }}</span>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-slate-800 mb-2">{{ feature.title }}</h2>
              <p class="text-slate-600 leading-relaxed">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Advanced Features -->
    <section class="py-16 px-4 bg-slate-50">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Advanced Capabilities</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="feature in advancedFeatures" :key="feature.title" class="bg-white rounded-xl p-6 shadow-sm">
            <div class="text-3xl mb-4">{{ feature.emoji }}</div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-slate-600">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Built for India -->
    <section class="py-16 px-4">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Built for India</h2>
        <p class="text-lg text-slate-600 mb-8">
          We understand the unique needs of Indian small businesses.
        </p>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="item in indiaFeatures" :key="item.title" class="text-center">
            <div class="text-4xl mb-3">{{ item.emoji }}</div>
            <h3 class="font-semibold text-slate-800 mb-1">{{ item.title }}</h3>
            <p class="text-sm text-slate-600">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 text-center bg-primary-50">
      <div class="max-w-xl mx-auto">
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Ready to get started?</h2>
        <p class="text-lg text-slate-600 mb-8">
          Join hundreds of businesses already using MemberBook.
        </p>
        <NuxtLink to="/register">
          <AppButton size="lg">Start Free Today</AppButton>
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
  title: "Features - MemberBook Member Management Software",
  description: "Explore MemberBook's powerful features: member management, flexible subscription plans, payment tracking, WhatsApp reminders, check-in/out, analytics and more. Built for Indian businesses.",
  ogTitle: "MemberBook Features - Complete Member Management Solution",
  ogDescription: "Track members, manage subscriptions, record payments, send WhatsApp reminders. Everything you need in one simple platform.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/features`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "MemberBook Features - All-in-One Member Management",
  twitterDescription: "Member tracking, subscriptions, payments, WhatsApp reminders and more. Built for gyms, libraries & tuition centers.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/features` },
  ],
});

const coreFeatures = [
  {
    emoji: "👥",
    title: "Complete Member Management",
    description: "Store all member details including name, phone, email, address, and photo. Track active and inactive memberships. View complete history at a glance.",
  },
  {
    emoji: "📋",
    title: "Flexible Subscription Plans",
    description: "Create unlimited plans with custom durations and pricing. Monthly, quarterly, yearly, or custom periods. Perfect for any business model.",
  },
  {
    emoji: "💰",
    title: "Payment Tracking",
    description: "Record all payments with method (Cash, UPI, Card). Track pending dues. View revenue reports by day, week, or month. Never miss a payment.",
  },
  {
    emoji: "🔔",
    title: "WhatsApp Reminders",
    description: "Pre-filled WhatsApp messages for payment reminders and renewals. One-click send via WhatsApp Web. Saves hours of manual messaging.",
  },
  {
    emoji: "📊",
    title: "Dashboard & Analytics",
    description: "See active members, revenue trends, expiring subscriptions at a glance. Beautiful charts for member growth, payment methods, plan popularity.",
  },
  {
    emoji: "✅",
    title: "Attendance Tracking",
    description: "Quick check-in and check-out for members. View daily attendance. Track attendance history. Perfect for gyms and libraries.",
  },
  {
    emoji: "📞",
    title: "Inquiry Management",
    description: "Track potential customers from first contact to conversion. Manage inquiry status (New, Contacted, Converted, Lost). Calculate conversion rates.",
  },
  {
    emoji: "👨‍💼",
    title: "Multi-Staff Access",
    description: "Add staff members to help manage your business. Role-based access (Owner, Staff). Collaborate seamlessly with your team.",
  },
];

const advancedFeatures = [
  {
    emoji: "🎯",
    title: "Action-Required Filter",
    description: "Quickly find members who need attention: pending payments, expiring soon, inactive members.",
  },
  {
    emoji: "🔍",
    title: "Smart Search",
    description: "Find members instantly by name, phone, or email. Filter by plan, status, or action required.",
  },
  {
    emoji: "📅",
    title: "Subscription History",
    description: "View complete subscription timeline for each member. Track renewals and payment patterns.",
  },
  {
    emoji: "💳",
    title: "Payment Methods",
    description: "Support for Cash, UPI, Card, and Bank Transfer. Track which methods are most popular.",
  },
  {
    emoji: "📱",
    title: "Mobile-First Design",
    description: "Works perfectly on phones and tablets. Manage your business on the go.",
  },
  {
    emoji: "🚀",
    title: "Fast & Reliable",
    description: "Built on modern technology for speed and reliability. Works even with poor internet.",
  },
];

const indiaFeatures = [
  {
    emoji: "₹",
    title: "Indian Currency",
    description: "All amounts in Rupees. No conversion needed.",
  },
  {
    emoji: "📱",
    title: "WhatsApp Integration",
    description: "Send reminders via WhatsApp, India's most popular messaging app.",
  },
  {
    emoji: "🇮🇳",
    title: "Local Support",
    description: "Built by Indians, for Indian businesses. We understand your needs.",
  },
];
</script>
