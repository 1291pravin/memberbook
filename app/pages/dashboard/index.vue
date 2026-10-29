<template>
  <div class="p-4 lg:p-6 space-y-5">
    <OnboardingProgressWidget />

    <header class="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="mt-1.5 text-2xl font-bold tracking-tight text-slate-800">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-600">Here’s what needs your attention today.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/dashboard/members/new">
          <AppButton size="sm">{{ t.addMember }}</AppButton>
        </NuxtLink>
        <NuxtLink to="/dashboard/payments">
          <AppButton size="sm" variant="secondary">Record Payment</AppButton>
        </NuxtLink>
      </div>
    </header>

    <!-- Demo Data Banner (shown when viewing sample data) -->
    <div v-if="hasDemoData && stats.activeMembers > 0" class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p class="text-sm text-amber-800">You're viewing <strong>sample data</strong>. Clear it when you're ready to add real {{ t.members.toLowerCase() }}.</p>
      </div>
      <AppButton size="sm" variant="secondary" :loading="clearingDemo" @click="clearDemoData">
        Clear Sample Data
      </AppButton>
    </div>

    <p v-if="dashError" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load the dashboard. Please refresh the page.</p>

    <!-- Activation Checklist (shown when no active members) -->
    <AppCard v-if="!dashError && stats.activeMembers === 0" class="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-slate-800">Welcome to MemberBook!</h2>
        <p class="text-sm text-slate-600 mt-1">Add your first 3 {{ t.members.toLowerCase() }} to see your dashboard come alive with stats, charts, and insights.</p>
      </div>
      <div class="space-y-3">
        <!-- Create a plan -->
        <NuxtLink
          v-if="plansCount === 0"
          to="/dashboard/plans"
          class="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-800 group-hover:text-primary-700">Create a subscription plan</p>
            <p class="text-xs text-slate-600">Set up pricing and duration for your {{ t.members.toLowerCase() }}</p>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </NuxtLink>
        <!-- Plan step completed indicator -->
        <div
          v-else
          class="flex items-center gap-3 bg-white/60 rounded-lg px-4 py-3"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p class="text-sm font-medium text-slate-600">Subscription plan created</p>
        </div>

        <!-- Add first member -->
        <NuxtLink
          to="/dashboard/members/new"
          class="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-800 group-hover:text-primary-700">Add your first {{ t.member.toLowerCase() }}</p>
            <p class="text-xs text-slate-600">Start tracking {{ t.members.toLowerCase() }} and their subscriptions</p>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </NuxtLink>

        <!-- Record a payment -->
        <NuxtLink
          to="/dashboard/payments"
          class="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-slate-800 group-hover:text-primary-700">Record a payment</p>
            <p class="text-xs text-slate-600">Track payments from your {{ t.members.toLowerCase() }}</p>
          </div>
          <svg class="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </NuxtLink>
      </div>

      <!-- Load Sample Data button -->
      <button
        class="mt-4 w-full flex items-center gap-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 px-4 py-3 hover:bg-amber-100 hover:border-amber-400 transition-colors group"
        :disabled="loadingDemo"
        @click="loadDemoData"
      >
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
          </svg>
        </div>
        <div class="flex-1 text-left">
          <p class="text-sm font-medium text-amber-800 group-hover:text-amber-900">
            {{ loadingDemo ? 'Loading sample data...' : 'Load sample data' }}
          </p>
          <p class="text-xs text-amber-600">See what a populated dashboard looks like</p>
        </div>
      </button>
    </AppCard>

    <!-- The figures and follow-ups below are backed by the organisation's live data. -->
    <template v-if="!dashError">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <NuxtLink v-for="card in priorityCards" :key="card.label" :to="card.to" class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary-200 sm:p-4">
          <div class="flex items-start gap-3">
            <span class="hidden rounded-lg p-2 sm:block" :class="card.tone"><component :is="card.icon" class="h-5 w-5" /></span>
            <div class="min-w-0">
              <p class="text-xs font-medium text-slate-600">{{ card.label }}</p>
              <p class="mt-2 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">{{ card.value }}</p>
              <p class="mt-1 text-xs text-slate-600">{{ card.helper }}</p>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="min-w-0 space-y-4">
          <AppCard>
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-base font-semibold text-slate-800">Needs attention</h2>
              <NuxtLink :to="attentionTab === 'renewals' ? '/dashboard/members' : '/dashboard/payments/pending'" class="text-sm font-medium text-primary-700">View all</NuxtLink>
            </div>
            <div class="mt-3 flex gap-5 border-b border-slate-200" aria-label="Follow-ups">
              <button type="button" class="border-b-2 py-3 text-sm font-medium" :class="attentionTab === 'renewals' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-600'" :aria-pressed="attentionTab === 'renewals'" @click="attentionTab = 'renewals'">Renewals & grace ({{ expiring.length }})</button>
              <button type="button" class="border-b-2 py-3 text-sm font-medium" :class="attentionTab === 'payments' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-600'" :aria-pressed="attentionTab === 'payments'" @click="attentionTab = 'payments'">Pending payments ({{ pending.length }})</button>
            </div>
            <p v-if="attentionTab === 'renewals' && expiringError" class="py-5 text-sm text-danger-700">Could not load renewals. Please refresh the page.</p>
            <p v-else-if="attentionTab === 'payments' && pendingError" class="py-5 text-sm text-danger-700">Could not load pending payments. Please refresh the page.</p>
            <p v-else-if="attentionItems.length === 0" class="py-6 text-sm text-slate-600">{{ attentionTab === 'renewals' ? 'No renewals due this week or in the grace period.' : 'No pending payments.' }}</p>
            <div v-else class="divide-y divide-slate-100">
              <div class="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7rem_7rem_9rem] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 lg:grid">
                <span>{{ t.member }}</span><span>Plan</span><span>End date</span><span>{{ attentionTab === 'renewals' ? 'Plan price' : 'Balance' }}</span><span>Action</span>
              </div>
              <div v-for="item in attentionItems" :key="item.key" class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_7rem_7rem_9rem] lg:px-3">
                <NuxtLink :to="`/dashboard/members/${item.memberId}`" class="truncate text-sm font-semibold text-slate-800 hover:text-primary-700">{{ item.name }}</NuxtLink>
                <span class="row-start-2 text-xs text-slate-600 lg:row-auto">{{ item.plan }}</span>
                <span class="row-start-3 text-xs text-slate-600 lg:row-auto">{{ formatDate(item.date) }}</span>
                <span class="col-start-2 row-start-1 text-right text-sm font-semibold text-slate-800 lg:col-auto lg:row-auto lg:text-left"><span class="block text-xs font-normal text-slate-600 lg:hidden">{{ attentionTab === 'renewals' ? 'Plan price' : 'Balance' }}</span>{{ formatCurrency(item.amount) }}</span>
                <a v-if="item.phone" :href="item.reminder" target="_blank" rel="noopener noreferrer" class="col-start-2 row-start-2 row-span-2 inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-green-700 hover:bg-green-50 lg:col-auto lg:row-auto">WhatsApp reminder</a>
                <NuxtLink v-else :to="`/dashboard/members/${item.memberId}`" class="col-start-2 row-start-2 row-span-2 text-right text-xs font-semibold text-primary-700 lg:col-auto lg:row-auto lg:text-left">View member</NuxtLink>
              </div>
            </div>
          </AppCard>
          <AppCard>
            <div class="mb-2 flex items-center justify-between"><h2 class="text-base font-semibold text-slate-800">Recent payments</h2><NuxtLink to="/dashboard/payments" class="text-sm font-medium text-primary-700">View all</NuxtLink></div>
            <p v-if="!recentPayments.length" class="py-4 text-sm text-slate-600">No payments recorded yet.</p>
            <div v-else class="divide-y divide-slate-100">
              <div v-for="payment in recentPayments" :key="payment.id" class="flex items-center justify-between gap-3 py-3">
                <div><p class="text-sm font-semibold text-slate-800">{{ payment.memberName }}</p><p class="mt-1 text-xs text-slate-600">{{ formatDate(payment.date) }}</p></div>
                <p class="text-sm font-semibold text-slate-800">{{ formatCurrency(payment.amount) }}</p>
              </div>
            </div>
          </AppCard>
        </div>
        <aside class="space-y-4">
          <AppCard>
            <h2 class="mb-3 text-base font-semibold text-slate-800">Quick actions</h2>
            <div class="space-y-2">
              <NuxtLink v-for="action in quickActions" :key="action.to" :to="action.to" class="flex min-h-11 items-center justify-between rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">{{ action.label }} <span aria-hidden="true" class="text-slate-600">→</span></NuxtLink>
            </div>
          </AppCard>
          <AppCard>
            <h2 class="text-base font-semibold text-slate-800">This month</h2>
            <div class="mt-3 flex items-center justify-between text-sm"><span class="text-slate-600">Payments received</span><span class="font-semibold text-slate-800">{{ formatCurrency(stats.monthRevenue) }}</span></div>
          </AppCard>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency } = useFormatCurrency();
