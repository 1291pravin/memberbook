<template>
  <div>
    <!-- Hero -->
    <section class="bg-slate-50 py-14 px-4 text-center">
      <div class="max-w-3xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="flex items-center justify-center gap-2 text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600 transition-colors">Home</NuxtLink>
          <span class="text-slate-400">/</span>
          <NuxtLink to="/tools" class="hover:text-primary-600 transition-colors">Free Tools</NuxtLink>
          <span class="text-slate-400">/</span>
          <span class="text-slate-800 font-medium">Gym Revenue Calculator</span>
        </nav>

        <h1 class="text-4xl font-bold text-slate-800">
          Gym Membership Revenue Calculator
        </h1>
        <p class="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Calculate your gym's monthly and annual revenue across plans. See how default rates impact your income — and what you could recover.
        </p>
      </div>
    </section>

    <!-- Calculator -->
    <section class="py-12 px-4">
      <div class="max-w-6xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-8 items-start">

          <!-- Left: Inputs -->
          <div>
            <h2 class="text-xl font-semibold text-slate-800 mb-5">Your Membership Plans</h2>

            <!-- Plan Rows -->
            <div>
              <div
                v-for="plan in plans"
                :key="plan.id"
                class="bg-white border border-slate-200 rounded-lg p-4 mb-3"
              >
                <div class="flex items-center justify-between mb-3">
                  <label class="text-sm font-medium text-slate-700">Plan Name</label>
                  <button
                    v-if="plans.length > 1"
                    type="button"
                    class="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none"
                    aria-label="Remove plan"
                    @click="removePlan(plan.id)"
                  >
                    &times;
                  </button>
                </div>
                <input
                  v-model="plan.name"
                  type="text"
                  placeholder="Monthly Plan"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                >
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">Price per month (₹)</label>
                    <input
                      v-model.number="plan.price"
                      type="number"
                      min="0"
                      placeholder="1500"
                      class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">Number of members</label>
                    <input
                      v-model.number="plan.members"
                      type="number"
                      min="0"
                      placeholder="30"
                      class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Plan -->
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors mt-1 mb-8"
              @click="addPlan"
            >
              <span class="text-lg leading-none">+</span> Add Another Plan
            </button>

            <!-- Sliders -->
            <div class="space-y-7">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-slate-700">Default Rate</label>
                  <span class="text-sm font-semibold text-slate-800">{{ defaultRate }}%</span>
                </div>
                <p class="text-xs text-slate-600 mb-2">Members who don't renew: {{ defaultRate }}%</p>
                <input
                  v-model.number="defaultRate"
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  class="w-full accent-green-500"
                >
                <div class="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>40%</span>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-slate-700">Annual Renewal Rate</label>
                  <span class="text-sm font-semibold text-slate-800">{{ renewalRate }}%</span>
                </div>
                <p class="text-xs text-slate-600 mb-2">Members who renew annually: {{ renewalRate }}%</p>
                <input
                  v-model.number="renewalRate"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  class="w-full accent-green-500"
                >
                <div class="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Results -->
          <div class="space-y-6">
            <h2 class="text-xl font-semibold text-slate-800">Revenue Breakdown</h2>

            <!-- Revenue Cards 2×2 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
                <p class="text-xs font-medium text-slate-600 mb-1">Monthly Gross Revenue</p>
                <p class="text-2xl font-bold text-slate-800">{{ formatCurrency(monthlyGross) }}</p>
              </div>
              <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
                <p class="text-xs font-medium text-slate-600 mb-1">Monthly Net Revenue</p>
                <p class="text-2xl font-bold text-slate-800">{{ formatCurrency(monthlyNet) }}</p>
              </div>
              <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
                <p class="text-xs font-medium text-slate-600 mb-1">Annual Revenue (projected)</p>
                <p class="text-2xl font-bold text-slate-800">{{ formatCurrency(annualRevenue) }}</p>
              </div>
              <div class="bg-white border border-slate-200 rounded-xl p-5 text-center">
                <p class="text-xs font-medium text-slate-600 mb-1">Revenue Lost to Defaults/yr</p>
                <p class="text-2xl font-bold text-red-600">{{ formatCurrency(annualDefaultLoss) }}</p>
              </div>
            </div>

            <!-- Plan Breakdown Bars -->
            <div class="bg-white border border-slate-200 rounded-xl p-5">
              <h3 class="text-sm font-semibold text-slate-700 mb-4">Plan Breakdown</h3>
              <div v-if="monthlyGross > 0" class="space-y-3">
                <div v-for="plan in plans" :key="plan.id">
                  <div class="flex items-center justify-between text-xs text-slate-700 mb-1">
                    <span class="font-medium truncate max-w-[140px]">{{ plan.name || 'Unnamed Plan' }}</span>
                    <span class="text-slate-600 ml-2 shrink-0">
                      {{ formatCurrency(plan.price * plan.members) }}
                      <span class="text-slate-500">({{ planPercentage(plan) }}%)</span>
                    </span>
                  </div>
                  <div class="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-4 bg-primary-500 rounded-full transition-all duration-300"
                      :style="{ width: planPercentage(plan) + '%' }"
                    />
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-slate-500">Enter plan details to see breakdown.</p>
            </div>

            <!-- Gross vs Net Bar -->
            <div class="bg-white border border-slate-200 rounded-xl p-5">
              <h3 class="text-sm font-semibold text-slate-700 mb-4">Gross vs Net (Monthly)</h3>
              <div class="space-y-2">
                <div>
                  <div class="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Gross Revenue</span>
                    <span>{{ formatCurrency(monthlyGross) }}</span>
                  </div>
                  <div class="h-4 bg-slate-200 rounded-full" />
                </div>
                <div>
                  <div class="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Net Revenue (after defaults)</span>
                    <span>{{ formatCurrency(monthlyNet) }}</span>
                  </div>
                  <div class="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="h-4 bg-primary-500 rounded-full transition-all duration-300"
                      :style="{ width: (100 - defaultRate) + '%' }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- What If Section -->
            <div class="bg-white border border-slate-200 rounded-xl p-5">
              <h3 class="text-sm font-semibold text-slate-700 mb-1">What If You Reduced Defaults?</h3>
              <p class="text-xs text-slate-600 mb-4">
                Extra annual revenue you'd recover by lowering your default rate.
              </p>
              <div v-if="defaultRate > 0 && annualDefaultLoss > 0" class="space-y-3">
                <div
                  v-for="reduction in whatIfReductions"
                  :key="reduction.by"
                  class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <span class="text-sm text-slate-700">
                    Reduce defaults by {{ reduction.by }}%
                  </span>
                  <span class="text-sm font-semibold text-green-600">
                    + {{ formatCurrency(reduction.recovery) }}/yr
                  </span>
                </div>
              </div>
              <p v-else-if="defaultRate === 0" class="text-sm text-slate-500">
                Your default rate is already at 0% — great job!
              </p>
              <p v-else class="text-sm text-slate-500">
                Enter plan details to see recovery potential.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Conversion CTA -->
    <section class="py-12 px-4">
      <div class="max-w-2xl mx-auto">
        <div class="bg-primary-50 border border-primary-200 rounded-xl p-6 text-center">
          <p class="text-lg font-semibold text-slate-800 mb-2">
            Are you actually hitting
            <span class="text-primary-700">{{ formatCurrency(monthlyNet) }}</span>
            every month?
          </p>
          <p class="text-slate-600 mb-6 text-sm">
            MemberBook shows your real revenue vs this projection — and alerts you when members are about to default.
          </p>
          <NuxtLink to="/register">
            <AppButton variant="primary" size="lg">
              Try MemberBook Free →
            </AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-14 px-4 bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-semibold text-slate-800 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        <div class="space-y-4">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="bg-white border border-slate-200 rounded-xl p-6"
          >
            <h3 class="text-base font-semibold text-slate-800 mb-2">{{ faq.q }}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
