<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden py-20 px-4 text-center">
      <!-- Gradient background -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
      <!-- Subtle decorative shapes -->
      <div class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-100/40 blur-3xl" />
      <div class="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-accent-100/40 blur-3xl" />

      <div class="relative max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200/60 px-4 py-1.5 text-sm font-medium text-primary-700 mb-6">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
          Free to start
        </div>
        <h1 class="text-4xl font-bold text-slate-800 sm:text-5xl leading-tight">
          Member Management Software for
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">Gyms, Libraries, and Tuition Centers</span>
        </h1>
        <p class="mt-5 text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Track members, collect payments, and send WhatsApp renewal reminders in one place. Free to start and built for India.
        </p>
        <p class="mt-3 text-sm text-slate-600">
          Looking for "Member Book" software?
          <NuxtLink to="/member-book" class="font-medium text-primary-700 hover:text-primary-800 underline decoration-primary-300 underline-offset-2">
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
    <section class="py-20 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <p class="text-sm font-semibold text-primary-600 text-center tracking-wide uppercase mb-2">Features</p>
        <h2 class="text-2xl font-bold text-center text-slate-800 mb-4">Everything you need</h2>
        <p class="text-center text-slate-600 max-w-lg mx-auto mb-12">Simple tools to manage your membership business without the complexity.</p>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="group text-center rounded-xl border border-slate-100 bg-slate-50/50 p-6 transition-all duration-200 hover:border-primary-200 hover:bg-white hover:shadow-lg hover:shadow-primary-500/5"
          >
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors duration-200 group-hover:bg-primary-600 group-hover:text-white text-primary-600">
              <component :is="feature.icon" class="w-6 h-6" />
            </div>
            <h3 class="font-semibold text-slate-800">{{ feature.title }}</h3>
            <p class="text-sm text-slate-600 mt-2 leading-relaxed">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- From the Blog -->
    <section class="py-20 px-4 bg-slate-50">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <div>
            <p class="text-sm font-semibold text-primary-600 tracking-wide uppercase mb-1">Resources</p>
            <h2 class="text-2xl font-bold text-slate-800">From the Blog</h2>
          </div>
          <NuxtLink to="/blog" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all articles &rarr;
          </NuxtLink>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          <NuxtLink
            v-for="post in featuredPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="group bg-white rounded-xl border border-slate-200/80 p-6 transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80"
          >
            <div class="aspect-video overflow-hidden rounded-lg mb-4 -mt-1">
              <img :src="post.image" :alt="post.title" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
            </div>
            <div class="text-xs text-primary-600 font-medium mb-2">{{ post.category }}</div>
            <h3 class="font-semibold text-slate-800 mb-2 leading-snug group-hover:text-primary-700 transition-colors">{{ post.title }}</h3>
            <p class="text-sm text-slate-600 line-clamp-2">{{ post.excerpt }}</p>
            <div class="mt-4 text-xs text-slate-500">{{ post.date }} &middot; {{ post.readTime }} read</div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-20 px-4 bg-white">
      <div class="max-w-3xl mx-auto">
        <p class="text-sm font-semibold text-primary-600 text-center tracking-wide uppercase mb-2">FAQ</p>
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
    <section class="relative overflow-hidden py-20 px-4 text-center">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700" />
      <div class="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
      <div class="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

      <div class="relative max-w-xl mx-auto">
        <h2 class="text-2xl font-bold text-white">Ready to get organized?</h2>
        <p class="mt-3 text-primary-100">Set up your workspace in under a minute.</p>
        <p class="mt-3 text-sm text-primary-200">
          Want to estimate your gym monthly income first?
          <NuxtLink to="/tools/gym-membership-revenue-calculator" class="font-medium text-white underline decoration-primary-300 underline-offset-2 hover:decoration-white">
            Try the free revenue calculator.
          </NuxtLink>
        </p>
        <NuxtLink to="/register" class="mt-6 inline-block">
          <button
            class="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium bg-white text-primary-700 hover:bg-primary-50 hover:shadow-lg transition-all duration-200 active:scale-[0.97] cursor-pointer"
            @click="trackCtaClick('home_bottom_create_account')"
          >
            Create Your Account
          </button>
        </NuxtLink>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { h } from "vue";
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

// SVG icon render helpers
function svgIcon(d: string) {
  return () => h("svg", { class: "w-6 h-6", fill: "none", stroke: "currentColor", "stroke-width": "1.5", viewBox: "0 0 24 24" }, [
    h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d }),
  ]);
}

const features = [
  {
    icon: svgIcon("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"),
    title: "Member Management",
    desc: "Track members, their subscriptions, and payment history in one place.",
  },
  {
    icon: svgIcon("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"),
    title: "Flexible Plans",
    desc: "Create custom subscription plans with any duration and price.",
  },
  {
    icon: svgIcon("M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"),
    title: "Payment Tracking",
    desc: "Record payments manually. Send WhatsApp reminders for pending dues.",
  },
  {
    icon: svgIcon("M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"),
    title: "Dashboard",
    desc: "See active members, revenue, and expiring subscriptions at a glance.",
  },
  {
    icon: svgIcon("M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"),
    title: "Smart Reminders",
    desc: "Pre-filled WhatsApp messages for payment and renewal reminders.",
  },
  {
    icon: svgIcon("M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"),
    title: "Multi-Staff",
    desc: "Add staff members to help manage your business.",
  },
];
</script>