const { formatDate } = useFormatDate();
const { orgId } = useOrg();
const t = useTerminology();
const { getWhatsAppLink, getReminderMessage, getPaymentReminderMessage } = useWhatsApp();

interface DashboardData {
  stats: {
    activeMembers: number;
    expiringSoon: number;
    monthRevenue: number;
    monthExpenses: number;
    monthProfit: number;
    pendingPayments: number;
    checkInsToday: number;
  };
  recentPayments: Array<{ id: number; amount: number; date: string; memberName: string }>;
}

interface ExpiringItem {
  memberId: number;
  memberName: string;
  memberPhone: string | null;
  planName: string;
  endDate: string;
  amount: number;
}

// Fetch dashboard data
const { data: dashData, error: dashError } = await useFetch<DashboardData>(
  `/api/orgs/${orgId.value}/dashboard`,
);
const { data: expiringData, error: expiringError } = await useFetch<{ expiring: ExpiringItem[] }>(
  `/api/orgs/${orgId.value}/members/expiring`,
);
const { data: plansData } = await useFetch<{ plans: Array<{ id: number }> }>(
  `/api/orgs/${orgId.value}/plans`,
);

interface PendingItem {
  subscription_id: number; member_id: number; member_name: string; member_phone: string | null;
  plan_name: string; end_date: string; pending_amount: number;
}
const { data: pendingData, error: pendingError } = await useFetch<{ pending: PendingItem[] }>(
  `/api/orgs/${orgId.value}/payments/pending`,
);
const pending = computed(() => pendingData.value?.pending ?? []);
const attentionTab = ref<"renewals" | "payments">("renewals");
const attentionItems = computed(() => attentionTab.value === "renewals"
  ? expiring.value.map(item => ({ key: `renewal-${item.memberId}-${item.endDate}`, memberId: item.memberId, name: item.memberName, phone: item.memberPhone, plan: item.planName, date: item.endDate, amount: item.amount, reminder: item.memberPhone ? getWhatsAppLink(item.memberPhone, getReminderMessage(item.memberName, item.planName, item.endDate)) : "" }))
  : pending.value.map(item => ({ key: `payment-${item.subscription_id}`, memberId: item.member_id, name: item.member_name, phone: item.member_phone, plan: item.plan_name, date: item.end_date, amount: item.pending_amount, reminder: item.member_phone ? getWhatsAppLink(item.member_phone, getPaymentReminderMessage(item.member_name, formatCurrency(item.pending_amount))) : "" }))
);
const quickActions = computed(() => [
  { label: t.value.addMember, to: "/dashboard/members/new" },
  { label: "Record payment", to: "/dashboard/payments" },
  { label: `Check in ${t.value.memberLower}`, to: "/dashboard/check-ins" },
]);

