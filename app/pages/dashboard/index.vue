<template>
  <div class="p-4 space-y-6">
    <h1 class="text-xl font-bold text-slate-800">Dashboard</h1>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppStatCard label="Active Members" :value="stats.activeMembers" />
      <AppStatCard label="Expiring Soon" :value="stats.expiringSoon" />
      <AppStatCard label="Pending Payments" :value="stats.pendingPayments" />
      <AppStatCard label="This Month" :value="formatCurrency(stats.monthRevenue)" />
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-2 flex-wrap">
      <NuxtLink to="/dashboard/members/new">
        <AppButton size="sm">Add Member</AppButton>
      </NuxtLink>
      <NuxtLink to="/dashboard/inquiries/new">
        <AppButton size="sm" variant="secondary">New Inquiry</AppButton>
      </NuxtLink>
      <NuxtLink to="/dashboard/payments/pending">
        <AppButton size="sm" variant="secondary">Pending Payments</AppButton>
      </NuxtLink>
    </div>

    <!-- Analytics Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Revenue Trend -->
      <AppCard title="Revenue Trend">
        <div class="space-y-4">
          <div class="flex gap-2 justify-center">
            <button
              v-for="p in (['daily', 'weekly', 'monthly'] as const)"
              :key="p"
              class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
              :class="revenuePeriod === p ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              @click="revenuePeriod = p"
            >
              {{ p.charAt(0).toUpperCase() + p.slice(1) }}
            </button>
          </div>
          <ClientOnly>
            <ChartLine
              :chart-data="revenueChartData"
              :chart-options="revenueChartOptions"
              :height="200"
              empty-message="No revenue data yet. Record your first payment to see trends."
            />
            <template #fallback>
              <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
            </template>
          </ClientOnly>
        </div>
      </AppCard>

      <!-- Member Growth -->
      <AppCard title="Member Growth">
        <ClientOnly>
          <ChartLine
            :chart-data="memberGrowthChartData"
            :chart-options="memberGrowthChartOptions"
            :height="200"
            empty-message="No members yet. Add your first member to track growth."
          />
          <template #fallback>
            <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
          </template>
        </ClientOnly>
      </AppCard>

      <!-- Payment Methods -->
      <AppCard title="Payment Methods">
        <ClientOnly>
          <ChartDoughnut
            :chart-data="paymentMethodsChartData"
            :chart-options="paymentMethodsChartOptions"
            :height="200"
            empty-message="No payments this month. Collect your first payment to see breakdown."
          />
          <template #fallback>
            <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
          </template>
        </ClientOnly>
      </AppCard>

      <!-- Subscription Status -->
      <AppCard title="Subscription Status">
        <ClientOnly>
          <ChartDoughnut
            :chart-data="subscriptionStatusChartData"
            :chart-options="subscriptionStatusChartOptions"
            :height="200"
            empty-message="No subscriptions yet. Add a member to see status breakdown."
          />
          <template #fallback>
            <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
          </template>
        </ClientOnly>
      </AppCard>

      <!-- Plan Popularity -->
      <AppCard title="Plan Popularity">
        <ClientOnly>
          <ChartBar
            :chart-data="planPopularityChartData"
            :chart-options="planPopularityChartOptions"
            :height="200"
            empty-message="No active subscriptions yet. Create a plan and add members."
          />
          <template #fallback>
            <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
          </template>
        </ClientOnly>
      </AppCard>

      <!-- Inquiry Funnel -->
      <AppCard title="Inquiry Conversion">
        <div class="space-y-2">
          <div v-if="inquiryFunnelData" class="text-center text-sm text-slate-600 mb-2">
            Conversion Rate: <span class="font-semibold text-green-600">{{ inquiryFunnelData.conversionRate }}%</span>
          </div>
          <ClientOnly>
            <ChartBar
              :chart-data="inquiryFunnelChartData"
              :chart-options="inquiryFunnelChartOptions"
              :height="200"
              empty-message="No inquiries yet. Add your first inquiry to track conversions."
            />
            <template #fallback>
              <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
            </template>
          </ClientOnly>
        </div>
      </AppCard>
    </div>

    <!-- Expiring Soon -->
    <AppCard v-if="expiring.length > 0" title="Expiring This Week">
      <div class="space-y-2">
        <div v-for="item in expiring" :key="item.memberId" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ item.memberName }}</p>
            <p class="text-xs text-slate-500">{{ item.planName }} &mdash; expires {{ item.endDate }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              v-if="item.memberPhone"
              :href="getWhatsAppLink(item.memberPhone, getReminderMessage(item.memberName, item.planName, item.endDate))"
              target="_blank"
              class="text-green-600 hover:text-green-700 text-xs font-medium"
            >
              Remind
            </a>
            <NuxtLink :to="`/dashboard/members/${item.memberId}`" class="text-primary-600 text-xs font-medium">View</NuxtLink>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Recent Payments -->
    <AppCard v-if="recentPayments.length > 0" title="Recent Payments">
      <div class="space-y-2">
        <div v-for="p in recentPayments" :key="p.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ p.memberName }}</p>
            <p class="text-xs text-slate-500">{{ p.date }}</p>
          </div>
          <p class="text-sm font-semibold text-slate-800">{{ formatCurrency(p.amount) }}</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import type { TooltipItem } from "chart.js";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency } = useFormatCurrency();
