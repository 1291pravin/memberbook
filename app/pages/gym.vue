<template>
  <div>
    <!-- Hero -->
    <section class="py-16 px-4 text-center bg-gradient-to-b from-primary-50 to-white">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800 sm:text-5xl">
          Gym Management Software
          <span class="text-primary-600">Made Simple</span>
        </h1>
        <p class="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Stop managing gym members in spreadsheets. MemberBook helps you track memberships, collect payments, and send WhatsApp reminders - all in one place.
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
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Tired of managing your gym manually?</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div v-for="problem in problems" :key="problem.title" class="bg-red-50 rounded-xl p-6 border border-red-100">
            <h3 class="font-semibold text-slate-800 mb-2">❌ {{ problem.title }}</h3>
            <p class="text-sm text-slate-600">{{ problem.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features for Gyms -->
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-12">Everything your gym needs</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div v-for="feature in gymFeatures" :key="feature.title" class="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5">
            <div class="w-10 h-10 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center shrink-0 text-xl">
              {{ feature.emoji }}
            </div>
            <div>
              <h3 class="font-semibold text-slate-800 mb-1">{{ feature.title }}</h3>
              <p class="text-sm text-slate-600">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="py-16 px-4 bg-primary-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-4">Perfect for all types of fitness businesses</h2>
        <p class="text-center text-slate-600 mb-12">Whether you run a small gym or a large fitness center, MemberBook scales with you.</p>
        <div class="grid md:grid-cols-4 gap-6">
          <div v-for="type in gymTypes" :key="type.name" class="bg-white rounded-xl p-6 text-center">
            <div class="text-4xl mb-3">{{ type.emoji }}</div>
            <h3 class="font-semibold text-slate-800">{{ type.name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof -->
    <section class="py-16 px-4 bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800 mb-8">Join gym owners across India</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="stat in stats" :key="stat.label" class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-800">{{ stat.value }}</span>
            <span class="text-slate-600 text-sm">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Why MemberBook for Gyms -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center text-slate-800 mb-4">Why gym owners choose MemberBook</h2>
        <p class="text-center text-slate-600 mb-12 max-w-2xl mx-auto">MemberBook is gym member management software built for how Indian gyms actually work — cash payments, UPI, WhatsApp communication, and flexible plans.</p>
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <h3 class="font-semibold text-slate-800 mb-2">Built for Indian gyms</h3>
            <p class="text-sm text-slate-600 mb-6">Supports INR pricing, UPI payments, WhatsApp reminders, and the plan structures Indian gym members expect — monthly, quarterly, half-yearly, and annual.</p>
            <h3 class="font-semibold text-slate-800 mb-2">No technical setup</h3>
            <p class="text-sm text-slate-600 mb-6">Sign up, add your plans, and start tracking members in minutes. No downloads, no installations, no IT team needed. Works on any phone or computer.</p>
          </div>
          <div>
            <h3 class="font-semibold text-slate-800 mb-2">Reduce payment defaults</h3>
            <p class="text-sm text-slate-600 mb-6">Automated WhatsApp renewal reminders reduce defaults by 30–50%. See exactly which members are about to expire and follow up before they lapse.</p>
            <h3 class="font-semibold text-slate-800 mb-2">Free to start</h3>
            <p class="text-sm text-slate-600 mb-6">No credit card required. Start managing your gym members today and upgrade only when you need advanced features.</p>
          </div>
        </div>
        <div class="mt-8 text-center">
          <p class="text-sm text-slate-600">
            Want to estimate your gym's revenue potential?
            <NuxtLink to="/tools/gym-membership-revenue-calculator" class="text-primary-600 hover:text-primary-700 font-medium">Try the free gym revenue calculator</NuxtLink>
          </p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 px-4 text-center bg-slate-800 text-white">
      <div class="max-w-xl mx-auto">
        <h2 class="text-3xl font-bold mb-4">Ready to grow your gym?</h2>
        <p class="text-lg text-slate-400 mb-8">
          Start your free trial today. No credit card required.
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
  title: "Gym Management Software - Track Members & Payments | MemberBook",
  description: "Best gym management software for India. Track gym members, manage subscriptions, collect payments via UPI, and send WhatsApp reminders. Free gym membership app — start in minutes.",
  ogTitle: "Gym Management Software - Track Members & Payments | MemberBook",
  ogDescription: "Stop managing gym members in spreadsheets. Track memberships, payments, and attendance in one simple platform. Free gym membership app built for India.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/gym`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Gym Management Software - Track Members & Payments | MemberBook",
  twitterDescription: "Best gym management software for India. Track members, manage subscriptions, collect payments, send WhatsApp reminders. Free to start.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/gym` },
  ],
  script: [
    // LocalBusiness Schema for Gym Software
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "MemberBook - Gym Management Software",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Gym Management Software",
        "operatingSystem": "Web Browser",
        "isAccessibleForFree": true,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "127",
        },
        "description": "Best gym management software for India. Track gym members, manage subscriptions, collect payments via UPI, and send WhatsApp reminders. Free gym membership app.",
        "featureList": [
          "Gym member management",
          "Subscription and plan tracking",
          "Payment collection (Cash, UPI, Bank Transfer)",
          "WhatsApp renewal reminders",
          "Attendance and check-in tracking",
          "Revenue analytics dashboard",
          "Multi-staff access",
        ],
      }),
    },
    // Breadcrumb
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
            "name": "Gym Management Software",
            "item": `${appUrl}/gym`,
          },
        ],
      }),
    },
  ],
});

const problems = [
  { title: "Lost in spreadsheets", description: "Managing hundreds of members in Excel is time-consuming and error-prone." },
  { title: "Missing payment reminders", description: "Manually tracking who hasn't paid and sending reminders via WhatsApp takes hours." },
  { title: "No visibility", description: "Can't see revenue trends, member growth, or which plans are most popular." },
  { title: "Poor attendance tracking", description: "Paper registers get lost and you can't track member attendance digitally." },
];

const gymFeatures = [
  { emoji: "👥", title: "Member Database", description: "Store all member details, photos, and contact info in one place." },
  { emoji: "📋", title: "Flexible Plans", description: "Create monthly, quarterly, or yearly plans with custom pricing." },
  { emoji: "💰", title: "Payment Tracking", description: "Record payments instantly. Track pending dues automatically." },
  { emoji: "🔔", title: "WhatsApp Reminders", description: "Send pre-filled payment reminders with one click via WhatsApp." },
  { emoji: "✅", title: "Check-In/Out", description: "Quick attendance tracking. See who's in the gym right now." },
  { emoji: "📊", title: "Analytics Dashboard", description: "Track revenue, member growth, and popular plans at a glance." },
];

const gymTypes = [
  { emoji: "🏋️", name: "Fitness Gyms" },
  { emoji: "🧘", name: "Yoga Studios" },
  { emoji: "🥊", name: "Boxing Gyms" },
  { emoji: "💃", name: "Dance Studios" },
];

const stats = [
  { value: "500+", label: "Active Gyms" },
  { value: "50K+", label: "Members Managed" },
  { value: "4.8★", label: "User Rating" },
];
</script>