const stats = computed(
  () =>
    dashData.value?.stats ?? {
      activeMembers: 0,
      expiringSoon: 0,
      pendingPayments: 0,
      checkInsToday: 0,
      monthRevenue: 0,
      monthExpenses: 0,
      monthProfit: 0,
    }
);
const recentPayments = computed(() => dashData.value?.recentPayments ?? []);
const expiring = computed(() => {
  const items = expiringData.value?.expiring ?? [];
  return items.filter((item, index) => items.findIndex(other => other.memberId === item.memberId && other.endDate === item.endDate) === index);
});
const plansCount = computed(() => plansData.value?.plans?.length ?? 0);

const iconProps = {
  class: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.7",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  viewBox: "0 0 24 24",
};

const MembersIcon = () => h("svg", iconProps, [
  h("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
  h("circle", { cx: "9", cy: "7", r: "4" }),
  h("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
  h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
]);
const ClockIcon = () => h("svg", iconProps, [
  h("circle", { cx: "12", cy: "12", r: "9" }),
  h("path", { d: "M12 7v5l3 2" }),
]);
const AlertIcon = () => h("svg", iconProps, [
  h("path", { d: "M12 9v4" }),
  h("path", { d: "M12 17h.01" }),
  h("path", { d: "M10.3 3.9 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" }),
]);
const RupeeIcon = () => h("svg", iconProps, [
  h("path", { d: "M7 5h10" }),
  h("path", { d: "M7 9h10" }),
  h("path", { d: "M7 9c4 0 6 1.5 6 4s-2 4-6 4l8 5" }),
]);

const priorityCards = computed(() => [
  { label: `Active ${t.value.members}`, value: String(stats.value.activeMembers), helper: "Current members", to: "/dashboard/members", icon: MembersIcon, tone: "bg-green-50 text-green-700" },
  { label: "Renewals due", value: String(stats.value.expiringSoon), helper: "Next 7 days", to: "/dashboard/members", icon: ClockIcon, tone: "bg-amber-50 text-amber-700" },
  { label: "Pending payments", value: pendingError.value ? "—" : formatCurrency(pending.value.reduce((sum, item) => sum + Number(item.pending_amount), 0)), helper: pendingError.value ? "Could not load" : `${stats.value.pendingPayments} unpaid subscriptions`, to: "/dashboard/payments/pending", icon: RupeeIcon, tone: "bg-red-50 text-red-700" },
  { label: "Check-ins today", value: String(stats.value.checkInsToday), helper: "Today, India time", to: "/dashboard/check-ins", icon: AlertIcon, tone: "bg-primary-50 text-primary-700" },
]);

// Demo data
const { data: demoStatus, refresh: refreshDemoStatus } = await useFetch<{ hasDemoData: boolean }>(
  `/api/orgs/${orgId.value}/demo-data`,
);
const hasDemoData = computed(() => demoStatus.value?.hasDemoData ?? false);

const loadingDemo = ref(false);
const clearingDemo = ref(false);

async function loadDemoData() {
  loadingDemo.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/demo-data`, { method: "POST" });
    await refreshDemoStatus();
    refreshNuxtData();
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    alert(err.data?.statusMessage || "Failed to load sample data");
  } finally {
    loadingDemo.value = false;
  }
}

async function clearDemoData() {
  clearingDemo.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/demo-data`, { method: "DELETE" });
    await refreshDemoStatus();
    refreshNuxtData();
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    alert(err.data?.statusMessage || "Failed to clear sample data");
  } finally {
    clearingDemo.value = false;
  }
}
</script>
