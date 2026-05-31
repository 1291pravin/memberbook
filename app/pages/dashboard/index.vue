<template>
  <div class="p-4 lg:p-6 space-y-6">
    <OnboardingProgressWidget />

    <header class="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Today at a glance</p>
        <h1 class="mt-1.5 text-2xl font-bold tracking-tight text-slate-800">Dashboard</h1>
        <p class="mt-1 text-sm text-slate-600">Focus on the follow-ups that keep your day moving.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/dashboard/members/new">
          <AppButton size="sm">{{ t.addMember }}</AppButton>
        </NuxtLink>
        <NuxtLink to="/dashboard/payments">
          <AppButton size="sm" variant="secondary">Record Payment</AppButton>
        </NuxtLink>
        <NuxtLink to="/dashboard/payments/pending">
          <AppButton size="sm" variant="ghost">View Dues</AppButton>
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

    <!-- Activation Checklist (shown when no active members) -->
    <AppCard v-if="stats.activeMembers === 0" class="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
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

    <!-- Today command center (shown when user has active members) -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <NuxtLink
        v-for="card in priorityCards"
        :key="card.label"
        :to="card.to"
        class="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{{ card.label }}</p>
            <p class="mt-3 text-2xl font-bold tracking-tight text-slate-800">{{ card.value }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ card.helper }}</p>
          </div>
          <span class="rounded-xl p-2" :class="card.tone">
            <component :is="card.icon" class="h-5 w-5" />
          </span>
        </div>
      </NuxtLink>
    </div>

    <div v-if="stats.activeMembers > 0" class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
      <div class="space-y-4">
        <AppCard class="border-primary-200 bg-white">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Needs attention</p>
              <h2 class="mt-1 text-base font-semibold text-slate-800">Your next best actions</h2>
            </div>
            <NuxtLink to="/dashboard/members" class="text-xs font-semibold text-primary-700 hover:text-primary-800">View members</NuxtLink>
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="(item, index) in actionQueue" :key="item.title" class="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">{{ index + 1 }}</span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-800">{{ item.title }}</p>
                <p class="mt-1 text-xs leading-5 text-slate-600">{{ item.description }}</p>
              </div>
              <NuxtLink :to="item.to" class="shrink-0 text-sm font-semibold text-primary-700 hover:text-primary-800">
                {{ item.action }}
              </NuxtLink>
            </div>
          </div>
        </AppCard>

        <!-- Mini trend charts (only when populated) -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AppCard title="Revenue (last 30 days)">
            <ClientOnly>
              <ChartLine
                :chart-data="revenueChartData"
                :chart-options="sparklineOptions"
                :height="140"
                empty-message="No payments yet — record one to see your revenue trend."
              />
              <template #fallback>
                <div class="h-[140px] bg-slate-50 animate-pulse rounded" />
              </template>
            </ClientOnly>
          </AppCard>
          <AppCard :title="`${t.member} Growth`">
            <ClientOnly>
              <ChartLine
                :chart-data="memberGrowthChartData"
                :chart-options="memberGrowthOptions"
                :height="140"
                :empty-message="`No ${t.membersLower} yet — add your first ${t.memberLower} to track growth.`"
              />
              <template #fallback>
                <div class="h-[140px] bg-slate-50 animate-pulse rounded" />
              </template>
            </ClientOnly>
          </AppCard>
        </div>
      </div>

      <aside class="space-y-4">
        <!-- Expiring Soon -->
        <AppCard v-if="expiring.length > 0" title="Expiring This Week">
          <div class="divide-y divide-slate-100">
            <div v-for="item in expiring" :key="item.memberId" class="py-3 first:pt-0 last:pb-0">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-slate-800">{{ item.memberName }}</p>
                  <p class="mt-0.5 text-xs text-slate-600">{{ item.planName }} &mdash; {{ formatDate(item.endDate) }}</p>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <a
                    v-if="item.memberPhone"
                    :href="getWhatsAppLink(item.memberPhone, getReminderMessage(item.memberName, item.planName, item.endDate))"
                    target="_blank"
                    class="text-xs font-semibold text-green-700 hover:text-green-800"
                  >
                    Remind
                  </a>
                  <NuxtLink :to="`/dashboard/members/${item.memberId}`" class="text-xs font-semibold text-primary-700 hover:text-primary-800">View</NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Recent Payments -->
        <AppCard v-if="recentPayments.length > 0" title="Recent Payments">
          <div class="divide-y divide-slate-100">
            <div v-for="p in recentPayments" :key="p.id" class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-slate-800">{{ p.memberName }}</p>
                <p class="mt-0.5 text-xs text-slate-600">{{ formatDate(p.date) }}</p>
              </div>
              <p class="shrink-0 text-sm font-semibold text-slate-800">{{ formatCurrency(p.amount) }}</p>
            </div>
          </div>
        </AppCard>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency } = useFormatCurrency();
const { formatDate } = useFormatDate();
const { orgId } = useOrg();
const t = useTerminology();
const { getWhatsAppLink, getReminderMessage } = useWhatsApp();
const { colors, baseOptions, formatRevenueLabel, formatDateLabel, formatMonthLabel } = useCharts();

