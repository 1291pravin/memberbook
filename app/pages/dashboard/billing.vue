<template>
  <div class="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Your MemberBook plan</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-600">
        MemberBook is free, and we set it up for you for free. Pick a paid plan when you want us to do more of the work.
        Paid plans start with {{ trialDays }} days free, nothing is charged automatically, and you can move back to Free any time.
      </p>
    </div>

    <!-- Bills -->
    <AppCard v-for="bill in data?.bills ?? []" :key="bill.id" class="!border-amber-300 !bg-amber-50">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-base font-semibold text-slate-800">
            {{ bill.status === 'claimed' ? 'Thanks, we are checking your payment' : billTitle(bill) }}
          </p>
          <ul class="mt-1 text-sm text-slate-700">
            <li v-for="item in bill.items" :key="item.name">{{ item.name }}: {{ formatCurrency(item.amount) }}</li>
          </ul>
          <p class="mt-2 text-2xl font-bold text-slate-800">{{ formatCurrency(bill.amount) }}</p>
          <p v-if="bill.status === 'claimed'" class="mt-1 text-sm text-slate-600">UPI reference {{ bill.upiRef }}. We'll confirm within a day.</p>
          <p v-else-if="bill.items.some(i => i.prepaid)" class="mt-1 text-sm text-slate-600">Your plan starts the morning after we confirm your payment.</p>
        </div>

        <div v-if="bill.status === 'due' && isOwner" class="w-full space-y-3 sm:w-64">
          <template v-if="bill.upiLink">
            <div class="flex justify-center rounded-2xl bg-white p-3" v-html="qrSvg(bill.upiLink)" />
            <a :href="bill.upiLink" class="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700">
              Pay with any UPI app
            </a>
            <p class="text-center text-xs text-slate-600">Or pay {{ data?.billing.upiId }} ({{ data?.billing.payeeName }})</p>
          </template>
          <p v-else class="text-sm text-slate-700">We'll send you payment details by email.</p>
          <form class="space-y-2" @submit.prevent="claimBill(bill.id)">
            <AppInput v-model="upiRefs[bill.id]" label="Paid? Enter the UPI reference number" placeholder="12-digit number from your UPI app" />
            <AppButton type="submit" size="sm" class="w-full" :loading="claiming === bill.id">I have paid</AppButton>
          </form>
        </div>
      </div>
    </AppCard>

    <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="notice" class="rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-slate-800">{{ notice }}</p>

    <!-- Monthly / yearly -->
    <div class="flex items-center gap-3">
      <div class="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="radiogroup" aria-label="Billing">
        <button
          v-for="c in (['monthly', 'yearly'] as const)"
          :key="c"
          type="button"
          role="radio"
          :aria-checked="cycle === c"
          class="rounded-lg px-4 py-1.5 text-sm font-semibold"
          :class="cycle === c ? 'bg-primary-600 text-white' : 'text-slate-700 hover:bg-slate-50'"
          @click="cycle = c"
        >
          {{ c === 'monthly' ? 'Monthly' : 'Yearly' }}
        </button>
      </div>
      <span class="text-sm font-medium text-primary-700">Yearly: 2 months free</span>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-96 animate-pulse rounded-3xl bg-slate-100" />
    </div>

    <div v-else class="grid gap-4 md:grid-cols-3">
      <div
        v-for="p in PLANS"
        :key="p.key"
        class="flex flex-col rounded-3xl border bg-white p-5"
        :class="current === p.key ? 'border-primary-400 ring-2 ring-primary-200' : 'border-slate-200'"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="text-xl font-bold text-slate-800">{{ p.name }}</h2>
          <AppBadge v-if="current === p.key" color="green">Your plan</AppBadge>
          <AppBadge v-else-if="p.key === 'autopilot'" color="blue">Most popular</AppBadge>
        </div>
        <p class="mt-1 text-sm text-slate-600">{{ p.tagline }}</p>

        <p class="mt-4 text-slate-800">
          <template v-if="p.monthly === 0">
            <span class="text-3xl font-bold">₹0</span><span class="text-sm text-slate-600"> forever</span>
          </template>
          <template v-else-if="cycle === 'yearly'">
            <span class="text-3xl font-bold">{{ planRupees(p.yearly) }}</span><span class="text-sm text-slate-600"> a year</span>
            <span class="block text-xs text-slate-600">Works out to {{ planRupees(Math.round(p.yearly / 12 / 100) * 100) }} a month</span>
          </template>
          <template v-else>
            <span class="text-3xl font-bold">{{ planRupees(p.monthly) }}</span><span class="text-sm text-slate-600"> a month</span>
          </template>
        </p>

        <p v-if="current === p.key && statusLine" class="mt-1 text-xs font-medium" :class="statusLine.ok ? 'text-primary-700' : 'text-amber-700'">
          {{ statusLine.text }}
        </p>

        <p v-if="p.includes" class="mt-4 text-sm font-semibold text-slate-700">Everything in {{ planName(p.includes) }}, plus:</p>
        <ul class="mt-2 space-y-1.5 text-sm text-slate-700" :class="{ 'mt-4': !p.includes }">
          <li v-for="f in p.features" :key="f.text" class="flex gap-2">
            <svg class="mt-0.5 h-4 w-4 shrink-0" :class="f.soon ? 'text-slate-400' : 'text-primary-600'" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span>{{ f.text }}<span v-if="f.soon" class="ml-1 whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Coming soon</span></span>
          </li>
        </ul>
        <p v-if="p.reminders" class="mt-3 text-xs text-slate-600">
          More than {{ p.reminders.toLocaleString('en-IN') }} reminders in a month? Each extra one is 20 paise, on next month's bill.
        </p>

        <div class="mt-auto pt-5">
          <template v-if="!isOwner">
            <p class="text-xs text-slate-600">Only the owner can change the plan.</p>
          </template>
          <template v-else-if="current === p.key">
            <AppButton v-if="p.key !== 'free' && data?.plan.cycle !== cycle" size="sm" variant="secondary" class="w-full" :loading="busy === p.key" @click="choose(p.key)">
              Switch to {{ cycle }} billing
            </AppButton>
            <p v-else class="text-center text-sm font-medium text-slate-600">You're on this plan</p>
          </template>
          <AppButton v-else-if="p.key === 'free'" size="sm" variant="ghost" class="w-full" :loading="busy === p.key" @click="choose('free')">
            Move to Free
          </AppButton>
          <AppButton v-else size="sm" class="w-full" :variant="isUpgrade(p.key) && (p.key === 'autopilot' || current === 'autopilot') ? 'primary' : 'secondary'" :loading="busy === p.key" @click="choose(p.key)">
            {{ buttonText(p.key) }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Tools -->
    <section>
      <h2 class="mb-1 text-lg font-bold text-slate-800">Your tools</h2>
      <p class="mb-3 text-sm text-slate-600">Open any of these to set it up.</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <NuxtLink
          v-for="tool in tools"
          :key="tool.to"
          :to="tool.to"
          class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-primary-300"
        >
          <div class="min-w-0">
            <p class="font-semibold text-slate-800">{{ tool.name }}</p>
            <p class="text-sm text-slate-600">{{ tool.text }}</p>
          </div>
          <AppBadge v-if="tool.pro && current !== 'pro' && !tool.on" color="blue">Pro</AppBadge>
          <AppBadge v-else-if="tool.on" color="green">On</AppBadge>
          <AppBadge v-else color="gray">Free</AppBadge>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { renderSVG } from "uqr";

definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Your plan - MemberBook" });

interface Bill {
  id: number;
  period: string;
  amount: number;
  items: { addOn: string; name: string; amount: number; prepaid?: boolean; startsOn?: string; days?: number }[];
  status: string;
  upiRef: string | null;
  upiLink: string | null;
}
interface PlanData {
  role: string;
  businessType: string | null;
  plan: {
    plan: PlanKey;
    name: string;
    cycle: BillingCycle;
    paid: boolean;
    paidUntil: string | null;
    inTrial: boolean;
    trialEndsOn: string | null;
    trialUsed: { autopilot: boolean; pro: boolean };
  };
  hasUpiId: boolean;
  autoRemindersEnabled: boolean;
  features: Record<string, boolean>;
  bills: Bill[];
  billing: { upiId: string | null; payeeName: string };
}

const route = useRoute();
const { orgId, currentOrg } = useOrg();
const { api } = useApi();
const { formatCurrency } = useFormatCurrency();
const isOwner = computed(() => currentOrg.value?.role === "owner");
const trialDays = PLAN_TRIAL_DAYS;

const { data, pending, refresh } = await useFetch<PlanData>(() => `/api/orgs/${orgId.value}/plan`, {
  key: `plan-${orgId.value}`,
});

const current = computed<PlanKey>(() => data.value?.plan.plan ?? "free");
const cycle = ref<BillingCycle>(route.query.cycle === "yearly" ? "yearly" : "monthly");
watch(() => data.value?.plan.cycle, (c) => {
  if (c && current.value !== "free" && route.query.cycle !== "yearly") cycle.value = c;
}, { immediate: true });

function planName(key: PlanKey) {
  return getPlanDef(key).name;
}

function prettyDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const statusLine = computed(() => {
  const p = data.value?.plan;
  if (!p || p.plan === "free") return null;
  if (p.inTrial && p.trialEndsOn) return { ok: true, text: `Free trial until ${prettyDate(p.trialEndsOn)}` };
  if (p.paid && p.paidUntil) return { ok: true, text: `Paid until ${prettyDate(p.paidUntil)}` };
  return { ok: false, text: "Waiting for payment. Pay the bill above to start." };
});

const RANK: Record<PlanKey, number> = { free: 0, autopilot: 1, pro: 2 };
function isUpgrade(key: PlanKey) {
  return RANK[key] > RANK[current.value];
}

function buttonText(key: PlanKey) {
  const used = data.value?.plan.trialUsed;
  const trial = key === "pro" ? !used?.pro : !used?.autopilot;
  if (trial) return `Start ${trialDays}-day free trial`;
  if (current.value === "pro" && key === "autopilot") return "Move to Autopilot";
  return `Switch to ${planName(key)}`;
}

const tools = computed(() => {
  const f = data.value?.features ?? {};
  const list = [
    { name: "Business page", text: "Your plans, prices and an enquiry form", to: "/dashboard/add-ons/business-page", on: f.business_page, pro: false },
    { name: "Google review poster", text: "A QR poster that gets you more reviews", to: "/dashboard/add-ons/review-poster", on: f.review_poster || f.reviews, pro: false },
    { name: "Member self check-in", text: "A QR poster at your door", to: "/dashboard/add-ons/check-in", on: f.self_check_in, pro: false },
    { name: "Payments that confirm themselves", text: "Connect your own Razorpay", to: "/dashboard/add-ons/online-payments", on: f.online_payments, pro: false },
    { name: "Your website", text: "Made for you from your details and photos", to: "/dashboard/add-ons/website", on: f.website, pro: true },
    { name: "Google review replies", text: "Reply drafts for you to check and post", to: "/dashboard/add-ons/reviews", on: f.reviews, pro: true },
  ];
  if (f.own_number) list.push({ name: "Your own WhatsApp number", text: "Reminders from your number", to: "/dashboard/add-ons/whatsapp", on: true, pro: true });
  return list;
});

const busy = ref<PlanKey | null>(null);
const error = ref("");
const notice = ref("");

async function choose(key: PlanKey) {
  if (key === "free" && !window.confirm(current.value === "pro"
    ? "Move to Free? Automatic reminders stop and your website goes offline."
    : "Move to Free? Automatic reminders stop. You can still send reminders yourself in one tap.")) return;
  busy.value = key;
  error.value = "";
  notice.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/plan`, { method: "POST", body: JSON.stringify({ plan: key, cycle: cycle.value }) });
    await refresh();
    const p = data.value?.plan;
    if (key === "free") notice.value = "You're on the Free plan now.";
    else if (p?.inTrial && p.trialEndsOn) {
      notice.value = data.value?.hasUpiId
        ? `Your ${p.name} trial is on until ${prettyDate(p.trialEndsOn)}. Reminders go out from tomorrow morning.`
        : `Your ${p.name} trial is on until ${prettyDate(p.trialEndsOn)}. Add your UPI ID in Fees due > Settings so reminders can start.`;
    }
    else if (p?.paid) notice.value = `You're on ${p.name}.`;
    else notice.value = `Pay the bill above to start ${p?.name}.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Something went wrong. Please try again.";
  }
  finally {
    busy.value = null;
  }
}

const upiRefs = reactive<Record<number, string>>({});
const claiming = ref<number | null>(null);
async function claimBill(id: number) {
  claiming.value = id;
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/bills/${id}/claim`, { method: "POST", body: JSON.stringify({ upiRef: upiRefs[id] || "" }) });
    await refresh();
  }
  catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Could not save. Please try again.";
  }
  finally {
    claiming.value = null;
  }
}

function qrSvg(text: string) {
  return renderSVG(text, { border: 1 }).replace("<svg ", "<svg width=\"176\" height=\"176\" role=\"img\" aria-label=\"UPI QR code\" ");
}

function billTitle(bill: Bill) {
  if (bill.period.length === 10) {
    const from = new Date(`${bill.period}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const days = bill.items.find(i => i.prepaid)?.days ?? 30;
    return days > 30 ? `Pay for 1 year from ${from}` : `Pay for 30 days from ${from}`;
  }
  if (bill.period.endsWith("-extra")) return `Extra reminders in ${monthLabel(bill.period.slice(0, 7))}`;
  return `Bill for ${monthLabel(bill.period)}`;
}

function monthLabel(period: string) {
  return new Date(`${period}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
</script>