interface Plan {
  id: number
  name: string
  price: number
  members: number
}

definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

// --- Reactive state ---

const plans = ref<Plan[]>([
  { id: 1, name: "Monthly Plan", price: 1500, members: 30 },
  { id: 2, name: "Quarterly Plan", price: 4000, members: 15 },
]);
const defaultRate = ref(15);
const renewalRate = ref(70);
let nextId = 3;

// --- Plan management ---

function addPlan() {
  plans.value.push({ id: nextId++, name: "", price: 0, members: 0 });
}

function removePlan(id: number) {
  if (plans.value.length > 1) {
    plans.value = plans.value.filter(p => p.id !== id);
  }
}

// --- Computed revenue values ---

const monthlyGross = computed(() =>
  plans.value.reduce((sum, p) => sum + (p.price * p.members), 0),
);

const monthlyNet = computed(() =>
  Math.round(monthlyGross.value * (1 - defaultRate.value / 100)),
);

const annualRevenue = computed(() => monthlyNet.value * 12);

const annualDefaultLoss = computed(() =>
  (monthlyGross.value - monthlyNet.value) * 12,
);

// --- Helpers ---

function planPercentage(plan: Plan): number {
  if (monthlyGross.value === 0) return 0;
  return Math.round((plan.price * plan.members) / monthlyGross.value * 100);
}

