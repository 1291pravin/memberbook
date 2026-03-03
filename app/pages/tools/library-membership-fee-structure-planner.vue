<template>
  <div>
    <section class="bg-slate-50 py-14 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <nav class="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span class="text-slate-400">/</span>
          <NuxtLink to="/tools" class="hover:text-primary-600 transition-colors">Free Tools</NuxtLink>
          <span class="text-slate-400">/</span>
          <span class="text-slate-800 font-medium">Library Fee Planner</span>
        </nav>

        <h1 class="text-4xl font-bold text-slate-800">
          Free Library Membership Fee Structure Planner
        </h1>
        <p class="mt-4 text-lg text-slate-600">
          Decide profitable monthly, quarterly, and yearly library pricing based on seats, occupancy, and revenue target.
        </p>
      </div>
    </section>

    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-5">Library Inputs</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Total seats</label>
              <input v-model.number="inputs.totalSeats" type="number" min="1" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Expected occupancy (%)</label>
              <input v-model.number="inputs.occupancy" type="number" min="1" max="100" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Target monthly revenue (INR)</label>
              <input v-model.number="inputs.targetRevenue" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Monthly operating cost (INR)</label>
              <input v-model.number="inputs.monthlyCost" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Quarterly discount (%)</label>
                <input v-model.number="inputs.quarterlyDiscount" type="number" min="0" max="40" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Annual discount (%)</label>
                <input v-model.number="inputs.annualDiscount" type="number" min="0" max="60" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Target profit margin (%)</label>
              <input v-model.number="inputs.targetMargin" type="number" min="0" max="80" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
          </div>
        </div>

        <div class="space-y-5">
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h2 class="text-xl font-semibold text-slate-800 mb-4">Recommended Fee Structure</h2>

            <div class="grid sm:grid-cols-3 gap-3">
              <div class="border border-slate-200 rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600 mb-1">Monthly Plan</p>
                <p class="text-2xl font-bold text-slate-800">{{ inr(monthlyFee) }}</p>
              </div>
              <div class="border border-slate-200 rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600 mb-1">Quarterly Plan</p>
                <p class="text-2xl font-bold text-slate-800">{{ inr(quarterlyFee) }}</p>
              </div>
              <div class="border border-slate-200 rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600 mb-1">Yearly Plan</p>
                <p class="text-2xl font-bold text-slate-800">{{ inr(yearlyFee) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-slate-700 mb-4">Business Projection</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between"><span class="text-slate-600">Expected active members</span><span class="font-semibold text-slate-800">{{ expectedMembers }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Projected monthly revenue</span><span class="font-semibold text-slate-800">{{ inr(projectedMonthlyRevenue) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Projected monthly profit</span><span :class="projectedProfit >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'">{{ inr(projectedProfit) }}</span></div>
              <div class="flex justify-between"><span class="text-slate-600">Profit margin</span><span class="font-semibold text-slate-800">{{ projectedMargin }}%</span></div>
            </div>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p class="text-slate-700 mb-4 text-sm">
              Manual pricing works until you open your second branch. MemberBook tracks actual occupancy and collections by branch so pricing decisions are based on live data, not guesswork.
            </p>
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
const pageUrl = `${appUrl}/tools/library-membership-fee-structure-planner`

const inputs = reactive({
  totalSeats: 120,
  occupancy: 80,
  targetRevenue: 180000,
  monthlyCost: 90000,
  quarterlyDiscount: 8,
  annualDiscount: 18,
  targetMargin: 30,
})

const expectedMembers = computed(() => Math.max(1, Math.round(inputs.totalSeats * inputs.occupancy / 100)))

const requiredRevenueWithMargin = computed(() => {
  const revenueFromMargin = inputs.monthlyCost / Math.max(0.1, (1 - inputs.targetMargin / 100))
  return Math.max(inputs.targetRevenue, Math.round(revenueFromMargin))
})

const monthlyFee = computed(() => Math.round(requiredRevenueWithMargin.value / expectedMembers.value / 10) * 10)
const quarterlyFee = computed(() => Math.round((monthlyFee.value * 3 * (1 - inputs.quarterlyDiscount / 100)) / 10) * 10)
const yearlyFee = computed(() => Math.round((monthlyFee.value * 12 * (1 - inputs.annualDiscount / 100)) / 10) * 10)

const projectedMonthlyRevenue = computed(() => monthlyFee.value * expectedMembers.value)
const projectedProfit = computed(() => projectedMonthlyRevenue.value - inputs.monthlyCost)
const projectedMargin = computed(() => {
  if (projectedMonthlyRevenue.value <= 0) return 0
  return Math.round((projectedProfit.value / projectedMonthlyRevenue.value) * 100)
})

function inr(value: number): string {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`
}

const faqs = [
  {
    q: "How do I decide the right fee for a library seat?",
    a: "Estimate active seats from occupancy, then divide your revenue target by active seats. This planner does that and also adjusts quarterly and annual plans with discounts.",
  },
  {
    q: "What is a healthy profit margin for a reading library?",
    a: "Most independent libraries aim for 20 to 35 percent monthly margin after rent, staff, electricity, and maintenance.",
  },
  {
    q: "Should I offer annual plans for libraries?",
    a: "Yes. Annual plans improve cash flow and retention. Keep annual discounts meaningful but controlled so margin does not collapse.",
  },
]

useSeoMeta({
  title: "Library Membership Fee Structure Planner (Free) | MemberBook",
  description: "Plan profitable monthly, quarterly and yearly library membership prices from seat count, occupancy and target revenue.",
  ogTitle: "Library Membership Fee Structure Planner (Free) | MemberBook",
  ogDescription: "Plan profitable monthly, quarterly and yearly library membership prices from seat count, occupancy and target revenue.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Library Membership Fee Structure Planner (Free) | MemberBook",
  twitterDescription: "Plan profitable monthly, quarterly and yearly library membership prices from seat count, occupancy and target revenue.",
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
        name: "Library Membership Fee Structure Planner",
        description: "Free planner for library membership pricing",
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