const { orgId } = useOrg();
const { getWhatsAppLink, getReminderMessage } = useWhatsApp();
const { colors, baseOptions, formatRevenueLabel, formatDateLabel, formatMonthLabel } = useCharts();

interface DashboardData {
  stats: { activeMembers: number; expiringSoon: number; monthRevenue: number; pendingPayments: number };
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
  () => `/api/orgs/${orgId.value}/dashboard`,
);
const { data: expiringData } = await useFetch<{ expiring: ExpiringItem[] }>(
  () => `/api/orgs/${orgId.value}/members/expiring`,
);

const stats = computed(() => dashData.value?.stats ?? { activeMembers: 0, expiringSoon: 0, pendingPayments: 0, monthRevenue: 0 });
const recentPayments = computed(() => dashData.value?.recentPayments ?? []);
const expiring = computed(() => expiringData.value?.expiring ?? []);

// Revenue trend period
const revenuePeriod = ref<"daily" | "weekly" | "monthly">("daily");

// Fetch analytics data
const { data: revenueTrendData } = await useFetch<{ data: Array<{ date: string; revenue: number }> }>(
  () => `/api/orgs/${orgId.value}/analytics/revenue-trend?period=${revenuePeriod.value}`,
  { watch: [revenuePeriod] },
);

const { data: memberGrowthData } = await useFetch<{ data: Array<{ month: string; count: number }> }>(
  () => `/api/orgs/${orgId.value}/analytics/member-growth`,
);

const { data: paymentMethodsData } = await useFetch<{ data: Array<{ method: string; total: number; count: number }> }>(
  () => `/api/orgs/${orgId.value}/analytics/payment-methods`,
);

const { data: subscriptionStatusData } = await useFetch<{ active: number; expiring: number; expired: number }>(
  () => `/api/orgs/${orgId.value}/analytics/subscription-status`,
);

const { data: planPopularityData } = await useFetch<{ data: Array<{ planId: number; planName: string; activeCount: number }> }>(
  () => `/api/orgs/${orgId.value}/analytics/plan-popularity`,
);

const { data: inquiryFunnelData } = await useFetch<{ total: number; new: number; contacted: number; converted: number; lost: number; conversionRate: number }>(
  () => `/api/orgs/${orgId.value}/analytics/inquiry-funnel`,
);

// Revenue Trend Chart
const revenueChartData = computed(() => {
  const data = revenueTrendData.value?.data ?? [];
  return {
    labels: data.map(d => formatDateLabel(d.date, revenuePeriod.value)),
    datasets: [
      {
        label: "Revenue",
        data: data.map(d => d.revenue),
        borderColor: colors.blue,
        backgroundColor: colors.blueAlpha,
        fill: true,
        tension: 0.3,
      },
    ],
  };
});

const revenueChartOptions = computed(() => ({
  ...baseOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 11 } },
    },
    y: {
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      ticks: {
        color: "#6B7280",
        font: { size: 11 },
        callback: (value: number | string) => formatRevenueLabel(Number(value)),
      },
    },
  },
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      ...baseOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"line">) => `Revenue: ${formatCurrency(context.parsed.y as number)}`,
      },
    },
  },
}));

// Member Growth Chart
const memberGrowthChartData = computed(() => {
  const data = memberGrowthData.value?.data ?? [];
  return {
    labels: data.map(d => formatMonthLabel(d.month)),
    datasets: [
      {
        label: "New Members",
        data: data.map(d => d.count),
        borderColor: colors.green,
        backgroundColor: colors.greenAlpha,
        fill: true,
        tension: 0.3,
      },
    ],
  };
});