function formatCurrency(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

function whatIfRecovery(reduceBy: number): number {
  if (defaultRate.value === 0) return 0;
  const currentDefaultRevenue = monthlyGross.value - monthlyNet.value;
  return Math.round(currentDefaultRevenue * (reduceBy / defaultRate.value) * 12);
}

const whatIfReductions = computed(() => {
  const reductions = [10, 20, 50];
  return reductions
    .filter(r => r <= defaultRate.value)
    .map(r => ({ by: r, recovery: whatIfRecovery(r) }));
});

// --- FAQ content ---

const faqs = [
  {
    q: "How much revenue does a gym make per month in India?",
    a: "A small gym with 50–100 members and an average membership of ₹1,500/month can expect ₹75,000–₹1,50,000 in gross monthly revenue. Larger gyms in metro cities with premium plans can earn ₹3–10 lakh/month. Net revenue depends heavily on your default (non-renewal) rate, which typically ranges from 15–25% for monthly plans.",
  },
  {
    q: "How do I calculate my gym's monthly membership income?",
    a: "Multiply the number of active members on each plan by that plan's monthly price, then sum across all plans. For example: 30 members × ₹1,500 + 15 members × ₹1,333 (quarterly plan amortised) = ₹45,000 + ₹20,000 = ₹65,000 gross monthly. Subtract your default rate to get net revenue.",
  },
  {
    q: "What is a good default rate for gym memberships in India?",
    a: "Industry average default (non-renewal) rates in India range from 15–25% per month for monthly plans, meaning 1 in 4–6 members does not renew. Gyms using automated reminders and online payments often bring this down to 8–12%. A default rate below 10% is considered excellent for the Indian market.",
  },
  {
    q: "How can I increase my gym's annual revenue?",
    a: "Three proven strategies work best: first, reduce default rates through timely WhatsApp and SMS renewal reminders; second, upsell members to longer-term plans (quarterly or annual) which have lower churn; and third, introduce add-on services like personal training, diet plans, or locker fees. Even a 5% reduction in defaults can add lakhs to your annual revenue.",
  },
  {
    q: "What is the average gym membership price in India?",
    a: "Monthly gym memberships in India typically range from ₹800 to ₹3,000 depending on city and facilities. Tier-1 cities like Mumbai and Bengaluru average ₹1,500–₹3,000, while tier-2 and tier-3 cities see ₹800–₹1,500. Premium gyms with equipment and classes can charge ₹4,000–₹8,000/month.",
  },
  {
    q: "How do I reduce payment defaults in my gym?",
    a: "Automated renewal reminders via WhatsApp or SMS — sent 7 days and 1 day before expiry — are the most effective tactic, reducing defaults by 30–50%. Easy online payment links, loyalty discounts for early renewal, and tracking expiry dates in a member management system also help significantly. MemberBook automates all of this.",
  },
  {
    q: "Is there free software to track gym membership revenue?",
    a: "Yes. MemberBook is free to start and gives you a real-time revenue dashboard, expiry tracking, and automated WhatsApp renewal reminders. It is built specifically for Indian gyms and supports all common membership plan types. You can sign up and start tracking your revenue within minutes.",
  },
];

// --- SEO & Schemas ---

useSeoMeta({
  title: "Gym Membership Revenue Calculator — Free for Indian Gyms",
  description:
    "Calculate your gym's monthly and annual membership revenue. See the impact of default rates and 'what if' scenarios. Free tool for Indian gym owners.",
  ogTitle: "Gym Membership Revenue Calculator — Free for Indian Gyms",
  ogDescription:
    "Calculate your gym's monthly and annual membership revenue. See the impact of default rates and 'what if' scenarios. Free tool for Indian gym owners.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/tools/gym-membership-revenue-calculator`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "Gym Membership Revenue Calculator — Free for Indian Gyms",
  twitterDescription:
    "Calculate your gym's monthly and annual membership revenue. See the impact of default rates and 'what if' scenarios. Free tool for Indian gym owners.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/tools/gym-membership-revenue-calculator` },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Gym Membership Revenue Calculator",
        "description": "Calculate monthly and annual gym membership revenue with default rate analysis",
        "url": `${appUrl}/tools/gym-membership-revenue-calculator`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR",
        },
      }),
    },
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
            "name": "Free Tools",
            "item": `${appUrl}/tools`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Gym Revenue Calculator",
            "item": `${appUrl}/tools/gym-membership-revenue-calculator`,
          },
        ],
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How much revenue does a gym make per month in India?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A small gym with 50–100 members and an average membership of ₹1,500/month can expect ₹75,000–₹1,50,000 in gross monthly revenue. Larger gyms in metro cities with premium plans can earn ₹3–10 lakh/month. Net revenue depends heavily on your default (non-renewal) rate, which typically ranges from 15–25% for monthly plans.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I calculate my gym's monthly membership income?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Multiply the number of active members on each plan by that plan's monthly price, then sum across all plans. For example: 30 members × ₹1,500 + 15 members × ₹1,333 (quarterly plan amortised) = ₹45,000 + ₹20,000 = ₹65,000 gross monthly. Subtract your default rate to get net revenue.",
            },
          },
          {
            "@type": "Question",
            "name": "What is a good default rate for gym memberships in India?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Industry average default (non-renewal) rates in India range from 15–25% per month for monthly plans, meaning 1 in 4–6 members does not renew. Gyms using automated reminders and online payments often bring this down to 8–12%. A default rate below 10% is considered excellent for the Indian market.",
            },
          },
          {
            "@type": "Question",
            "name": "How can I increase my gym's annual revenue?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Three proven strategies work best: first, reduce default rates through timely WhatsApp and SMS renewal reminders; second, upsell members to longer-term plans (quarterly or annual) which have lower churn; and third, introduce add-on services like personal training, diet plans, or locker fees. Even a 5% reduction in defaults can add lakhs to your annual revenue.",
            },
          },
          {
            "@type": "Question",
            "name": "What is the average gym membership price in India?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Monthly gym memberships in India typically range from ₹800 to ₹3,000 depending on city and facilities. Tier-1 cities like Mumbai and Bengaluru average ₹1,500–₹3,000, while tier-2 and tier-3 cities see ₹800–₹1,500. Premium gyms with equipment and classes can charge ₹4,000–₹8,000/month.",
            },
          },
          {
            "@type": "Question",
            "name": "How do I reduce payment defaults in my gym?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Automated renewal reminders via WhatsApp or SMS — sent 7 days and 1 day before expiry — are the most effective tactic, reducing defaults by 30–50%. Easy online payment links, loyalty discounts for early renewal, and tracking expiry dates in a member management system also help significantly. MemberBook automates all of this.",
            },
          },
          {
            "@type": "Question",
            "name": "Is there free software to track gym membership revenue?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. MemberBook is free to start and gives you a real-time revenue dashboard, expiry tracking, and automated WhatsApp renewal reminders. It is built specifically for Indian gyms and supports all common membership plan types. You can sign up and start tracking your revenue within minutes.",
            },
          },
        ],
      }),
    },
  ],
});
</script>
