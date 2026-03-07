<template>
  <div>
    <!-- Hero -->
    <section class="py-16 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800 sm:text-5xl">
          Member Management Software for
          <span class="text-primary-600">Gyms, Libraries, and Tuition Centers</span>
        </h1>
        <p class="mt-4 text-lg text-slate-600 max-w-xl mx-auto">
          Track members, collect payments, and send WhatsApp renewal reminders in one place. Free to start and built for India.
        </p>
        <p class="mt-3 text-sm text-slate-600">
          Looking for "Member Book" software?
          <NuxtLink to="/member-book" class="font-medium text-primary-700 hover:text-primary-800">
            See why MemberBook is the right fit.
          </NuxtLink>
        </p>
        <div class="mt-8 flex gap-3 justify-center">
          <NuxtLink to="/register" @click="trackCtaClick('home_hero_start_free')">
            <AppButton size="lg">Start Free</AppButton>
          </NuxtLink>
          <NuxtLink to="/login">
            <AppButton size="lg" variant="secondary">Sign In</AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-center text-slate-800 mb-12">Everything you need</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="feature in features" :key="feature.title" class="text-center">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span class="text-primary-600 text-xl">{{ feature.emoji }}</span>
            </div>
            <h3 class="font-semibold text-slate-800">{{ feature.title }}</h3>
            <p class="text-sm text-slate-600 mt-2">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- From the Blog -->
    <section class="py-16 px-4 bg-slate-50">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-slate-800">From the Blog</h2>
          <NuxtLink to="/blog" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all articles →
          </NuxtLink>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <NuxtLink
            v-for="post in featuredPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div class="aspect-video overflow-hidden rounded-lg mb-4 -mt-1">
              <img :src="post.image" :alt="post.title" class="w-full h-full object-cover">
            </div>
            <div class="text-xs text-primary-600 font-medium mb-2">{{ post.category }}</div>
            <h3 class="font-semibold text-slate-800 mb-2 leading-snug">{{ post.title }}</h3>
            <p class="text-sm text-slate-600 line-clamp-2">{{ post.excerpt }}</p>
            <div class="mt-4 text-xs text-slate-500">{{ post.date }} &middot; {{ post.readTime }} read</div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-center text-slate-800 mb-10">Frequently Asked Questions</h2>
        <div class="divide-y divide-slate-200 border-t border-b border-slate-200">
          <div v-for="(faq, index) in faqs" :key="index">
            <button
              class="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer"
              :aria-expanded="openFaqIndex === index"
              @click="toggleFaq(index)"
            >
              <span class="font-medium text-slate-800">{{ faq.question }}</span>
              <svg
                class="w-5 h-5 shrink-0 text-slate-500 transition-transform duration-200"
                :class="{ 'rotate-180': openFaqIndex === index }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-200 ease-in-out"
              :class="openFaqIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="overflow-hidden">
                <p class="pb-5 text-slate-600 leading-relaxed">{{ faq.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 text-center">
      <div class="max-w-xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800">Ready to get organized?</h2>
        <p class="mt-2 text-slate-600">Set up your workspace in under a minute.</p>
        <p class="mt-3 text-sm text-slate-600">
          Want to estimate your gym monthly income first?
          <NuxtLink to="/tools/gym-membership-revenue-calculator" class="font-medium text-primary-700 hover:text-primary-800">
            Try the free revenue calculator.
          </NuxtLink>
        </p>
        <NuxtLink to="/register" class="mt-6 inline-block">
          <AppButton size="lg" @click="trackCtaClick('home_bottom_create_account')">Create Your Account</AppButton>
        </NuxtLink>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { blogPosts } from "~/data/blogPosts";

definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

const faqs: { question: string; answer: string }[] = [
  {
    question: "What is MemberBook?",
    answer: "MemberBook is a simple member and subscription management software designed for Indian small businesses like gyms, libraries, and tuition centers. It helps you track members, manage subscriptions, record payments, and send WhatsApp reminders.",
  },
  {
    question: "Is MemberBook free?",
    answer: "Yes, MemberBook is free to start. You can manage your members and subscriptions without any upfront cost.",
  },
  {
    question: "What types of businesses can use MemberBook?",
    answer: "MemberBook is designed for gyms, fitness centers, libraries, tuition centers, coaching classes, yoga studios, dance academies, and any membership-based business.",
  },
  {
    question: "Can I send WhatsApp reminders?",
    answer: "Yes, MemberBook generates pre-filled WhatsApp messages for payment reminders and renewal notifications that you can send with one click.",
  },
];

// SEO Meta Tags
useSeoMeta({
  title: "MemberBook (Member Book) - Member Management Software",
  description: "Member management software for gyms, libraries, and tuition centers. Track members, collect payments, send WhatsApp reminders. Free to start.",
  ogTitle: "MemberBook (Member Book) - Member Management Software",
  ogDescription: "Track members, collect payments, and send WhatsApp renewal reminders for gyms, libraries, and tuition centers. Free to start.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: appUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "MemberBook (Member Book) - Member Management Software",
  twitterDescription: "Track members, collect payments, and send WhatsApp renewal reminders for gyms, libraries, and tuition centers.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: appUrl },
  ],
  script: [
    // SoftwareApplication Schema
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "MemberBook",
        "applicationCategory": "BusinessApplication",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "127",
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
        "operatingSystem": "Web Browser",
        "description": "Simple subscription and member management software for gyms, libraries, and tuition centers in India.",
      }),
    },
    // FAQ Schema
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
      }),
    },
    // Organization Schema
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "MemberBook",
        "url": appUrl,
        "logo": `${appUrl}/logo.png`,
        "description": "Simple member management software for Indian small businesses",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "IN",
        },
        "areaServed": {
          "@type": "Country",
          "name": "India",
        },
      }),
    },
  ],
});

const featuredPosts = blogPosts.slice(0, 2);

const openFaqIndex = ref<number | null>(null);
function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? null : index;
}

function trackCtaClick(label: string) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;
  gtag("event", "seo_cta_click", {
    event_category: "SEO",
    event_label: label,
    page_location: window.location.href,
    page_path: window.location.pathname,
  });
}

const features = [
  { emoji: "👥", title: "Member Management", desc: "Track members, their subscriptions, and payment history in one place." },
  { emoji: "📋", title: "Flexible Plans", desc: "Create custom subscription plans with any duration and price." },
  { emoji: "💰", title: "Payment Tracking", desc: "Record payments manually. Send WhatsApp reminders for pending dues." },
  { emoji: "📊", title: "Dashboard", desc: "See active members, revenue, and expiring subscriptions at a glance." },
  { emoji: "🔔", title: "Smart Reminders", desc: "Pre-filled WhatsApp messages for payment and renewal reminders." },
  { emoji: "👥", title: "Multi-Staff", desc: "Add staff members to help manage your business." },
];
</script>
