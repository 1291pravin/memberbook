<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden py-16 px-4 text-center">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
      <div class="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-100/40 blur-3xl" />
      <div class="relative max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800 leading-tight">
          Everything you need to manage your members
        </h1>
        <p class="mt-4 text-lg text-slate-600 leading-relaxed">
          Powerful features designed specifically for Indian gyms, libraries, and tuition centers.
        </p>
      </div>
    </section>

    <!-- Core Features -->
    <section class="py-20 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="grid md:grid-cols-2 gap-10">
          <div
            v-for="feature in coreFeatures"
            :key="feature.title"
            class="group flex gap-4 rounded-xl p-4 -m-4 transition-all duration-200 hover:bg-slate-50"
          >
            <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 transition-colors duration-200 group-hover:bg-primary-600 group-hover:text-white">
              <component :is="feature.icon" class="w-6 h-6" />
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
    <section class="py-20 px-4 bg-slate-50">
      <div class="max-w-5xl mx-auto">
        <p class="text-sm font-semibold text-primary-600 text-center tracking-wide uppercase mb-2">Advanced</p>
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Advanced Capabilities</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="feature in advancedFeatures"
            :key="feature.title"
            class="group bg-white rounded-xl p-6 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5 hover:border-primary-200"
          >
            <div class="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 mb-4 transition-colors duration-200 group-hover:bg-primary-600 group-hover:text-white">
              <component :is="feature.icon" class="w-5 h-5" />
            </div>
            <h3 class="text-lg font-semibold text-slate-800 mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Built for India -->
    <section class="py-20 px-4">
      <div class="max-w-3xl mx-auto text-center">
        <p class="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-2">Made in India</p>
        <h2 class="text-3xl font-bold text-slate-800 mb-4">Built for India</h2>
        <p class="text-lg text-slate-600 mb-10">
          We understand the unique needs of Indian small businesses.
        </p>
        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="item in indiaFeatures"
            :key="item.title"
            class="text-center rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition-all duration-200 hover:border-primary-200 hover:bg-white hover:shadow-lg hover:shadow-primary-500/5"
          >
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary-600">
              <component :is="item.icon" class="w-6 h-6" />
            </div>
            <h3 class="font-semibold text-slate-800 mb-1">{{ item.title }}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="relative overflow-hidden py-20 px-4 text-center">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700" />
      <div class="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
      <div class="relative max-w-xl mx-auto">
        <h2 class="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
        <p class="text-lg text-primary-100 mb-8">
          Join hundreds of businesses already using MemberBook.
        </p>
        <NuxtLink to="/register">
          <button class="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium bg-white text-primary-700 hover:bg-primary-50 hover:shadow-lg transition-all duration-200 active:scale-[0.97] cursor-pointer">
            Start Free Today
          </button>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";

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

function svgIcon(d: string) {
  return () => h("svg", { class: "w-6 h-6", fill: "none", stroke: "currentColor", "stroke-width": "1.5", viewBox: "0 0 24 24" }, [
    h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d }),
  ]);
}

const coreFeatures = [
  {
    icon: svgIcon("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"),
    title: "Complete Member Management",
    description: "Store all member details including name, phone, email, address, and photo. Track active and inactive memberships. View complete history at a glance.",
  },
  {
    icon: svgIcon("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"),
    title: "Flexible Subscription Plans",
    description: "Create unlimited plans with custom durations and pricing. Monthly, quarterly, yearly, or custom periods. Perfect for any business model.",
  },
  {
    icon: svgIcon("M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"),
    title: "Payment Tracking",
    description: "Record all payments with method (Cash, UPI, Card). Track pending dues. View revenue reports by day, week, or month. Never miss a payment.",
  },
  {
    icon: svgIcon("M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"),
    title: "WhatsApp Reminders",
    description: "Pre-filled WhatsApp messages for payment reminders and renewals. One-click send via WhatsApp Web. Saves hours of manual messaging.",
  },
  {
    icon: svgIcon("M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"),
    title: "Dashboard & Analytics",
    description: "See active members, revenue trends, expiring subscriptions at a glance. Beautiful charts for member growth, payment methods, plan popularity.",
  },
  {
    icon: svgIcon("M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    title: "Attendance Tracking",
    description: "Quick check-in and check-out for members. View daily attendance. Track attendance history. Perfect for gyms and libraries.",
  },
  {
    icon: svgIcon("M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"),
    title: "Inquiry Management",
    description: "Track potential customers from first contact to conversion. Manage inquiry status (New, Contacted, Converted, Lost). Calculate conversion rates.",
  },
  {
    icon: svgIcon("M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"),
    title: "Multi-Staff Access",
    description: "Add staff members to help manage your business. Role-based access (Owner, Staff). Collaborate seamlessly with your team.",
  },
];

const advancedFeatures = [
  {
    icon: svgIcon("M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"),
    title: "Action-Required Filter",
    description: "Quickly find members who need attention: pending payments, expiring soon, inactive members.",
  },
  {
    icon: svgIcon("M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"),
    title: "Smart Search",
    description: "Find members instantly by name, phone, or email. Filter by plan, status, or action required.",
  },
  {
    icon: svgIcon("M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"),
    title: "Subscription History",
    description: "View complete subscription timeline for each member. Track renewals and payment patterns.",
  },
  {
    icon: svgIcon("M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"),
    title: "Payment Methods",
    description: "Support for Cash, UPI, Card, and Bank Transfer. Track which methods are most popular.",
  },
  {
    icon: svgIcon("M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"),
    title: "Mobile-First Design",
    description: "Works perfectly on phones and tablets. Manage your business on the go.",
  },
  {
    icon: svgIcon("M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"),
    title: "Fast & Reliable",
    description: "Built on modern technology for speed and reliability. Works even with poor internet.",
  },
];

const indiaFeatures = [
  {
    icon: svgIcon("M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
    title: "Indian Currency",
    description: "All amounts in Rupees. No conversion needed.",
  },
  {
    icon: svgIcon("M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"),
    title: "WhatsApp Integration",
    description: "Send reminders via WhatsApp, India's most popular messaging app.",
  },
  {
    icon: svgIcon("M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"),
    title: "Local Support",
    description: "Built by Indians, for Indian businesses. We understand your needs.",
  },
];
</script>
