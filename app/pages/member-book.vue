<template>
  <div>
    <section class="bg-slate-50 py-16 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <p class="text-sm font-semibold uppercase tracking-wide text-primary-700">Member Book Software</p>
        <h1 class="mt-3 text-4xl font-bold text-slate-800 sm:text-5xl">
          Looking for "Member Book"? Use MemberBook.
        </h1>
        <p class="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          MemberBook helps gyms, libraries, and tuition centers in India manage members, payments, and renewals in one place.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink to="/register" @click="trackCtaClick('member_book_start_free')">
            <AppButton size="lg">Start Free</AppButton>
          </NuxtLink>
          <NuxtLink to="/tools/gym-membership-revenue-calculator">
            <AppButton size="lg" variant="secondary">Try Revenue Calculator</AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="py-14 px-4">
      <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-slate-800">Track Members</h2>
          <p class="mt-2 text-sm text-slate-600">
            Keep member profiles, plan details, and activity history organized without spreadsheets.
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-slate-800">Collect Payments</h2>
          <p class="mt-2 text-sm text-slate-600">
            Record payments, monitor pending dues, and reduce missed renewals with reminders.
          </p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-slate-800">Grow Revenue</h2>
          <p class="mt-2 text-sm text-slate-600">
            Use analytics and free calculators to improve retention and increase monthly income.
          </p>
        </div>
      </div>
    </section>

    <section class="py-12 px-4 bg-slate-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800 text-center">Why "Member Book" searchers choose MemberBook</h2>
        <ul class="mt-6 space-y-3 text-slate-700 max-w-2xl mx-auto list-disc pl-5">
          <li>Built for Indian businesses (INR pricing, practical workflows, WhatsApp-ready communication).</li>
          <li>Supports gyms, libraries, and tuition centers with flexible plan and payment management.</li>
          <li>Fast setup with no technical overhead and a clear upgrade path as your member count grows.</li>
        </ul>
        <div class="mt-8 text-center">
          <NuxtLink to="/features" class="font-medium text-primary-700 hover:text-primary-800">
            Explore all features
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
const pageUrl = `${appUrl}/member-book`;

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

useSeoMeta({
  title: "Member Book Software in India | MemberBook",
  description:
    "Searching for Member Book software? MemberBook helps gyms, libraries, and tuition centers manage members, payments, and renewals. Free to start.",
  ogTitle: "Member Book Software in India | MemberBook",
  ogDescription:
    "Searching for Member Book software? MemberBook helps gyms, libraries, and tuition centers manage members, payments, and renewals. Free to start.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Member Book Software in India | MemberBook",
  twitterDescription:
    "MemberBook helps gyms, libraries, and tuition centers manage members, payments, and renewals. Free to start.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [{ rel: "canonical", href: pageUrl }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Member Book Software in India",
        "url": pageUrl,
        "description": "MemberBook helps gyms, libraries, and tuition centers manage members, payments, and renewals.",
      }),
    },
  ],
});
</script>
