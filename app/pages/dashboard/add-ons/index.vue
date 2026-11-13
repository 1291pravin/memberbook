<template>
  <div class="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Add-ons</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-600">
        MemberBook stays free. Switch on extra help when you want it. Paid add-ons are free for the first
        {{ data?.trialDays ?? 30 }} days, except WhatsApp reminders, which are paid upfront because WhatsApp charges us for every message. You can switch any add-on off at any time.
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
            <li v-for="item in bill.items" :key="item.addOn">{{ item.name }}: {{ formatCurrency(item.amount) }}</li>
          </ul>
          <p class="mt-2 text-2xl font-bold text-slate-800">{{ formatCurrency(bill.amount) }}</p>
          <p v-if="bill.status === 'claimed'" class="mt-1 text-sm text-slate-600">UPI reference {{ bill.upiRef }}. We'll confirm within a day.</p>
          <p v-else-if="bill.items.some(i => i.prepaid)" class="mt-1 text-sm text-slate-600">WhatsApp reminders start the morning after we confirm your payment.</p>
        </div>

        <div v-if="bill.status === 'due' && isOwner" class="w-full space-y-3 sm:w-64">
          <template v-if="bill.upiLink">
            <div class="flex justify-center rounded-2xl bg-white p-3" v-html="qrSvg(bill.upiLink)" />
            <a :href="bill.upiLink" class="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700">
              Pay with any UPI app
            </a>
            <p class="text-center text-xs text-slate-600">Or pay {{ data?.billing.upiId }} ({{ data?.billing.payeeName }})</p>
          </template>
          <p v-else class="text-sm text-slate-700">We'll send you payment details on WhatsApp.</p>
          <form class="space-y-2" @submit.prevent="claimBill(bill.id)">
            <AppInput v-model="upiRefs[bill.id]" label="Paid? Enter the UPI reference number" placeholder="12-digit number from your UPI app" />
            <AppButton type="submit" size="sm" class="w-full" :loading="claiming === bill.id">I have paid</AppButton>
          </form>
        </div>
      </div>
    </AppCard>

    <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-if="pending" class="grid gap-4 sm:grid-cols-2">
      <div v-for="i in 4" :key="i" class="h-56 animate-pulse rounded-3xl bg-slate-100" />
    </div>

    <template v-else>
      <section>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Ready now</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <AddOnCard
            v-for="a in readyAddOns"
            :key="a.key"
            :add-on="a"
            :is-owner="isOwner"
            :busy="busy === a.key"
            @start="act(a.key, 'start')"
            @stop="act(a.key, 'stop')"
            @notify="act(a.key, 'notify')"
          />
        </div>
      </section>

      <section v-if="soonAddOns.length">
        <h2 class="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">Coming soon</h2>
        <p class="mb-3 text-sm text-slate-600">Tap "Tell me when it's ready" on the ones you want. It helps us decide what to build first.</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <AddOnCard
            v-for="a in soonAddOns"
            :key="a.key"
            :add-on="a"
            :is-owner="isOwner"
            :busy="busy === a.key"
            @start="act(a.key, 'start')"
            @stop="act(a.key, 'stop')"
            @notify="act(a.key, 'notify')"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { renderSVG } from "uqr";

definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Add-ons - MemberBook" });

interface AddOnItem {
  key: string;
  name: string;
  tagline: string;
  points: string[];
  price: number;
  page: string | null;
  ready: boolean;
  available: boolean;
  status: "off" | "active" | "notify";
  trialEndsOn: string | null;
  prepaid?: boolean;
  paidUntil?: string | null;
}
interface Bill {
  id: number;
  period: string;
  amount: number;
  items: { addOn: string; name: string; amount: number; prepaid?: boolean; startsOn?: string }[];
  status: string;
  upiRef: string | null;
  upiLink: string | null;
}
interface AddOnsData {
  role: string;
  trialDays: number;
  addOns: AddOnItem[];
  bills: Bill[];
  billing: { upiId: string | null; payeeName: string };
}

const { orgId, currentOrg } = useOrg();
const { api } = useApi();
const { formatCurrency } = useFormatCurrency();
const isOwner = computed(() => currentOrg.value?.role === "owner");

const { data, pending, refresh } = await useFetch<AddOnsData>(() => `/api/orgs/${orgId.value}/add-ons`, {
  key: `add-ons-${orgId.value}`,
});

const readyAddOns = computed(() => (data.value?.addOns ?? []).filter(a => a.available));
const soonAddOns = computed(() => (data.value?.addOns ?? []).filter(a => !a.available));

const busy = ref<string | null>(null);
const error = ref("");

async function act(key: string, action: "start" | "stop" | "notify") {
  busy.value = key;
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/switch`, { method: "POST", body: JSON.stringify({ addOn: key, action }) });
    await refresh();
    const item = data.value?.addOns.find(a => a.key === key);
    if (action === "start" && item?.page && !item.prepaid) await navigateTo(item.page);
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
    return `Pay to start: 30 days from ${from}`;
  }
  return `Add-ons bill for ${monthLabel(bill.period)}`;
}

function monthLabel(period: string) {
  return new Date(`${period}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
</script>
