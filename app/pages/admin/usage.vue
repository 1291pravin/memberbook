<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Usage</h1>
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
      <div
        v-if="newSetupHelp.length"
        role="alert"
        class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-3">
          <span class="h-2 w-2 shrink-0 rounded-full bg-red-600" aria-hidden="true" />
          <div>
          <p class="text-sm font-semibold text-slate-900">
            {{ newSetupHelp.length }} new {{ newSetupHelp.length === 1 ? "owner wants" : "owners want" }} help setting up on WhatsApp
          </p>
          <p class="mt-0.5 text-sm text-slate-600">
            Oldest waiting since {{ formatDateTime(oldestNewSetupHelp) }}. Message them, then mark each one as contacted.
          </p>
          </div>
        </div>
        <a href="#setup-help" class="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 hover:bg-slate-50">See requests</a>
      </div>

      <AppCard id="setup-help" title="WhatsApp setup-help requests">
        <p class="mb-3 text-xs text-slate-600">
          Owners who ticked "You can contact me on WhatsApp to help set up MemberBook" when they created their workspace.
        </p>
        <ul class="divide-y divide-slate-100">
          <li
            v-for="req in data.setupHelpRequests ?? []"
            :key="`setup-${req.id}`"
            class="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p class="font-semibold text-slate-800">{{ req.name }}</p>
                <span :class="orgTypeColor(req.type)" class="inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium">{{ req.type }}</span>
                <span
                  v-if="!req.setup_help_handled_at"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700"
                ><span class="h-1.5 w-1.5 rounded-full bg-red-600" aria-hidden="true" />New</span>
                <span v-else class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-green-600" aria-hidden="true" />
                  Contacted {{ formatDate(req.setup_help_handled_at) }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-slate-600">
                Asked {{ formatDateTime(req.setup_help_consent_at) }} &middot;
                {{ req.owner_name || "No owner" }}
                <template v-if="req.owner_email"> &middot; <a :href="`mailto:${req.owner_email}`" class="underline">{{ req.owner_email }}</a></template>
              </p>
              <p class="mt-1 text-xs text-slate-600">
                {{ formatNumber(req.real_members) }} real {{ req.real_members === 1 ? "member" : "members" }}, {{ formatNumber(req.plans) }} {{ req.plans === 1 ? "plan" : "plans" }}<template v-if="req.has_sample_data">, sample data loaded</template>
                &middot; {{ visitSummary(req.active_days, req.owner_last_seen_at) }}
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-2">
              <a
                v-if="req.owner_whatsapp"
                :href="setupHelpWhatsAppLink(req)"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                WhatsApp {{ req.owner_whatsapp }}
              </a>
              <AppButton
                size="sm"
                variant="secondary"
                :loading="handlingOrgId === req.id"
                @click="setSetupHelpHandled(req, !req.setup_help_handled_at)"
              >
                {{ req.setup_help_handled_at ? "Mark as new" : "Mark contacted" }}
              </AppButton>
            </div>
          </li>
          <li v-if="!data.setupHelpRequests?.length" class="py-4 text-sm text-slate-600">No setup-help requests yet.</li>
        </ul>
      </AppCard>

      <div class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:grid-cols-3 xl:grid-cols-6">
        <div
          v-for="stat in statStrip"
          :key="stat.label"
          class="bg-white px-4 py-4 sm:px-5"
        >
          <p class="text-[13px] font-medium text-slate-600">{{ stat.label }}</p>
          <p class="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{{ stat.value }}</p>
          <p class="mt-1 text-xs text-slate-600">{{ stat.subtitle }}</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <AppCard title="Platform activity">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in activitySeries"
                :key="s.key"
                class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
                :class="activeSeries[s.key] ? 'border-slate-300 bg-white text-slate-900' : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'"
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
                      <span class="whitespace-nowrap text-xs text-slate-600">{{ formatDate(org.created_at) }}</span>
                    </div>
                  </td>
                  <td class="px-2 py-3">
                    <p class="font-medium text-slate-800">{{ org.owner_name || "No owner" }}</p>
                    <p class="text-xs text-slate-600">{{ org.owner_email || "No email" }}</p>
                  </td>
                  <td class="whitespace-nowrap px-2 py-3 text-xs text-slate-600">
                    {{ formatNumber(org.members) }} members, {{ formatNumber(org.payments) }} payments, {{ formatNumber(org.inquiries) }} inquiries
                    <p class="mt-0.5" :class="org.return_days > 0 ? 'text-green-700' : 'text-slate-600'">
                      {{ visitSummary(org.active_days, org.owner_last_seen_at) }}
                    </p>
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

      <AppCard id="help-requests" title="Help requests">
        <p class="mb-3 text-xs text-slate-600">Latest messages from the in-app help form and the website contact form.</p>
        <ul class="divide-y divide-slate-100">
          <li v-for="req in data.recentHelpRequests ?? []" :key="`help-${req.id}`" class="py-3">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p class="font-semibold text-slate-800">{{ req.business_name }}</p>
              <span
                class="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700"
              >{{ req.source_page === '/dashboard/help' ? 'In-app' : 'Website' }}</span>
              <span class="text-xs text-slate-600">{{ formatDate(req.created_at) }}</span>
            </div>
            <p class="mt-0.5 text-xs text-slate-600">
              {{ req.name }} &middot;
              <a :href="`mailto:${req.email}`" class="underline">{{ req.email }}</a>
              <template v-if="req.phone"> &middot; <a :href="whatsAppLinkFor(req.phone)" target="_blank" rel="noopener" class="underline">{{ req.phone }}</a></template>
            </p>
            <p class="mt-1.5 whitespace-pre-line text-sm text-slate-700">{{ req.message }}</p>
          </li>
          <li v-if="!data.recentHelpRequests?.length" class="py-4 text-sm text-slate-600">No help requests yet.</li>
        </ul>
      </AppCard>

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
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Days used</th>
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
                <td class="px-2 py-3">{{ formatNumber(org.active_days) }}</td>
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
                <td class="px-2 py-4 text-slate-600" colspan="11">No active organizations yet.</td>
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
  owner_last_seen_at: string | null;
  active_days: number;
  return_days: number;
};

