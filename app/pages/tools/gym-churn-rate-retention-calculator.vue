<template>
  <div>
    <section class="bg-slate-50 py-14 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <nav class="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span class="text-slate-400">/</span>
          <NuxtLink to="/tools" class="hover:text-primary-600 transition-colors">Free Tools</NuxtLink>
          <span class="text-slate-400">/</span>
          <span class="text-slate-800 font-medium">Gym Churn Calculator</span>
        </nav>

        <h1 class="text-4xl font-bold text-slate-800">Free Gym Churn Rate and Retention Calculator</h1>
        <p class="mt-4 text-lg text-slate-600">Measure how many members you are losing, what your retention looks like, and where growth is leaking.</p>
      </div>
    </section>

    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 class="text-xl font-semibold text-slate-800 mb-1">Monthly Membership Data</h2>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Members at start of month</label>
            <input v-model.number="input.openingMembers" type="number" min="1" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">New members joined</label>
            <input v-model.number="input.newMembers" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Members at end of month</label>
            <input v-model.number="input.endingMembers" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Average monthly membership fee (INR)</label>
            <input v-model.number="input.avgMonthlyFee" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>
        </div>

        <div class="space-y-5">
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h2 class="text-xl font-semibold text-slate-800 mb-4">Results</h2>
            <div class="grid grid-cols-2 gap-3">
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Members lost</p>
                <p class="text-2xl font-bold text-slate-800">{{ membersLost }}</p>
              </div>
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Churn rate</p>
                <p class="text-2xl font-bold text-red-600">{{ churnRate }}%</p>
              </div>
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Retention rate</p>
                <p class="text-2xl font-bold text-green-600">{{ retentionRate }}%</p>
              </div>
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Net growth</p>
                <p :class="netGrowth >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600'">{{ netGrowth }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">Revenue Impact</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-600">Estimated monthly revenue lost</span><span class="font-semibold text-slate-800">{{ inr(monthlyRevenueLost) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Estimated annual revenue lost</span><span class="font-semibold text-slate-800">{{ inr(annualRevenueLost) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Approx member lifetime</span><span class="font-semibold text-slate-800">{{ estimatedLifetimeMonths }} months</span></div>
            </div>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p class="text-sm text-slate-700 mb-4">Churn is rarely visible in spreadsheets until it is expensive. MemberBook flags expiring members early and helps staff recover renewals before revenue drops.</p>
            <NuxtLink to="/register">
              <AppButton variant="primary" size="md">Try MemberBook Free</AppButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 px-4 bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-semibold text-slate-800 mb-6">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div v-for="faq in faqs" :key="faq.q" class="bg-white border border-slate-200 rounded-xl p-5">
            <h3 class="text-base font-semibold text-slate-800 mb-2">{{ faq.q }}</h3>
            <p class="text-sm text-slate-600">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" })

const config = useRuntimeConfig()
const appUrl = config.public.appUrl || "https://memberbook.app"
const pageUrl = `${appUrl}/tools/gym-churn-rate-retention-calculator`

const input = reactive({
  openingMembers: 180,
  newMembers: 30,
  endingMembers: 170,
  avgMonthlyFee: 1800,
})

const membersLost = computed(() => Math.max(0, input.openingMembers + input.newMembers - input.endingMembers))
const churnRate = computed(() => {
  if (input.openingMembers <= 0) return 0
  return Number(((membersLost.value / input.openingMembers) * 100).toFixed(1))
})
const retentionRate = computed(() => Number((100 - churnRate.value).toFixed(1)))
const netGrowth = computed(() => input.endingMembers - input.openingMembers)
const monthlyRevenueLost = computed(() => membersLost.value * input.avgMonthlyFee)
const annualRevenueLost = computed(() => monthlyRevenueLost.value * 12)
const estimatedLifetimeMonths = computed(() => {
  if (churnRate.value <= 0) return 120
  return Math.round(100 / churnRate.value)
})

function inr(value: number): string {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`
}

const faqs = [
  {
    q: "What is a good churn rate for a gym?",
    a: "Many gyms run at 8 to 20 percent monthly churn depending on pricing and follow-up quality. Lower is better, especially below 10 percent.",
  },
  {
    q: "How do I reduce churn quickly?",
    a: "Start with expiry reminders, easy renewal payment links, and one personal follow-up call for inactive members.",
  },
  {
    q: "Why track churn and retention together?",
    a: "Churn shows leakage. Retention shows stability. Together they explain whether marketing growth is real or just replacing lost members.",
  },
]

useSeoMeta({
  title: "Gym Churn Rate and Retention Calculator (Free) | MemberBook",
  description: "Calculate gym member churn rate, retention rate, and revenue impact. Free tool for gym owners.",
  ogTitle: "Gym Churn Rate and Retention Calculator (Free) | MemberBook",
  ogDescription: "Calculate gym member churn rate, retention rate, and revenue impact. Free tool for gym owners.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Gym Churn Rate and Retention Calculator (Free) | MemberBook",
  twitterDescription: "Calculate gym member churn rate, retention rate, and revenue impact. Free tool for gym owners.",
  twitterImage: `${appUrl}/og-image.png`,
})

useHead({
  link: [{ rel: "canonical", href: pageUrl }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Gym Churn Rate and Retention Calculator",
        description: "Free gym churn and retention calculator",
        url: pageUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web Browser",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      }),
    },
  ],
})
</script>
