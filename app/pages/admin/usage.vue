<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-semibold text-primary-600">Admin</p>
        <h1 class="mt-1 text-2xl font-bold text-slate-800">Usage</h1>
        <p class="mt-1 text-sm text-slate-600">
          Signups, activation, and customer activity.
        </p>
      </div>
      <label class="w-full md:w-44">
        <span class="mb-1 block text-sm font-medium text-slate-700">Period</span>
        <select
          v-model="days"
          class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          <option :value="7">Last 7 days</option>
          <option :value="28">Last 28 days</option>
          <option :value="90">Last 90 days</option>
          <option :value="365">Last 365 days</option>
        </select>
      </label>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      Could not load admin usage.
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-lg bg-white" />
    </div>

    <template v-else-if="data">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AppStatCard
          label="New signups"
          :value="formatNumber(data.periodTotals.real_orgs_new)"
          :subtitle="`${formatNumber(data.periodTotals.users_new)} new users`"
          icon-color="primary"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </template>
        </AppStatCard>
        <AppStatCard
          label="Active organizations"
          :value="formatNumber(data.activeOrganizations.length)"
          :subtitle="`${formatNumber(data.totals.real_orgs_total)} real orgs total`"
          icon-color="info"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </template>
        </AppStatCard>
        <AppStatCard
          label="Members added"
          :value="formatNumber(data.periodTotals.members_added)"
          :subtitle="`${formatNumber(data.periodTotals.plans_created)} plans created`"
          icon-color="success"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </template>
        </AppStatCard>
        <AppStatCard
          label="Payments"
          :value="formatCurrency(data.periodTotals.payment_volume)"
          :subtitle="`${formatNumber(data.periodTotals.payments_recorded)} recorded`"
          icon-color="success"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </template>
        </AppStatCard>
        <AppStatCard
          label="Inquiries"
          :value="formatNumber(data.periodTotals.inquiries_created)"
          :subtitle="`${formatNumber(data.totals.inquiries_total)} total`"
          icon-color="warning"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </template>
        </AppStatCard>
        <AppStatCard
          label="Check-ins"
          :value="formatNumber(data.periodTotals.checkins)"
          :subtitle="`${formatNumber(data.totals.checkins_total)} total`"
          icon-color="info"
        >
          <template #icon>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </template>
        </AppStatCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <AppCard title="Platform activity">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in activitySeries"
                :key="s.key"
                class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
                :class="activeSeries[s.key] ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                @click="toggleSeries(s.key)"
              >
                <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: s.color }" />
                {{ s.label }}
              </button>
            </div>
            <ClientOnly>
              <ChartLine
                :chart-data="activityChartData"
                :chart-options="activityChartOptions"
                :height="260"
                empty-message="No activity in this period. Pick a series above or widen the date range."
              />
              <template #fallback>
                <div class="h-[260px] bg-slate-50 animate-pulse rounded" />
              </template>
            </ClientOnly>
          </div>
        </AppCard>

        <AppCard title="New organizations">
          <ClientOnly>
            <ChartBar
              :chart-data="signupsChartData"
              :chart-options="signupsChartOptions"
              :height="260"
              empty-message="No new organizations in this period."
            />
            <template #fallback>
              <div class="h-[260px] bg-slate-50 animate-pulse rounded" />
            </template>
          </ClientOnly>
        </AppCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <AppCard title="Daily activity">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Date</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Orgs</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Users</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Members</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Payments</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Check-ins</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Inquiries</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="row in data.daily.slice().reverse().slice(0, days)" :key="row.date">
                  <td class="whitespace-nowrap px-2 py-2">{{ row.date }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.organizations) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.users) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.members) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.payments) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.checkIns) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.inquiries) }}</td>
                </tr>
                <tr v-if="data.daily.length === 0">
                  <td class="px-2 py-4 text-slate-600" colspan="7">No activity in this period.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>

        <AppCard title="Recent signups">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Organization</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Owner</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Usage</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="org in data.recentSignups" :key="`signup-${org.id}-${org.owner_id}`">
                  <td class="px-2 py-3">
                    <p class="font-semibold text-slate-800">{{ org.name }}</p>
                    <div class="mt-0.5 flex items-center gap-1.5">
                      <span :class="orgTypeColor(org.type)" class="inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium">{{ org.type }}</span>
                      <span class="text-xs text-slate-500">{{ formatDate(org.created_at) }}</span>
                    </div>
                  </td>
                  <td class="px-2 py-3">
                    <p class="font-medium text-slate-800">{{ org.owner_name || "No owner" }}</p>
                    <p class="text-xs text-slate-600">{{ org.owner_email || "No email" }}</p>
                  </td>
                  <td class="whitespace-nowrap px-2 py-3 text-xs text-slate-600">
                    {{ formatNumber(org.members) }} members, {{ formatNumber(org.payments) }} payments, {{ formatNumber(org.inquiries) }} inquiries
                  </td>
                  <td class="px-2 py-3">
                    <AppButton
                      v-if="org.owner_email"
                      size="sm"
                      variant="secondary"
                      :loading="loginOrgId === org.id"
                      @click="loginAsOwner(org)"
                    >
                      Login
                    </AppButton>
                  </td>
                </tr>
                <tr v-if="data.recentSignups.length === 0">
                  <td class="px-2 py-4 text-slate-600" colspan="4">No new signups in this period.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>

      <AppCard title="Most active organizations">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Organization</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Owner</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Members</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Plans</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Payments</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Volume</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Check-ins</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Inquiries</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Last active</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr v-for="org in data.activeOrganizations" :key="`active-${org.id}-${org.owner_id}`">
                <td class="px-2 py-3">
                  <p class="font-semibold text-slate-800">{{ org.name }}</p>
                  <span :class="orgTypeColor(org.type)" class="mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium">{{ org.type }}</span>
                </td>
                <td class="px-2 py-3">
                  <p class="font-medium text-slate-800">{{ org.owner_name || "No owner" }}</p>
                  <p class="text-xs text-slate-600">{{ org.owner_email || "No email" }}</p>
                </td>
                <td class="px-2 py-3">{{ formatNumber(org.members) }}</td>
                <td class="px-2 py-3">{{ formatNumber(org.plans) }}</td>
                <td class="px-2 py-3">{{ formatNumber(org.payments) }}</td>
                <td class="whitespace-nowrap px-2 py-3">{{ formatCurrency(org.payment_volume) }}</td>
                <td class="px-2 py-3">{{ formatNumber(org.checkins) }}</td>
                <td class="px-2 py-3">{{ formatNumber(org.inquiries) }}</td>
                <td class="whitespace-nowrap px-2 py-3">{{ formatDate(org.last_activity_at) }}</td>
                <td class="px-2 py-3">
                  <AppButton
                    v-if="org.owner_email"
                    size="sm"
                    variant="secondary"
                    :loading="loginOrgId === org.id"
                    @click="loginAsOwner(org)"
                  >
                    Login
                  </AppButton>
                </td>
              </tr>
              <tr v-if="data.activeOrganizations.length === 0">
                <td class="px-2 py-4 text-slate-600" colspan="10">No active organizations yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

