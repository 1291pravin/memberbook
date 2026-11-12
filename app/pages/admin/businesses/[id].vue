<template>
  <div class="space-y-6">
    <NuxtLink to="/admin/businesses" class="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-700">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      Businesses
    </NuxtLink>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      Could not load this business.
    </div>

    <div v-if="pending && !data" class="space-y-3">
      <div class="h-20 animate-pulse rounded-xl bg-white" />
      <div class="h-64 animate-pulse rounded-xl bg-white" />
    </div>

    <template v-else-if="data">
      <!-- Header -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 class="text-2xl font-semibold text-slate-900">{{ b.name }}</h1>
            <span class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800" :title="HEALTH_META[b.health].help">
              <span class="h-2 w-2 rounded-full" :class="HEALTH_META[b.health].dot" aria-hidden="true" />
              {{ HEALTH_META[b.health].label }}
            </span>
            <span v-if="b.isTest" class="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">Test</span>
          </div>
          <p class="mt-1 text-sm text-slate-600">
            <span class="capitalize">{{ b.type }}</span> · joined {{ formatDate(b.createdAt) }} ({{ ago(b.createdAt) }})
            · {{ HEALTH_META[b.health].help }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a
            v-if="waLink"
            :href="waLink"
            target="_blank"
            rel="noopener"
            class="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >WhatsApp owner</a>
          <a
            v-if="b.ownerEmail"
            :href="`mailto:${b.ownerEmail}`"
            class="inline-flex min-h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >Email</a>
          <AppButton v-if="b.ownerEmail" size="sm" :loading="loggingInId === b.id" @click="loginAsOwner(b)">
            Open their app
          </AppButton>
          <NuxtLink
            v-else-if="b.heldBySetup"
            :to="`/admin/setup?highlight=${b.id}`"
            class="inline-flex min-h-9 items-center rounded-lg bg-primary-600 px-3.5 text-sm font-semibold text-white hover:bg-primary-700"
          >Open in Set up</NuxtLink>
        </div>
      </div>

      <!-- Numbers -->
      <div class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:grid-cols-3 xl:grid-cols-6">
        <div v-for="s in stats" :key="s.label" class="bg-white px-4 py-4">
          <p class="text-[13px] font-medium text-slate-600">{{ s.label }}</p>
          <p class="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">{{ s.value }}</p>
          <p class="mt-1 text-xs text-slate-600">{{ s.subtitle }}</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div class="space-y-6">
          <AppCard title="Last 30 days">
            <div class="mb-3 flex flex-wrap gap-2">
              <button
                v-for="s in series"
                :key="s.key"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium"
                :class="chartKey === s.key ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-transparent text-slate-600 hover:bg-slate-100'"
                @click="chartKey = s.key"
              >
                {{ s.label }}
              </button>
            </div>
            <ClientOnly>
              <ChartBar :chart-data="chartData" :chart-options="chartOptions" :height="220" :empty-message="`No ${currentSeries.label.toLowerCase()} in the last 30 days.`" />
              <template #fallback>
                <div class="h-[220px] animate-pulse rounded bg-slate-50" />
              </template>
            </ClientOnly>
          </AppCard>

          <AppCard title="Timeline">
            <ol class="relative space-y-4 border-l border-slate-200 pl-5">
              <li v-for="(t, i) in data.timeline" :key="i" class="relative">
                <span class="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white" :class="timelineDot(t.kind)" aria-hidden="true" />
                <p class="whitespace-pre-line break-words text-sm text-slate-800" :class="t.kind === 'note' ? 'rounded-lg bg-slate-50 px-3 py-2' : ''">{{ t.text }}</p>
                <p class="mt-0.5 text-xs text-slate-600">{{ formatDateTime(t.at) }} · {{ timelineLabel(t.kind) }}</p>
              </li>
            </ol>
          </AppCard>
        </div>

        <div class="space-y-6">
          <!-- CRM -->
          <AppCard title="Where they stand with us">
            <form class="space-y-3" @submit.prevent="saveCrm">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-700">Stage</span>
                <select v-model="crm.stage" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option value="">Not set</option>
                  <option v-for="s in data.stages" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </label>
              <div class="grid gap-3 sm:grid-cols-[10rem_1fr] xl:grid-cols-1 2xl:grid-cols-[10rem_1fr]">
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-slate-700">Follow up on</span>
                  <input v-model="crm.followUpOn" type="date" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                </label>
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-slate-700">Why</span>
                  <input v-model="crm.followUpReason" type="text" maxlength="200" placeholder="e.g. Ask if the reminders worked" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                </label>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <AppButton type="submit" size="sm" :loading="savingCrm">Save</AppButton>
                <button v-for="d in [1, 3, 7]" :key="d" type="button" class="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100" @click="crm.followUpOn = inDays(d)">
                  +{{ d }} {{ d === 1 ? "day" : "days" }}
                </button>
                <span v-if="crmNote" class="text-sm" :class="crmOk ? 'text-green-700' : 'text-red-700'">{{ crmNote }}</span>
              </div>
            </form>

            <form class="mt-5 border-t border-slate-100 pt-4" @submit.prevent="addNote">
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-slate-700">Add a note</span>
                <textarea v-model="noteText" rows="3" maxlength="2000" placeholder="Called the owner, they'll send the register on Monday" class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </label>
              <div class="mt-2 flex items-center gap-2">
                <AppButton type="submit" size="sm" variant="secondary" :loading="savingNote" :disabled="!noteText.trim()">Add note</AppButton>
                <span v-if="noteError" class="text-sm text-red-700">{{ noteError }}</span>
              </div>
            </form>
          </AppCard>

          <AppCard title="Owner and team">
            <ul class="divide-y divide-slate-100">
              <li v-for="p in data.people" :key="p.email" class="py-2.5 first:pt-0 last:pb-0">
                <p class="text-sm font-medium text-slate-800">{{ p.name }} <span class="font-normal capitalize text-slate-600">· {{ p.role }}</span></p>
                <p class="break-all text-xs text-slate-600">{{ p.email }} · last seen {{ ago(p.lastSeenAt) }}</p>
              </li>
              <li v-if="!data.people.length" class="text-sm text-slate-600">Nobody yet. We still hold this business for the owner.</li>
            </ul>
            <p v-if="b.ownerWhatsapp" class="mt-3 text-xs text-slate-600">Owner's WhatsApp: {{ b.ownerWhatsapp }}</p>
          </AppCard>

          <AppCard title="Collections">
            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt class="text-xs text-slate-600">UPI ID</dt>
                <dd class="font-medium" :class="b.upiSet ? 'text-slate-800' : 'text-amber-700'">{{ b.upiSet ? "Set" : "Not set" }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-600">Automatic reminders</dt>
                <dd class="font-medium text-slate-800">{{ b.autoReminders ? "On" : "Off" }}</dd>
              </div>
              <div v-if="data?.ownWhatsapp">
                <dt class="text-xs text-slate-600">Own WhatsApp number</dt>
                <dd class="font-medium text-slate-800">
                  {{ data.ownWhatsapp.displayPhoneNumber || "?" }} · {{ data.ownWhatsapp.status }}
                  <span class="text-slate-600">(template {{ data.ownWhatsapp.templateStatus || "none" }})</span>
                </dd>
                <dd v-if="data.ownWhatsapp.lastError" class="mt-0.5 break-words text-xs text-red-700">{{ data.ownWhatsapp.lastError }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-600">Unpaid subscriptions</dt>
                <dd class="font-medium text-slate-800">{{ formatNumber(b.unpaidSubscriptions) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-600">Waiting for owner to confirm</dt>
                <dd class="font-medium" :class="b.claimsWaiting ? 'text-amber-700' : 'text-slate-800'">{{ formatNumber(b.claimsWaiting) }}</dd>
              </div>
            </dl>
            <ul v-if="data.reminders.length" class="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <li v-for="r in data.reminders" :key="`${r.channel}-${r.status}`">
                {{ r.count }} {{ r.channel === "whatsapp_api" ? "automatic" : "tap-to-send" }} reminders {{ r.status }}, last {{ ago(r.lastAt) }}
              </li>
            </ul>
            <p v-else class="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">No reminders sent yet.</p>
          </AppCard>

          <AppCard v-if="data.uploads.length" title="Data uploads">
            <ul class="divide-y divide-slate-100">
              <li v-for="u in data.uploads" :key="u.id" class="py-2.5 text-sm first:pt-0 last:pb-0">
                <p class="font-medium capitalize text-slate-800">
                  {{ u.status }}
                  <span class="font-normal normal-case text-slate-600">· {{ u.source === "admin" ? "added by us" : "from owner" }} · {{ formatDateTime(u.createdAt) }}</span>
                </p>
                <p v-if="u.result" class="text-xs text-slate-600">{{ u.result.plansCreated ?? 0 }} plans, {{ u.result.membersLoaded ?? 0 }} members loaded<template v-if="u.result.skipped?.length">, {{ u.result.skipped.length }} skipped</template></p>
                <p v-if="u.message" class="text-xs text-slate-600">{{ u.message }}</p>
              </li>
            </ul>
          </AppCard>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AdminBusiness } from "~/composables/useAdmin";

definePageMeta({ layout: "admin", middleware: "admin" });

interface Detail {
  business: AdminBusiness;
  daily: Array<{ date: string; visitors: number; payments: number; collected: number; members: number }>;
  timeline: Array<{ at: string; kind: string; text: string }>;
  notes: Array<{ id: number; body: string; createdAt: string }>;
  uploads: Array<{ id: number; source: string; status: string; message: string | null; result: { plansCreated?: number; membersLoaded?: number; skipped?: unknown[] } | null; createdAt: string; processedAt: string | null }>;
  reminders: Array<{ channel: string; status: string; count: number; lastAt: string }>;
  people: Array<{ name: string; email: string; role: string; lastSeenAt: string | null }>;
  stages: Array<{ value: string; label: string }>;
  ownWhatsapp: { status: string; displayPhoneNumber: string | null; templateStatus: string | null; lastError: string | null } | null;
}

const route = useRoute();
const id = Number(route.params.id);
const { formatNumber, formatRupees, formatDate, formatDateTime, ago, ownerWhatsAppLink, loginAsOwner, loggingInId } = useAdmin();

const requestFetch = useRequestFetch();
const { data, pending, error, refresh } = await useAsyncData<Detail>(
  `admin-business-${id}`,
  () => requestFetch(`/api/admin/businesses/${id}`),
);

const b = computed(() => data.value!.business);
useHead({ title: computed(() => (data.value ? `${data.value.business.name} · Admin` : "Business · Admin")) });

const waLink = computed(() => (data.value ? ownerWhatsAppLink(b.value) : null));

const stats = computed(() => {
  const x = data.value?.business;
  if (!x) return [];
  return [
    { label: "Members", value: formatNumber(x.realMembers), subtitle: `+${x.membersAdded30} in 30 days · ${x.plans} ${x.plans === 1 ? "plan" : "plans"}` },
    { label: "Last active", value: ago(x.lastActiveAt), subtitle: x.lastVisitDay ? `last visit ${formatDate(x.lastVisitDay)}` : "no visits tracked" },
    { label: "Days used", value: `${x.activeDays30} / 30`, subtitle: `${x.activeDays7} this week · ${x.activeDaysTotal} ever` },
    { label: "Recorded, 30 days", value: formatRupees(x.collected30), subtitle: `${x.payments30} payments` },
    { label: "Recorded, all time", value: formatRupees(x.collectedTotal), subtitle: `${formatNumber(x.paymentsTotal)} payments` },
    { label: "Check-ins, 30 days", value: formatNumber(x.checkins30), subtitle: `${x.reminders30} reminders sent` },
  ];
});

// Chart
const series = [
  { key: "visitors", label: "Visits" },
  { key: "payments", label: "Payments" },
  { key: "collected", label: "Amount" },
  { key: "members", label: "Members added" },
] as const;
type SeriesKey = typeof series[number]["key"];
const chartKey = ref<SeriesKey>("visitors");
const currentSeries = computed(() => series.find(s => s.key === chartKey.value)!);
const { baseOptions, formatDateLabel } = useCharts();
const chartData = computed(() => {
  const rows = data.value?.daily ?? [];
  const values = rows.map(r => (chartKey.value === "collected" ? r.collected / 100 : r[chartKey.value]));
  return {
    labels: rows.map(r => formatDateLabel(r.date, "daily")),
    datasets: values.some(v => v > 0)
      ? [{ label: currentSeries.value.label, data: values, backgroundColor: "#1F4FD1", borderRadius: 3, maxBarThickness: 18 }]
      : [],
  };
});
const chartOptions = computed(() => ({
  ...baseOptions,
  plugins: { ...baseOptions.plugins, legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#475467", font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } },
    y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#475467", font: { size: 11 }, precision: 0 }, beginAtZero: true },
  },
}));

function timelineDot(kind: string) {
  return { milestone: "bg-green-600", upload: "bg-primary-600", admin: "bg-slate-400", note: "bg-amber-500" }[kind] ?? "bg-slate-400";
}
function timelineLabel(kind: string) {
  return { milestone: "Milestone", upload: "Upload", admin: "Us", note: "Note" }[kind] ?? kind;
}

// CRM
const crm = reactive({ stage: "", followUpOn: "", followUpReason: "" });
watch(() => data.value?.business, (x) => {
  if (!x) return;
  crm.stage = x.stage ?? "";
  crm.followUpOn = x.followUpOn ?? "";
  crm.followUpReason = x.followUpReason ?? "";
}, { immediate: true });

function inDays(n: number) {
  const d = new Date(Date.now() + n * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

const savingCrm = ref(false);
const crmNote = ref("");
const crmOk = ref(false);
async function saveCrm() {
  savingCrm.value = true;
  crmNote.value = "";
  try {
    await $fetch(`/api/admin/businesses/${id}/crm`, {
      method: "PATCH",
      body: { stage: crm.stage || null, followUpOn: crm.followUpOn || null, followUpReason: crm.followUpReason || null },
    });
    crmOk.value = true;
    crmNote.value = "Saved";
    await refresh();
  }
  catch (err) {
    crmOk.value = false;
    crmNote.value = errorMessage(err, "Could not save");
  }
  finally {
    savingCrm.value = false;
  }
}

const noteText = ref("");
const savingNote = ref(false);
const noteError = ref("");
async function addNote() {
  if (!noteText.value.trim()) return;
  savingNote.value = true;
  noteError.value = "";
  try {
    await $fetch(`/api/admin/businesses/${id}/notes`, { method: "POST", body: { body: noteText.value } });
    noteText.value = "";
    await refresh();
  }
  catch (err) {
    noteError.value = errorMessage(err, "Could not add the note");
  }
  finally {
    savingNote.value = false;
  }
}
</script>