interface DashboardData {
  stats: {
    activeMembers: number;
    expiringSoon: number;
    monthRevenue: number;
    monthExpenses: number;
    monthProfit: number;
    pendingPayments: number;
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
const { data: dashData } = await useFetch<DashboardData>(
  `/api/orgs/${orgId.value}/dashboard`,
);
const { data: expiringData } = await useFetch<{ expiring: ExpiringItem[] }>(
  `/api/orgs/${orgId.value}/members/expiring`,
);
const { data: plansData } = await useFetch<{ plans: Array<{ id: number }> }>(
  `/api/orgs/${orgId.value}/plans`,
);

// Mini trend charts (reuse the analytics endpoints — no blocking, lazy fetch)
const { data: revenueTrendData } = useFetch<{ data: Array<{ date: string; revenue: number }> }>(
  `/api/orgs/${orgId.value}/analytics/revenue-trend`,
  { query: { period: "daily" }, lazy: true },
);
const { data: memberGrowthData } = useFetch<{ data: Array<{ month: string; count: number }> }>(
  `/api/orgs/${orgId.value}/analytics/member-growth`,
  { lazy: true },
);

const stats = computed(
  () =>
    dashData.value?.stats ?? {
      activeMembers: 0,
      expiringSoon: 0,
      pendingPayments: 0,
      monthRevenue: 0,
      monthExpenses: 0,
      monthProfit: 0,
    }
);
const recentPayments = computed(() => dashData.value?.recentPayments ?? []);
const expiring = computed(() => expiringData.value?.expiring ?? []);
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
  {
    label: "Collected this month",
    value: formatCurrency(stats.value.monthRevenue),
    helper: recentPayments.value.length > 0 ? `${recentPayments.value.length} recent payments visible` : "Record a payment to start the trend",
    to: "/dashboard/payments",
    icon: RupeeIcon,
    tone: "bg-success-100 text-success-700",
  },
  {
    label: "Pending payments",
    value: String(stats.value.pendingPayments),
    helper: stats.value.pendingPayments > 0 ? "Follow up before the day gets busy" : "No pending dues right now",
    to: "/dashboard/payments/pending",
    icon: AlertIcon,
    tone: "bg-danger-100 text-danger-700",
  },
  {
    label: "Expiring soon",
    value: String(stats.value.expiringSoon),
    helper: expiring.value.length > 0 ? "WhatsApp reminders are one tap away" : "No urgent renewals this week",
    to: "/dashboard/members",
    icon: ClockIcon,
    tone: "bg-warning-100 text-warning-700",
  },
  {
    label: `Active ${t.value.members}`,
    value: String(stats.value.activeMembers),
    helper: "Your live member base",
    to: "/dashboard/members",
    icon: MembersIcon,
    tone: "bg-primary-100 text-primary-700",
  },
]);

const actionQueue = computed(() => {
  const firstExpiring = expiring.value[0];
  return [
    {
      title: firstExpiring ? `Remind ${firstExpiring.memberName}` : "Review renewal reminders",
      description: firstExpiring
        ? `${firstExpiring.planName} expires ${formatDate(firstExpiring.endDate)}. Send a WhatsApp nudge while it is fresh.`
        : "No urgent expiry yet. Keep your reminder list clean for the week.",
      action: firstExpiring?.memberPhone ? "Remind" : "Open members",
      to: firstExpiring ? `/dashboard/members/${firstExpiring.memberId}` : "/dashboard/members",
    },
    {
      title: "Close pending dues",
      description: stats.value.pendingPayments > 0
        ? `${stats.value.pendingPayments} payment follow-up${stats.value.pendingPayments === 1 ? "" : "s"} should be handled before evening.`
        : "Payments are clear. New collections will appear here automatically.",
      action: "Open dues",
      to: "/dashboard/payments/pending",
    },
    {
      title: "Add today's walk-in",
      description: "Capture the member and first payment while the person is still at the counter.",
      action: t.value.addMember,
      to: "/dashboard/members/new",
    },
  ];
});

// Revenue (30 days) sparkline
const revenueChartData = computed(() => {
  const data = revenueTrendData.value?.data ?? [];
  return {
    labels: data.map((d) => formatDateLabel(d.date, "daily")),
    datasets: [
      {
        label: "Revenue",
        data: data.map((d) => d.revenue),
        borderColor: colors.blue,
        backgroundColor: colors.blueAlpha,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
});

const memberGrowthChartData = computed(() => {
  const data = memberGrowthData.value?.data ?? [];
  return {
    labels: data.map((d) => formatMonthLabel(d.month)),
    datasets: [
      {
        label: `New ${t.value.members}`,
        data: data.map((d) => d.count),
        borderColor: colors.green,
        backgroundColor: colors.greenAlpha,
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
});

const sparklineOptions = computed(() => ({
  ...baseOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
    },
    y: {
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      ticks: {
        color: "#6B7280",
        font: { size: 10 },
        callback: (value: number | string) => formatRevenueLabel(Number(value)),
      },
    },
  },
  plugins: {
    ...baseOptions.plugins,
    legend: { display: false },
  },
}));

const memberGrowthOptions = computed(() => ({
  ...baseOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
    },
    y: {
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      ticks: { color: "#6B7280", font: { size: 10 }, precision: 0 },
    },
  },
  plugins: {
    ...baseOptions.plugins,
    legend: { display: false },
  },
}));

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
