<template>
  <div>
    <section class="bg-slate-50 py-16 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800">
          Free Gym, Tuition, and Library Management Tools
        </h1>
        <p class="mt-4 text-lg text-slate-600">
          Use conversion-focused free tools to plan pricing, track collections, generate invoices, and improve renewals.
        </p>
        <p class="mt-3 text-sm text-slate-600">
          Most used tool:
          <NuxtLink to="/tools/gym-membership-revenue-calculator" class="font-medium text-primary-700 hover:text-primary-800">
            Gym Membership Revenue Calculator
          </NuxtLink>
        </p>
      </div>
    </section>

    <section class="py-14 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-2xl font-semibold text-slate-800 mb-8">
          Free Tools - Ready to Use
        </h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="tool in liveTools"
            :key="tool.href"
            :to="tool.href"
            class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <h3 class="text-lg font-semibold text-slate-800 mb-2">
              {{ tool.title }}
            </h3>
            <p class="text-sm text-slate-600 flex-1 mb-5">
              {{ tool.description }}
            </p>
            <div class="mt-auto">
              <span class="inline-flex items-center justify-center rounded-lg font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 text-sm w-full text-center">
                {{ tool.cta }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="py-12 px-4 bg-slate-50">
      <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl p-5">
          <h3 class="text-slate-800 font-semibold mb-2">Built for SEO + Conversions</h3>
          <p class="text-sm text-slate-600">Each tool page includes intent-matched copy, FAQs, schema markup, and clear onboarding CTA blocks.</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5">
          <h3 class="text-slate-800 font-semibold mb-2">No Sign-up Required</h3>
          <p class="text-sm text-slate-600">Visitors get immediate value first. Then we guide them naturally to register for automation and analytics.</p>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-5">
          <h3 class="text-slate-800 font-semibold mb-2">Ideal for India SMBs</h3>
          <p class="text-sm text-slate-600">Focused on gyms, tuition centers, and libraries with INR pricing and practical business workflows.</p>
        </div>
      </div>
    </section>

    <section class="py-16 px-4">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl font-semibold text-slate-800 mb-3">
          Want a custom tool for your niche?
        </h2>
        <p class="text-slate-600 mb-8">
          Tell us your workflow. We can build a free tool for it and connect it with MemberBook onboarding.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink to="/contact">
            <AppButton variant="secondary" size="lg">
              Request a Tool
            </AppButton>
          </NuxtLink>
          <NuxtLink to="/register">
            <AppButton variant="primary" size="lg">
              Try MemberBook Free
            </AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" })

const config = useRuntimeConfig()
const appUrl = config.public.appUrl || "https://memberbook.app"

const liveTools = [
  {
    title: "WhatsApp Gym Renewal Reminder Generator",
    description: "Generate personalized WhatsApp reminder messages for expiring gym memberships in English and Hinglish.",
    href: "/tools/whatsapp-gym-renewal-reminder",
    cta: "Generate Message ->",
  },
  {
    title: "Tuition Fee Receipt Generator",
    description: "Create professional tuition or coaching fee receipts and download PDF instantly.",
    href: "/tools/tuition-fee-receipt-generator",
    cta: "Generate Receipt ->",
  },
  {
    title: "Gym Membership Revenue Calculator",
    description: "Estimate monthly and annual revenue, default loss, and potential recovery.",
    href: "/tools/gym-membership-revenue-calculator",
    cta: "Calculate Revenue ->",
  },
  {
    title: "Library Membership Fee Structure Planner",
    description: "Plan optimal monthly, quarterly, and yearly fees based on seats, occupancy, and target revenue.",
    href: "/tools/library-membership-fee-structure-planner",
    cta: "Plan Fees ->",
  },
  {
    title: "GST Invoice Generator for Coaching Institutes",
    description: "Create a GST-ready coaching invoice with subtotal, GST, and final amount in seconds.",
    href: "/tools/gst-invoice-generator-coaching-institutes",
    cta: "Create Invoice ->",
  },
  {
    title: "Gym Churn Rate and Retention Calculator",
    description: "Measure churn, retention, and net growth to understand member leakage and improve renewals.",
    href: "/tools/gym-churn-rate-retention-calculator",
    cta: "Calculate Churn ->",
  },
  {
    title: "Tuition Fee Collection Status Tracker",
    description: "Track fee collection percentage, dues, and overdue risk for your coaching center.",
    href: "/tools/tuition-fee-collection-status-tracker",
    cta: "Track Collection ->",
  },
  {
    title: "Gym Subscription Plan Price Optimizer",
    description: "Find low, recommended, and premium membership price points from your costs and target margin.",
    href: "/tools/gym-subscription-plan-price-optimizer",
    cta: "Optimize Price ->",
  },
]

useSeoMeta({
  title: "Free Gym, Tuition and Library Business Tools | MemberBook",
  description: "Free business tools for gyms, tuition centers, and libraries: calculators, reminders, invoice generators, and planners designed to grow registrations.",
  ogTitle: "Free Gym, Tuition and Library Business Tools | MemberBook",
  ogDescription: "Free business tools for gyms, tuition centers, and libraries: calculators, reminders, invoice generators, and planners designed to grow registrations.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/tools`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Free Gym, Tuition and Library Business Tools | MemberBook",
  twitterDescription: "Free business tools for gyms, tuition centers, and libraries: calculators, reminders, invoice generators, and planners designed to grow registrations.",
  twitterImage: `${appUrl}/og-image.png`,
})

useHead({
  link: [{ rel: "canonical", href: `${appUrl}/tools` }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Free business tools by MemberBook",
        url: `${appUrl}/tools`,
        itemListElement: liveTools.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.title,
          url: `${appUrl}${tool.href}`,
        })),
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: appUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Free Tools",
            item: `${appUrl}/tools`,
          },
        ],
      }),
    },
  ],
})
</script>