type SetupHelpRequest = {
  id: number;
  name: string;
  type: string;
  owner_whatsapp: string | null;
  setup_help_consent_at: string;
  setup_help_handled_at: string | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_last_seen_at: string | null;
  real_members: number;
  has_sample_data: number;
  plans: number;
  active_days: number;
};

function orgTypeColor(_type: string) {
  // One neutral chip for every type keeps colour for status only.
  return "rounded-md bg-slate-100 text-slate-700 capitalize";
}

const statStrip = computed(() => {
  const d = data.value;
  if (!d) return [];
  return [
    { label: "New signups", value: formatNumber(d.periodTotals.real_orgs_new), subtitle: `${formatNumber(d.periodTotals.orgs_returned)} came back on a later day` },
    { label: "Active orgs", value: formatNumber(d.activeOrganizations.length), subtitle: `${formatNumber(d.totals.real_orgs_total)} real orgs total` },
    { label: "Members added", value: formatNumber(d.periodTotals.members_added), subtitle: `${formatNumber(d.periodTotals.plans_created)} plans created` },
    { label: "Payments", value: formatCurrency(d.periodTotals.payment_volume), subtitle: `${formatNumber(d.periodTotals.payments_recorded)} recorded` },
    { label: "Inquiries", value: formatNumber(d.periodTotals.inquiries_created), subtitle: `${formatNumber(d.totals.inquiries_total)} total` },
    { label: "Check-ins", value: formatNumber(d.periodTotals.checkins), subtitle: `${formatNumber(d.totals.checkins_total)} total` },
  ];
});

type AdminUsage = {
  totals: Record<string, number>;
  periodTotals: Record<string, number>;
  daily: Array<Record<string, number | string> & { date: string }>;
  recentSignups: AdminOrg[];
  activeOrganizations: AdminOrg[];
  recentHelpRequests?: HelpRequest[];
  setupHelpRequests?: SetupHelpRequest[];
};

type HelpRequest = {
  id: number;
  name: string;
  phone: string;
  email: string;
  business_name: string;
  message: string;
  status: string;
  source_page: string | null;
  created_at: string;
};

const { getWhatsAppLink } = useWhatsApp();
function whatsAppLinkFor(phone: string) {
  return getWhatsAppLink(phone, "Hi, this is the MemberBook team replying to your help request.");
}

const days = ref(28);
const loginOrgId = ref<number | null>(null);

// useRequestFetch forwards the admin cookie during server rendering, so a
// direct page load or refresh of /admin/usage does not fail with 401.
const requestFetch = useRequestFetch();
const { data, pending, error, refresh } = await useAsyncData<AdminUsage>(
  "admin-usage",
  () => requestFetch("/api/admin/usage", { query: { days: days.value } }),
  { watch: [days] },
);

// Setup-help requests: new ones raise an alert banner and a count in the tab title.
const newSetupHelp = computed(() => (data.value?.setupHelpRequests ?? []).filter(r => !r.setup_help_handled_at));
const oldestNewSetupHelp = computed(() =>
  newSetupHelp.value.map(r => r.setup_help_consent_at).sort()[0] ?? null,
);
useHead({
  title: computed(() => newSetupHelp.value.length ? `(${newSetupHelp.value.length}) Admin usage` : "Admin usage"),
});

const handlingOrgId = ref<number | null>(null);
async function setSetupHelpHandled(req: SetupHelpRequest, handled: boolean) {
  handlingOrgId.value = req.id;
  try {
    await $fetch(`/api/admin/setup-help/${req.id}`, { method: "POST", body: { handled } });
    await refresh();
  } finally {
    handlingOrgId.value = null;
  }
}

function setupHelpWhatsAppLink(req: SetupHelpRequest) {
  const firstName = (req.owner_name || "").split(" ")[0] || "there";
  return getWhatsAppLink(
    req.owner_whatsapp!,
    `Hi ${firstName}, this is the MemberBook team. You asked for help setting up ${req.name}. If you send us your member list (an Excel sheet, or even photos of your register), we'll add everyone for you. When is a good time to talk?`,
  );
}

function visitSummary(activeDays: number, lastSeen: string | null) {
  const n = Number(activeDays ?? 0);
  if (!n) return "No visits tracked yet";
  return `Used on ${n} ${n === 1 ? "day" : "days"}, last seen ${formatDate(lastSeen)}`;
}

const { colors, baseOptions, formatDateLabel } = useCharts();

const activitySeries = [
  { key: "organizations", label: "Orgs", color: "#1F4FD1", alpha: "rgba(31, 79, 209, 0.08)" },
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
      backgroundColor: "#1F4FD1",
      borderRadius: 3,
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
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
