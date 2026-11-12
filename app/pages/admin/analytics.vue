<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Visitors</h1>
        <p class="mt-1 text-sm text-slate-600">
          Where website visitors come from, where they are, who signs up, and who stays.
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

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      Could not load analytics.
    </div>

    <div v-if="pending && !data" class="grid gap-4 md:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-lg bg-white" />
    </div>

    <template v-else-if="data">
      <p v-if="!data.trackingSince || data.trackingSince > data.sinceDay" class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        {{ data.trackingSince ? `Visitor tracking started on ${formatDay(data.trackingSince)}, so earlier days show no visits.` : "No visits recorded yet. Tracking starts as soon as this release is live." }}
        Signups from before tracking show as "Before tracking". Your own browser is left out once you open the admin.
      </p>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AppStatCard label="Visitors" :value="fmt(data.totals.visitors)" :subtitle="`${fmt(data.totals.pageViews)} page views`" />
        <AppStatCard label="Visits" :value="fmt(data.totals.visits)" subtitle="Times someone arrived on the site" />
        <AppStatCard label="Accounts created" :value="fmt(data.totals.signups)" :subtitle="data.totals.visitors ? `${pct(data.totals.signups, data.totals.visitors)} of visitors` : undefined" />
        <AppStatCard label="Businesses created" :value="fmt(data.totals.businesses)" subtitle="Test and demo names left out" />
      </div>

      <AppCard title="Visitors and signups per day">
        <div class="flex h-36 items-end gap-px" role="img" :aria-label="`Daily visitors for the last ${data.days} days`">
          <div
            v-for="d in data.series"
            :key="d.day"
            class="group relative flex h-full flex-1 flex-col justify-end"
            :title="`${formatDay(d.day)}: ${d.visitors} visitors, ${d.signups} signups`"
          >
            <div class="w-full rounded-t-sm bg-primary-500/80" :style="{ height: `${barHeight(d.visitors)}%` }" />
            <div v-if="d.signups" class="absolute inset-x-0 -top-0.5 mx-auto h-1.5 w-1.5 rounded-full bg-amber-500" :style="{ bottom: `${barHeight(d.visitors)}%`, top: 'auto' }" />
          </div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-slate-600">
          <span>{{ formatDay(data.series[0]?.day) }}</span>
          <span class="flex items-center gap-3">
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-sm bg-primary-500/80" />Visitors</span>
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-amber-500" />Day with a signup</span>
          </span>
          <span>{{ formatDay(data.series.at(-1)?.day) }}</span>
        </div>
      </AppCard>

      <AppCard title="Signup funnel">
        <p class="mb-3 text-xs text-slate-600">People and businesses in this period, from first visit to still using it.</p>
        <ol class="space-y-2">
          <li v-for="(step, i) in data.funnel" :key="step.key" class="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[14rem_1fr_6rem]">
            <span class="text-sm text-slate-700">{{ step.label }}</span>
            <span class="order-last col-span-2 h-2.5 rounded-full bg-slate-100 sm:order-none sm:col-span-1">
              <span class="block h-full rounded-full bg-primary-600" :style="{ width: `${funnelWidth(step.value)}%` }" />
            </span>
            <span class="text-right text-sm font-semibold text-slate-800">
              {{ fmt(step.value) }}
              <span v-if="i > 0 && data.funnel[i - 1]!.value" class="ml-1 text-xs font-normal text-slate-600">{{ pct(step.value, data.funnel[i - 1]!.value) }}</span>
            </span>
          </li>
        </ol>
      </AppCard>

      <div class="grid gap-6 xl:grid-cols-2">
        <AppCard title="Where visitors come from">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="px-2 py-2 font-semibold">Source</th>
                  <th class="px-2 py-2 font-semibold">Type</th>
                  <th class="px-2 py-2 text-right font-semibold">Visitors</th>
                  <th class="px-2 py-2 text-right font-semibold">Signups</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="s in data.sources" :key="`${s.source}-${s.medium}`">
                  <td class="px-2 py-2 font-medium text-slate-800">{{ s.source }}</td>
                  <td class="px-2 py-2 capitalize">{{ mediumLabel(s.medium) }}</td>
                  <td class="px-2 py-2 text-right">{{ fmt(s.visitors) }}</td>
                  <td class="px-2 py-2 text-right">{{ fmt(s.signups) }}</td>
                </tr>
                <tr v-if="!data.sources.length"><td colspan="4" class="px-2 py-4 text-slate-600">No visits yet.</td></tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 text-xs text-slate-600">
            Tip: add <code class="rounded bg-slate-100 px-1">?utm_source=whatsapp&amp;utm_campaign=andheri-gyms</code> to links you share, and each campaign shows up below.
          </p>
          <div v-if="data.campaigns.length" class="mt-4">
            <h3 class="mb-1 text-sm font-semibold text-slate-700">Campaigns</h3>
            <ul class="divide-y divide-slate-100 text-sm">
              <li v-for="c in data.campaigns" :key="`${c.campaign}-${c.source}`" class="flex justify-between py-1.5">
                <span class="text-slate-800">{{ c.campaign }} <span class="text-slate-600">· {{ c.source }}</span></span>
                <span class="text-slate-700">{{ fmt(c.visitors) }}</span>
              </li>
            </ul>
          </div>
        </AppCard>

        <AppCard title="Where visitors are">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="px-2 py-2 font-semibold">City</th>
                  <th class="px-2 py-2 font-semibold">State</th>
                  <th class="px-2 py-2 text-right font-semibold">Visitors</th>
                  <th class="px-2 py-2 text-right font-semibold">Signups</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="c in data.cities" :key="`${c.city}-${c.region}-${c.country}`">
                  <td class="px-2 py-2 font-medium text-slate-800">{{ c.city }}<span v-if="c.country && c.country !== 'IN'" class="text-slate-600"> · {{ c.country }}</span></td>
                  <td class="px-2 py-2">{{ c.region }}</td>
                  <td class="px-2 py-2 text-right">{{ fmt(c.visitors) }}</td>
                  <td class="px-2 py-2 text-right">{{ fmt(c.signups) }}</td>
                </tr>
                <tr v-if="!data.cities.length"><td colspan="4" class="px-2 py-4 text-slate-600">No visits yet.</td></tr>
              </tbody>
            </table>
          </div>
          <div v-if="data.countries.length" class="mt-4 flex flex-wrap gap-2 text-xs">
            <span v-for="c in data.countries" :key="c.country" class="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{{ c.country }} · {{ fmt(c.visitors) }}</span>
          </div>
          <p class="mt-3 text-xs text-slate-600">City comes from the visitor's internet connection, so it is a close guess, not an address.</p>
        </AppCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <AppCard title="Pages">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="px-2 py-2 font-semibold">Page</th>
                  <th class="px-2 py-2 text-right font-semibold">Visitors</th>
                  <th class="px-2 py-2 text-right font-semibold">Landed here</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="p in data.pages" :key="p.path">
                  <td class="max-w-[16rem] truncate px-2 py-2 text-slate-800">{{ p.path }}</td>
                  <td class="px-2 py-2 text-right">{{ fmt(p.visitors) }}</td>
                  <td class="px-2 py-2 text-right">{{ fmt(p.landings) }}</td>
                </tr>
                <tr v-if="!data.pages.length"><td colspan="3" class="px-2 py-4 text-slate-600">No visits yet.</td></tr>
              </tbody>
            </table>
          </div>
        </AppCard>

        <AppCard title="Signups by source and city">
          <div class="grid gap-6 sm:grid-cols-2">
            <ul class="divide-y divide-slate-100 text-sm">
              <li v-for="s in data.signupsBySource" :key="s.source" class="flex justify-between py-1.5">
                <span class="text-slate-800">{{ s.source }}</span><span class="font-semibold text-slate-800">{{ fmt(s.signups) }}</span>
              </li>
              <li v-if="!data.signupsBySource.length" class="py-2 text-slate-600">No signups in this period.</li>
            </ul>
            <ul class="divide-y divide-slate-100 text-sm">
              <li v-for="c in data.signupsByCity" :key="c.city" class="flex justify-between py-1.5">
                <span class="text-slate-800">{{ c.city }}</span><span class="font-semibold text-slate-800">{{ fmt(c.signups) }}</span>
              </li>
            </ul>
          </div>
          <div v-if="data.devices.length" class="mt-4 border-t border-slate-100 pt-3">
            <h3 class="mb-1 text-sm font-semibold text-slate-700">Visitor devices</h3>
            <div class="flex flex-wrap gap-2 text-xs">
              <span v-for="d in data.devices" :key="d.device" class="rounded-md bg-slate-100 px-2 py-1 capitalize text-slate-700">{{ d.device }} · {{ pct(d.visitors, data.totals.visitors) }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <section class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Churn</h2>
          <p class="text-sm text-slate-600">
            Every real business since launch. Active means used in the last 7 days, slipping 8 to 21 days, churned more than 21 days (all with real members).
            {{ fmt(data.churn.dayOneDropoff) }} of {{ fmt(data.churn.total) }} never came back after their first day.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div v-for="h in healthTiles" :key="h.key" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p class="flex items-center gap-1.5 text-sm text-slate-600"><span class="h-2 w-2 rounded-full" :class="h.dot" />{{ h.label }}</p>
            <p class="mt-1 text-xl font-bold text-slate-800">{{ fmt(data.churn.health[h.key] ?? 0) }}</p>
          </div>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <AppCard title="By signup month">
            <CohortTable :rows="data.churn.cohorts" first-label="Month" />
          </AppCard>
          <AppCard title="By where they came from">
            <CohortTable :rows="data.churn.bySource" first-label="Source" />
          </AppCard>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Visitors - MemberBook admin", robots: "noindex, nofollow" });

type Bucket = { label: string; businesses: number; withMembers: number; cameBack: number; active: number; slipping: number; churned: number; neverStarted: number; settingUp: number };
type Analytics = {
  days: number;
  sinceDay: string;
  trackingSince: string | null;
  totals: { visitors: number; visits: number; pageViews: number; signups: number; businesses: number };
  series: Array<{ day: string; visitors: number; pageViews: number; signups: number }>;
  funnel: Array<{ key: string; label: string; value: number }>;
  sources: Array<{ source: string; medium: string; visits: number; visitors: number; signups: number }>;
  signupsBySource: Array<{ source: string; signups: number }>;
  campaigns: Array<{ campaign: string; source: string; visitors: number }>;
  cities: Array<{ city: string; region: string; country: string; visitors: number; signups: number }>;
  signupsByCity: Array<{ city: string; signups: number }>;
  countries: Array<{ country: string; visitors: number }>;
  pages: Array<{ path: string; pageViews: number; visitors: number; landings: number }>;
  devices: Array<{ device: string; visitors: number }>;
  churn: { total: number; health: Record<string, number>; dayOneDropoff: number; cohorts: Bucket[]; bySource: Bucket[] };
};

const days = ref(28);
// Forwards the admin cookie during server rendering.
const requestFetch = useRequestFetch();
const { data, pending, error } = await useAsyncData<Analytics>(
  "admin-analytics",
  () => requestFetch("/api/admin/analytics", { query: { days: days.value } }),
  { watch: [days] },
);

const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "0%");
function formatDay(day?: string | null) {
  if (!day) return "";
  return new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
const maxVisitors = computed(() => Math.max(1, ...(data.value?.series.map(d => d.visitors) ?? [1])));
const barHeight = (v: number) => (v ? Math.max(3, (v / maxVisitors.value) * 100) : 0);
const maxFunnel = computed(() => Math.max(1, ...(data.value?.funnel.map(f => f.value) ?? [1])));
const funnelWidth = (v: number) => (v ? Math.max(1.5, (v / maxFunnel.value) * 100) : 0);
const MEDIUMS: Record<string, string> = { direct: "Direct", search: "Search", social: "Social", referral: "Other site", paid: "Ads", email: "Email", ai: "AI chat", campaign: "Campaign" };
const mediumLabel = (m: string) => MEDIUMS[m] ?? m;

const healthTiles = [
  { key: "active", label: "Active", dot: "bg-green-600" },
  { key: "slipping", label: "Slipping", dot: "bg-amber-500" },
  { key: "churned", label: "Churned", dot: "bg-red-600" },
  { key: "setting_up", label: "Setting up", dot: "bg-sky-500" },
  { key: "new", label: "New, no members", dot: "bg-slate-400" },
  { key: "never_started", label: "Never started", dot: "bg-slate-300" },
];

const CohortTable = defineComponent({
  props: { rows: { type: Array as PropType<Bucket[]>, required: true }, firstLabel: { type: String, required: true } },
  setup(props) {
    const th = (t: string, right = true) => h("th", { class: `whitespace-nowrap px-2 py-2 font-semibold ${right ? "text-right" : ""}` }, t);
    const td = (v: string | number, right = true, strong = false) => h("td", { class: `whitespace-nowrap px-2 py-2 ${right ? "text-right" : ""} ${strong ? "font-medium text-slate-800" : ""}` }, String(v));
    return () => h("div", { class: "overflow-x-auto" }, [
      h("table", { class: "min-w-full text-left text-sm" }, [
        h("thead", { class: "text-xs uppercase text-slate-500" }, [h("tr", [
          th(props.firstLabel, false), th("Signed up"), th("Added members"), th("Came back"), th("Active"), th("Slipping"), th("Churned"), th("Not live yet"),
        ])]),
        h("tbody", { class: "divide-y divide-slate-100 text-slate-700" }, props.rows.length
          ? props.rows.map(r => h("tr", { key: r.label }, [
              td(r.label, false, true), td(r.businesses), td(r.withMembers), td(`${r.cameBack} (${pct(r.cameBack, r.businesses)})`),
              td(r.active), td(r.slipping), td(r.churned), td(r.neverStarted + r.settingUp),
            ]))
          : [h("tr", [h("td", { colspan: 8, class: "px-2 py-4 text-slate-600" }, "No businesses yet.")])]),
      ]),
    ]);
  },
});
</script>
