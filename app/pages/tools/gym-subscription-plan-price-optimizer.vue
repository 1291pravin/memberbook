<template>
  <div>
    <section class="bg-slate-50 py-14 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <nav class="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span class="text-slate-400">/</span>
          <NuxtLink to="/tools" class="hover:text-primary-600 transition-colors">Free Tools</NuxtLink>
          <span class="text-slate-400">/</span>
          <span class="text-slate-800 font-medium">Gym Price Optimizer</span>
        </nav>

        <h1 class="text-4xl font-bold text-slate-800">Free Gym Subscription Plan Price Optimizer</h1>
        <p class="mt-4 text-lg text-slate-600">Estimate low, recommended, and premium membership prices using your cost base, expected members, and target margin.</p>
      </div>
    </section>

    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 class="text-xl font-semibold text-slate-800">Pricing Inputs</h2>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Monthly fixed costs (INR)</label>
            <input v-model.number="input.fixedCosts" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Variable cost per member (INR)</label>
            <input v-model.number="input.variableCostPerMember" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Expected active members</label>
            <input v-model.number="input.expectedMembers" type="number" min="1" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Target margin (%)</label>
              <input v-model.number="input.targetMargin" type="number" min="0" max="80" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Competitor average price (INR)</label>
              <input v-model.number="input.competitorAverage" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h2 class="text-xl font-semibold text-slate-800 mb-4">Recommended Monthly Pricing</h2>
            <div class="grid sm:grid-cols-3 gap-3">
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600 mb-1">Entry Plan</p>
                <p class="text-2xl font-bold text-slate-800">{{ inr(entryPrice) }}</p>
              </div>
              <div class="border rounded-lg p-4 text-center border-primary-300 bg-primary-50">
                <p class="text-xs text-slate-600 mb-1">Recommended</p>
                <p class="text-2xl font-bold text-primary-700">{{ inr(recommendedPrice) }}</p>
              </div>
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600 mb-1">Premium Plan</p>
                <p class="text-2xl font-bold text-slate-800">{{ inr(premiumPrice) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">At Recommended Price</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-600">Projected monthly revenue</span><span class="font-semibold text-slate-800">{{ inr(projectedRevenue) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Projected monthly profit</span><span :class="projectedProfit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'">{{ inr(projectedProfit) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Profit margin</span><span class="font-semibold text-slate-800">{{ projectedMargin }}%</span></div>
            </div>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p class="text-sm text-slate-700 mb-4">Pricing is not one-time. MemberBook helps test pricing against renewals and collections so you can iterate with confidence.</p>
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
const pageUrl = `${appUrl}/tools/gym-subscription-plan-price-optimizer`

const input = reactive({
  fixedCosts: 240000,
  variableCostPerMember: 350,
  expectedMembers: 220,
  targetMargin: 28,
  competitorAverage: 1800,
})

const breakEvenPrice = computed(() => (input.fixedCosts / input.expectedMembers) + input.variableCostPerMember)
const recommendedPrice = computed(() => {
  const costBased = breakEvenPrice.value / Math.max(0.1, 1 - input.targetMargin / 100)
  const blended = (costBased * 0.7) + (input.competitorAverage * 0.3)
  return Math.round(blended / 10) * 10
})
const entryPrice = computed(() => Math.max(0, Math.round((recommendedPrice.value * 0.85) / 10) * 10))
const premiumPrice = computed(() => Math.round((recommendedPrice.value * 1.2) / 10) * 10)

const projectedRevenue = computed(() => recommendedPrice.value * input.expectedMembers)
const monthlyCost = computed(() => input.fixedCosts + (input.variableCostPerMember * input.expectedMembers))
const projectedProfit = computed(() => projectedRevenue.value - monthlyCost.value)
const projectedMargin = computed(() => {
  if (projectedRevenue.value <= 0) return 0
  return Math.round((projectedProfit.value / projectedRevenue.value) * 100)
})

function inr(value: number): string {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`
}

const faqs = [
  {
    q: "How should gyms choose monthly membership pricing?",
    a: "Start with break-even price from fixed and variable costs, then add margin and validate against local competitor positioning.",
  },
  {
    q: "Should I offer only one plan price?",
    a: "No. A three-tier structure (entry, standard, premium) captures more demand and improves average revenue per member.",
  },
  {
    q: "How often should I revisit pricing?",
    a: "Review every quarter or after major cost changes. Track impact on renewals before making large price jumps.",
  },
]

useSeoMeta({
  title: "Gym Subscription Plan Price Optimizer (Free) | MemberBook",
  description: "Optimize gym membership pricing using costs, expected member count, and target margin. Get entry, recommended, and premium prices.",
  ogTitle: "Gym Subscription Plan Price Optimizer (Free) | MemberBook",
  ogDescription: "Optimize gym membership pricing using costs, expected member count, and target margin. Get entry, recommended, and premium prices.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Gym Subscription Plan Price Optimizer (Free) | MemberBook",
  twitterDescription: "Optimize gym membership pricing using costs, expected member count, and target margin. Get entry, recommended, and premium prices.",
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
        name: "Gym Subscription Plan Price Optimizer",
        description: "Free gym pricing optimizer",
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
