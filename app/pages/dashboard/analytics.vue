<template>
  <div class="p-4 space-y-6">
    <div>
      <h1 class="text-xl font-bold text-slate-800">Analytics</h1>
      <p class="text-sm text-slate-600 mt-1">Detailed insights and trends for your business</p>
    </div>

    <!-- Financial Analytics -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2.5">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </span> Financial Analytics
      </h2>

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

        <!-- Expense Breakdown -->
        <AppCard title="Expense Breakdown">
          <ClientOnly>
            <ChartDoughnut
              :chart-data="expenseBreakdownChartData"
              :chart-options="expenseBreakdownChartOptions"
              :height="200"
              empty-message="No expenses this month. Add your first expense to see breakdown."
            />
            <template #fallback>
              <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
            </template>
          </ClientOnly>
        </AppCard>

        <!-- Profit Trend -->
        <AppCard title="Profit Trend" class="lg:col-span-2">
          <div class="space-y-4">
            <div class="flex gap-2 justify-center">
              <button
                v-for="p in (['daily', 'weekly', 'monthly'] as const)"
                :key="p"
                class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                :class="profitPeriod === p ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                @click="profitPeriod = p"
              >
                {{ p.charAt(0).toUpperCase() + p.slice(1) }}
              </button>
            </div>
            <ClientOnly>
              <ChartLine
                :chart-data="profitTrendChartData"
                :chart-options="profitTrendChartOptions"
                :height="200"
                empty-message="No financial data yet. Add revenue and expenses to track profit."
              />
              <template #fallback>
                <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
              </template>
            </ClientOnly>
          </div>
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
      </div>
    </div>

    <!-- Member Analytics -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2.5">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-700">
          <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </span> {{ t.member }} Analytics
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Member Growth -->
        <AppCard :title="`${t.member} Growth`">
          <ClientOnly>
            <ChartLine
              :chart-data="memberGrowthChartData"
              :chart-options="memberGrowthChartOptions"
              :height="200"
              :empty-message="`No ${t.membersLower} yet. Add your first ${t.memberLower} to track growth.`"
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
              :empty-message="`No subscriptions yet. Add a ${t.memberLower} to see status breakdown.`"
            />
            <template #fallback>
              <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
            </template>
          </ClientOnly>
        </AppCard>

        <!-- Plan Popularity -->
        <AppCard title="Plan Popularity" class="lg:col-span-2">
          <ClientOnly>
            <ChartBar
              :chart-data="planPopularityChartData"
              :chart-options="planPopularityChartOptions"
              :height="200"
              :empty-message="`No active subscriptions yet. Create a plan and add ${t.membersLower}.`"
            />
            <template #fallback>
              <div class="h-[200px] bg-slate-50 animate-pulse rounded" />
            </template>
          </ClientOnly>
        </AppCard>
      </div>
    </div>

    <!-- Inquiry Analytics -->
    <div class="space-y-4">
      <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2.5">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-700">
          <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
        </span> Inquiry Analytics
      </h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Inquiry Funnel -->
        <AppCard title="Inquiry Conversion" class="lg:col-span-2">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TooltipItem } from "chart.js";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency } = useFormatCurrency();
const { orgId } = useOrg();
const t = useTerminology();
const { colors, baseOptions, formatRevenueLabel, formatDateLabel, formatMonthLabel } = useCharts();

// Trend period refs
const revenuePeriod = ref<"daily" | "weekly" | "monthly">("daily");
const profitPeriod = ref<"daily" | "weekly" | "monthly">("daily");

// Fetch analytics data
const { data: revenueTrendData } = await useFetch<{ data: Array<{ date: string; revenue: number }> }>(
  `/api/orgs/${orgId.value}/analytics/revenue-trend`,
  { query: { period: revenuePeriod }, watch: [revenuePeriod] },
);

const { data: expenseBreakdownData } = await useFetch<{
  data: Array<{ categoryId: number; categoryName: string; categoryColor: string; total: number; count: number }>;
}>(`/api/orgs/${orgId.value}/analytics/expense-breakdown`);

const { data: profitTrendData } = await useFetch<{
  data: Array<{ date: string; revenue: number; expenses: number; profit: number }>;
}>(`/api/orgs/${orgId.value}/analytics/profit`, {
  query: { period: profitPeriod },
  watch: [profitPeriod],
});

const { data: memberGrowthData } = await useFetch<{ data: Array<{ month: string; count: number }> }>(
  `/api/orgs/${orgId.value}/analytics/member-growth`,
);

const { data: paymentMethodsData } = await useFetch<{ data: Array<{ method: string; total: number; count: number }> }>(
  `/api/orgs/${orgId.value}/analytics/payment-methods`,
);

const { data: subscriptionStatusData } = await useFetch<{ active: number; expiring: number; expired: number }>(
  `/api/orgs/${orgId.value}/analytics/subscription-status`,
);

const { data: planPopularityData } = await useFetch<{ data: Array<{ planId: number; planName: string; activeCount: number }> }>(
  `/api/orgs/${orgId.value}/analytics/plan-popularity`,
);

const { data: inquiryFunnelData } = await useFetch<{ total: number; new: number; contacted: number; converted: number; lost: number; conversionRate: number }>(
  `/api/orgs/${orgId.value}/analytics/inquiry-funnel`,
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

// Expense Breakdown Chart
const expenseBreakdownChartData = computed(() => {
  const data = expenseBreakdownData.value?.data ?? [];
  const colorMap: Record<string, string> = {
    blue: colors.blue,
    purple: colors.purple,
    green: colors.green,
    orange: colors.orange,
    pink: colors.pink,
    yellow: colors.yellow,
    red: colors.red,
    indigo: colors.indigo,
    cyan: colors.cyan,
    slate: colors.gray,
  };

  return {
    labels: data.map((d) => d.categoryName),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: data.map((d) => colorMap[d.categoryColor] || colors.gray),
      },
    ],
  };
});

const expenseBreakdownChartOptions = computed(() => ({
  ...baseOptions,
  plugins: {
    ...baseOptions.plugins,
    tooltip: {
      ...baseOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"doughnut">) => {
          const total = context.dataset.data.reduce((a: number, b) => a + (b as number), 0);
          const value = context.parsed as number;
          const percentage = ((value / total) * 100).toFixed(1);
          return `${formatCurrency(value)} (${percentage}%)`;
        },
      },
    },
  },
}));

// Profit Trend Chart
const profitTrendChartData = computed(() => {
  const data = profitTrendData.value?.data ?? [];
  return {
    labels: data.map((d) => formatDateLabel(d.date, profitPeriod.value)),
    datasets: [
      {
        label: "Profit",
        data: data.map((d) => d.profit),
        borderColor: colors.green,
        backgroundColor: colors.greenAlpha,
        fill: true,
        borderWidth: 2,
        tension: 0.3,
        segment: {
          borderColor: (ctx: { p0: { parsed: { y: number } } }) =>
            ctx.p0.parsed.y < 0 ? colors.red : colors.green,
          backgroundColor: (ctx: { p0: { parsed: { y: number } } }) =>
            ctx.p0.parsed.y < 0 ? "rgba(239, 68, 68, 0.1)" : colors.greenAlpha,
        },
      },
    ],
  };
});

const profitTrendChartOptions = computed(() => ({
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
        label: (context: TooltipItem<"line">) => {
          const label = context.dataset.label || "";
          return `${label}: ${formatCurrency(context.parsed.y as number)}`;
        },
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
        label: `New ${t.value.members}`,
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
        label: (context: TooltipItem<"line">) => `New ${t.value.members}: ${context.parsed.y}`,
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
