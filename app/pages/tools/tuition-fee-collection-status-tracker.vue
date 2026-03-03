<template>
  <div>
    <section class="bg-slate-50 py-14 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <nav class="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span class="text-slate-400">/</span>
          <NuxtLink to="/tools" class="hover:text-primary-600 transition-colors">Free Tools</NuxtLink>
          <span class="text-slate-400">/</span>
          <span class="text-slate-800 font-medium">Fee Collection Tracker</span>
        </nav>

        <h1 class="text-4xl font-bold text-slate-800">Free Tuition Fee Collection Status Tracker</h1>
        <p class="mt-4 text-lg text-slate-600">Track current month collections, outstanding dues, and overdue risk for coaching and tuition batches.</p>
      </div>
    </section>

    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 class="text-xl font-semibold text-slate-800">Input Monthly Snapshot</h2>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Total students</label>
              <input v-model.number="data.totalStudents" type="number" min="1" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Monthly fee/student (INR)</label>
              <input v-model.number="data.monthlyFee" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Students fully paid</label>
              <input v-model.number="data.fullyPaidStudents" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Partially paid students</label>
              <input v-model.number="data.partialPaidStudents" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Average partial payment per partial student (INR)</label>
            <input v-model.number="data.avgPartialAmount" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Students overdue by 30+ days</label>
            <input v-model.number="data.overdueStudents" type="number" min="0" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          </div>
        </div>

        <div class="space-y-5">
          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h2 class="text-xl font-semibold text-slate-800 mb-4">Collection Dashboard</h2>
            <div class="grid grid-cols-2 gap-3">
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Expected billing</p>
                <p class="text-2xl font-bold text-slate-800">{{ inr(expectedBilling) }}</p>
              </div>
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Collected</p>
                <p class="text-2xl font-bold text-green-600">{{ inr(collectedAmount) }}</p>
              </div>
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Outstanding</p>
                <p class="text-2xl font-bold text-red-600">{{ inr(outstandingAmount) }}</p>
              </div>
              <div class="border rounded-lg p-4 text-center">
                <p class="text-xs text-slate-600">Collection rate</p>
                <p class="text-2xl font-bold text-slate-800">{{ collectionRate }}%</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl p-6">
            <h3 class="text-sm font-semibold text-slate-700 mb-3">Action Priority</h3>
            <ul class="space-y-2 text-sm text-slate-700">
              <li>{{ priorityLine1 }}</li>
              <li>{{ priorityLine2 }}</li>
              <li>{{ priorityLine3 }}</li>
            </ul>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p class="text-sm text-slate-700 mb-4">When collections are tracked manually, follow-ups get missed. MemberBook automatically shows pending students, sends reminders, and keeps payment timelines for each parent.</p>
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
const pageUrl = `${appUrl}/tools/tuition-fee-collection-status-tracker`

const data = reactive({
  totalStudents: 120,
  monthlyFee: 2500,
  fullyPaidStudents: 72,
  partialPaidStudents: 24,
  avgPartialAmount: 1200,
  overdueStudents: 18,
})

const expectedBilling = computed(() => data.totalStudents * data.monthlyFee)
const collectedAmount = computed(() => (data.fullyPaidStudents * data.monthlyFee) + (data.partialPaidStudents * data.avgPartialAmount))
const outstandingAmount = computed(() => Math.max(0, expectedBilling.value - collectedAmount.value))
const collectionRate = computed(() => {
  if (expectedBilling.value === 0) return 0
  return Number(((collectedAmount.value / expectedBilling.value) * 100).toFixed(1))
})

const priorityLine1 = computed(() => `Overdue follow-up: ${data.overdueStudents} students need immediate reminder and payment confirmation.`)
const priorityLine2 = computed(() => `Partial dues bucket: ${data.partialPaidStudents} students have partial payments pending.`)
const priorityLine3 = computed(() => `Expected recovery if 60% of dues are collected this week: ${inr(outstandingAmount.value * 0.6)}.`)

function inr(value: number): string {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`
}

const faqs = [
  {
    q: "What collection rate is considered healthy for tuition centers?",
    a: "Most centers aim for 85 to 95 percent monthly collection by month-end, with structured reminder follow-ups for the rest.",
  },
  {
    q: "How often should fee reminders be sent?",
    a: "A practical cadence is due-date reminder, plus follow-ups on day 3, day 7, and day 15 for pending parents.",
  },
  {
    q: "What should I track besides collection percentage?",
    a: "Track aging buckets, repeat late payers, and batch-wise dues. This helps identify structural payment risk early.",
  },
]

useSeoMeta({
  title: "Tuition Fee Collection Status Tracker (Free) | MemberBook",
  description: "Track tuition fee collections, outstanding dues, and overdue payment risk for coaching institutes.",
  ogTitle: "Tuition Fee Collection Status Tracker (Free) | MemberBook",
  ogDescription: "Track tuition fee collections, outstanding dues, and overdue payment risk for coaching institutes.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Tuition Fee Collection Status Tracker (Free) | MemberBook",
  twitterDescription: "Track tuition fee collections, outstanding dues, and overdue payment risk for coaching institutes.",
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
        name: "Tuition Fee Collection Status Tracker",
        description: "Free tuition collection tracker",
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