const memberGrowthChartOptions = computed(() => ({
  ...baseOptions,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 11 } },
    },
    y: {
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      ticks: {
        color: "#6B7280",
        font: { size: 11 },
        precision: 0,
      },
    },
  },
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      ...baseOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"line">) => `New Members: ${context.parsed.y}`,
      },
    },
  },
}));

// Payment Methods Chart
const paymentMethodsChartData = computed(() => {
  const data = paymentMethodsData.value?.data ?? [];
  const methodColors: Record<string, string> = {
    cash: colors.yellow,
    upi: colors.blue,
    card: colors.purple,
    bank_transfer: colors.gray,
  };

  return {
    labels: data.map(d => d.method.toUpperCase().replace("_", " ")),
    datasets: [
      {
        data: data.map(d => d.total),
        backgroundColor: data.map(d => methodColors[d.method] || colors.gray),
      },
    ],
  };
});

const paymentMethodsChartOptions = computed(() => ({
  ...baseOptions,
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      ...baseOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"doughnut">) => {
          const data = paymentMethodsData.value?.data ?? [];
          const item = data[context.dataIndex];
          if (!item) return "";
          const total = formatCurrency(item.total);
          const percentage = Math.round((item.total / data.reduce((sum, d) => sum + d.total, 0)) * 100);
          return `${total} (${percentage}%)`;
        },
      },
    },
  },
}));

// Subscription Status Chart
const subscriptionStatusChartData = computed(() => {
  const data = subscriptionStatusData.value;
  if (!data) {
    return { labels: [], datasets: [] };
  }

  return {
    labels: ["Active", "Expiring Soon", "Expired"],
    datasets: [
      {
        data: [data.active, data.expiring, data.expired],
        backgroundColor: [colors.green, colors.amber, colors.red],
      },
    ],
  };
});

const subscriptionStatusChartOptions = computed(() => ({
  ...baseOptions,
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      ...baseOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"doughnut">) => {
          const labels = ["Active", "Expiring Soon", "Expired"];
          const data = subscriptionStatusData.value;
          const total = (data?.active ?? 0) + (data?.expiring ?? 0) + (data?.expired ?? 0);
          const value = context.parsed as number;
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
          return `${labels[context.dataIndex]}: ${value} (${percentage}%)`;
        },
      },
    },
  },
}));

// Plan Popularity Chart
const planPopularityChartData = computed(() => {
  const data = planPopularityData.value?.data ?? [];
  return {
    labels: data.map(d => d.planName),
    datasets: [
      {
        label: "Active Subscriptions",
        data: data.map(d => d.activeCount),
        backgroundColor: colors.blue,
      },
    ],
  };
});

const planPopularityChartOptions = computed(() => ({
  ...baseOptions,
  indexAxis: "y" as const,
  scales: {
    x: {
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      ticks: {
        color: "#6B7280",
        font: { size: 11 },
        precision: 0,
      },
    },
    y: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 11 } },
    },
  },
  plugins: {
    ...baseOptions.plugins,
    legend: { display: false },
    tooltip: {
      ...baseOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"bar">) => `Active: ${context.parsed.x} subscriptions`,
      },
    },
  },
}));

// Inquiry Funnel Chart
const inquiryFunnelChartData = computed(() => {
  const data = inquiryFunnelData.value;
  if (!data) {
    return { labels: [], datasets: [] };
  }

  return {
    labels: ["New", "Contacted", "Converted", "Lost"],
    datasets: [
      {
        label: "Inquiries",
        data: [data.new, data.contacted, data.converted, data.lost],
        backgroundColor: [colors.blue, colors.amber, colors.green, colors.red],
      },
    ],
  };
});

const inquiryFunnelChartOptions = computed(() => ({
  ...baseOptions,
  indexAxis: "y" as const,
  scales: {
    x: {
      grid: { color: "rgba(0, 0, 0, 0.05)" },
      ticks: {
        color: "#6B7280",
        font: { size: 11 },
        precision: 0,
      },
    },
    y: {
      grid: { display: false },
      ticks: { color: "#6B7280", font: { size: 11 } },
    },
  },
  plugins: {
    ...baseOptions.plugins,
    legend: { display: false },
    tooltip: {
      ...baseOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"bar">) => `${context.parsed.x} inquiries`,
      },
    },
  },
}));
</script>