type AdminOrg = {
  id: number;
  name: string;
  type: string;
  created_at: string;
  owner_id: number | null;
  owner_name: string | null;
  owner_email: string | null;
  members: number;
  plans: number;
  payments: number;
  payment_volume: number;
  checkins: number;
  inquiries: number;
  last_activity_at: string;
};

function orgTypeColor(type: string) {
  if (type === "gym") return "bg-green-100 text-green-700";
  if (type === "library") return "bg-blue-100 text-blue-700";
  if (type === "tuition") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

type AdminUsage = {
  totals: Record<string, number>;
  periodTotals: Record<string, number>;
  daily: Array<Record<string, number | string> & { date: string }>;
  recentSignups: AdminOrg[];
  activeOrganizations: AdminOrg[];
};

const days = ref(28);
const loginOrgId = ref<number | null>(null);

const { data, pending, error } = await useAsyncData<AdminUsage>(
  "admin-usage",
  () => $fetch("/api/admin/usage", { query: { days: days.value } }),
  { watch: [days] },
);

const { colors, baseOptions, formatDateLabel } = useCharts();

const activitySeries = [
  { key: "organizations", label: "Orgs", color: colors.indigo, alpha: colors.indigoAlpha },
  { key: "members", label: "Members", color: colors.green, alpha: colors.greenAlpha },
  { key: "payments", label: "Payments", color: colors.blue, alpha: colors.blueAlpha },
  { key: "checkIns", label: "Check-ins", color: colors.purple, alpha: colors.purpleAlpha },
  { key: "inquiries", label: "Inquiries", color: colors.amber, alpha: colors.amberAlpha },
] as const;

const activeSeries = ref<Record<string, boolean>>({
  organizations: true,
  members: true,
  payments: false,
  checkIns: false,
  inquiries: false,
});

function toggleSeries(key: string) {
  activeSeries.value = { ...activeSeries.value, [key]: !activeSeries.value[key] };
}

const dailyRows = computed(() => data.value?.daily ?? []);

const activityChartData = computed(() => ({
  labels: dailyRows.value.map((row) => formatDateLabel(String(row.date), "daily")),
  datasets: activitySeries
    .filter((s) => activeSeries.value[s.key])
    .map((s) => ({
      label: s.label,
      data: dailyRows.value.map((row) => Number(row[s.key] ?? 0)),
      borderColor: s.color,
      backgroundColor: s.alpha,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    })),
}));

const timeAxisOptions = {
  x: {
    grid: { display: false },
    ticks: { color: "#6B7280", font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
  },
  y: {
    grid: { color: "rgba(0, 0, 0, 0.05)" },
    ticks: { color: "#6B7280", font: { size: 11 }, precision: 0 },
    beginAtZero: true,
  },
};

const activityChartOptions = computed(() => ({
  ...baseOptions,
  interaction: { mode: "index" as const, intersect: false },
  scales: timeAxisOptions,
}));

const signupsChartData = computed(() => ({
  labels: dailyRows.value.map((row) => formatDateLabel(String(row.date), "daily")),
  datasets: [
    {
      label: "New organizations",
      data: dailyRows.value.map((row) => Number(row.organizations ?? 0)),
      backgroundColor: colors.indigo,
      borderRadius: 4,
      maxBarThickness: 28,
    },
  ],
}));

const signupsChartOptions = computed(() => ({
  ...baseOptions,
  plugins: { ...baseOptions.plugins, legend: { display: false } },
  scales: timeAxisOptions,
}));

const numberFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatNumber(value: unknown) {
  return numberFormatter.format(Number(value ?? 0));
}

function formatCurrency(value: unknown) {
  return currencyFormatter.format(Number(value ?? 0) / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function loginAsOwner(org: AdminOrg) {
  if (!org.owner_email) return;
  loginOrgId.value = org.id;
  try {
    const result = await $fetch<{ redirectTo: string }>("/api/admin/autologin", {
      method: "POST",
      body: { email: org.owner_email, orgId: org.id },
    });
    await navigateTo(result.redirectTo || "/dashboard");
  } finally {
    loginOrgId.value = null;
  }
}
</script>
