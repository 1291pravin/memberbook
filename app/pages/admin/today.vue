<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Today</h1>
        <p class="mt-1 text-sm text-slate-600">
          Everything that needs you, in one list. {{ todayLabel }}
        </p>
      </div>
      <AppButton size="sm" variant="secondary" :loading="pending" @click="refresh()">
        Refresh
      </AppButton>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      Could not load today's list.
    </div>

    <div v-if="pending && !data" class="space-y-3">
      <div class="h-24 animate-pulse rounded-xl bg-white" />
      <div v-for="i in 4" :key="i" class="h-16 animate-pulse rounded-xl bg-white" />
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:grid-cols-4">
        <NuxtLink
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.to"
          class="bg-white px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5"
        >
          <p class="text-[13px] font-medium text-slate-600">{{ stat.label }}</p>
          <p class="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">{{ stat.value }}</p>
          <p class="mt-1 text-xs text-slate-600">{{ stat.subtitle }}</p>
        </NuxtLink>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section class="rounded-xl border border-slate-200 bg-white">
          <div class="flex flex-col gap-2 border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <h2 class="whitespace-nowrap text-[15px] font-semibold text-slate-900">
              To do
              <span v-if="openTodos.length" class="ml-1 font-normal text-slate-600">{{ openTodos.length }}</span>
            </h2>
            <div v-if="kindsPresent.length > 1" class="-ml-2 flex flex-wrap gap-1">
              <button
                v-for="k in ['all', ...kindsPresent]"
                :key="k"
                type="button"
                class="rounded-md px-2 py-1 text-xs font-medium"
                :class="filter === k ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'"
                @click="filter = k"
              >
                {{ k === 'all' ? 'All' : KIND_META[k as TodoKind].short }}
              </button>
            </div>
          </div>

          <ul v-if="filteredTodos.length" class="divide-y divide-slate-100">
            <li
              v-for="t in filteredTodos"
              :key="todoKey(t)"
              class="flex flex-wrap gap-x-3 gap-y-2 px-4 py-3.5 sm:flex-nowrap sm:px-5"
            >
              <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="KIND_META[t.kind].dot" aria-hidden="true" />
              <div class="min-w-0 flex-1 basis-[calc(100%-1.25rem)] sm:basis-auto">
                <div class="flex flex-wrap items-baseline gap-x-2">
                  <NuxtLink :to="t.link" class="font-semibold text-slate-900 hover:text-primary-700">{{ t.title }}</NuxtLink>
                  <span class="text-xs text-slate-600">{{ KIND_META[t.kind].label }}<template v-if="t.at"> · {{ ago(t.at, '') }}</template></span>
                </div>
                <p class="mt-0.5 break-words text-sm text-slate-600">{{ t.detail }}</p>
              </div>
              <div class="ml-5 flex shrink-0 items-start gap-1.5 sm:ml-0">
                <AppButton
                  v-if="t.kind === 'help_form' && t.ref?.helpRequestId"
                  size="sm"
                  variant="secondary"
                  :loading="busyKey === todoKey(t)"
                  @click="resolveHelp(t)"
                >
                  Done
                </AppButton>
                <AppButton
                  v-else-if="t.kind === 'setup_help' && t.orgId"
                  size="sm"
                  variant="secondary"
                  :loading="busyKey === todoKey(t)"
                  @click="markSetupHelp(t)"
                >
                  Contacted
                </AppButton>
                <AppButton
                  v-else-if="t.kind === 'follow_up' && t.orgId"
                  size="sm"
                  variant="secondary"
                  :loading="busyKey === todoKey(t)"
                  @click="clearFollowUp(t)"
                >
                  Done
                </AppButton>
                <NuxtLink
                  :to="t.link"
                  class="inline-flex min-h-8 items-center rounded-lg px-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  Open
                </NuxtLink>
              </div>
            </li>
          </ul>
          <div v-else class="px-5 py-10 text-center">
            <p class="font-semibold text-slate-800">All clear</p>
            <p class="mt-1 text-sm text-slate-600">No unread chats, help requests, failed uploads or follow-ups due.</p>
          </div>
        </section>

        <div class="space-y-6">
          <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 class="text-[15px] font-semibold text-slate-900">Businesses by health</h2>
            <ul class="mt-3 space-y-2">
              <li v-for="h in HEALTH_ORDER" :key="h">
                <NuxtLink :to="`/admin/businesses?health=${h}`" class="flex items-center gap-2.5 rounded-md py-1 text-sm hover:text-primary-700">
                  <span class="h-2 w-2 rounded-full" :class="HEALTH_META[h].dot" aria-hidden="true" />
                  <span class="text-slate-800">{{ HEALTH_META[h].label }}</span>
                  <span class="flex-1 border-b border-dotted border-slate-200" />
                  <span class="font-semibold tabular-nums text-slate-900">{{ data.counts[h] ?? 0 }}</span>
                </NuxtLink>
              </li>
            </ul>
          </section>

          <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 class="text-[15px] font-semibold text-slate-900">Last 48 hours</h2>
            <ul v-if="data.feed.length" class="mt-3 space-y-3">
              <li v-for="(f, i) in data.feed" :key="i" class="flex gap-3 text-sm">
                <span class="w-16 shrink-0 text-xs leading-5 text-slate-600">{{ ago(f.at) }}</span>
                <NuxtLink v-if="f.orgId" :to="`/admin/businesses/${f.orgId}`" class="min-w-0 break-words text-slate-800 hover:text-primary-700">{{ f.text }}</NuxtLink>
                <span v-else class="min-w-0 break-words text-slate-800">{{ f.text }}</span>
              </li>
            </ul>
            <p v-else class="mt-3 text-sm text-slate-600">Quiet. Nothing happened in the last two days.</p>
          </section>

          <section class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <h2 class="text-[15px] font-semibold text-slate-900">Morning email</h2>
            <p class="mt-1 text-sm text-slate-600">
              This list and yesterday's numbers are emailed to you every day at 9 AM.
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <AppButton size="sm" variant="secondary" :loading="previewLoading" @click="togglePreview">
                {{ preview ? "Hide preview" : "Preview" }}
              </AppButton>
              <AppButton size="sm" variant="secondary" :loading="sending" @click="sendDigest">
                Send it now
              </AppButton>
            </div>
            <p v-if="digestNote" class="mt-2 text-sm" :class="digestOk ? 'text-green-700' : 'text-red-700'">{{ digestNote }}</p>
            <div v-if="preview" class="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-semibold text-slate-700">{{ preview.subject }}</p>
              <pre class="mt-2 max-h-80 overflow-auto whitespace-pre-wrap font-sans text-xs leading-5 text-slate-700">{{ preview.text }}</pre>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

type TodoKind = "whatsapp" | "setup_help" | "help_form" | "upload_failed" | "upload_stuck" | "follow_up" | "claims" | "slipping" | "new_signup" | "addon_review" | "addon_stuck" | "addon_bill";

interface TodoItem {
  kind: TodoKind;
  priority: number;
  title: string;
  detail: string;
  at: string | null;
  orgId: number | null;
  link: string;
  ref?: { helpRequestId?: number; phone?: string };
}

interface TodayData {
  today: string;
  summary: {
    activeBusinesses: number;
    usedThisWeek: number;
    slipping: number;
    churned: number;
    settingUp: number;
    newSignups7: number;
    payments7: number;
    collected7: number;
    reminders7: number;
    realBusinesses: number;
  };
  counts: Record<string, number>;
  todos: TodoItem[];
  feed: Array<{ at: string; kind: string; text: string; orgId: number | null }>;
}

const KIND_META: Record<TodoKind, { label: string; short: string; dot: string }> = {
  whatsapp: { label: "WhatsApp", short: "WhatsApp", dot: "bg-red-600" },
  setup_help: { label: "Setup help", short: "Setup help", dot: "bg-red-600" },
  help_form: { label: "Help form", short: "Help form", dot: "bg-red-600" },
  upload_failed: { label: "Upload failed", short: "Uploads", dot: "bg-red-600" },
  upload_stuck: { label: "Upload waiting", short: "Uploads", dot: "bg-amber-500" },
  follow_up: { label: "Follow-up", short: "Follow-ups", dot: "bg-primary-600" },
  claims: { label: "Payment claims", short: "Claims", dot: "bg-amber-500" },
  slipping: { label: "Going quiet", short: "Quiet", dot: "bg-amber-500" },
  new_signup: { label: "New signup", short: "Signups", dot: "bg-sky-500" },
  addon_review: { label: "Website to check", short: "Add-ons", dot: "bg-red-600" },
  addon_stuck: { label: "Add-on waiting", short: "Add-ons", dot: "bg-amber-500" },
  addon_bill: { label: "Bill paid?", short: "Bills", dot: "bg-amber-500" },
};

const { formatNumber, formatRupees, ago } = useAdmin();

const requestFetch = useRequestFetch();
const { data, pending, error, refresh } = await useAsyncData<TodayData>(
  "admin-today",
  () => requestFetch<TodayData>("/api/admin/today"),
);

const todayLabel = computed(() =>
  new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }),
);

const stats = computed(() => {
  const s = data.value?.summary;
  if (!s) return [];
  return [
    { label: "Active businesses", value: formatNumber(s.activeBusinesses), subtitle: `${s.usedThisWeek} opened the app this week`, to: "/admin/businesses?health=active" },
    { label: "Slipping or churned", value: formatNumber(s.slipping + s.churned), subtitle: `${s.slipping} slipping, ${s.churned} churned`, to: "/admin/businesses?health=slipping" },
    { label: "Recorded this week", value: formatRupees(s.collected7), subtitle: `${formatNumber(s.payments7)} payments, ${formatNumber(s.reminders7)} reminders`, to: "/admin/businesses" },
    { label: "New signups", value: formatNumber(s.newSignups7), subtitle: `last 7 days · ${s.settingUp} being set up`, to: "/admin/businesses?health=new" },
  ];
});

// Items handled on this page disappear straight away; a refresh confirms.
const done = ref(new Set<string>());
function todoKey(t: TodoItem) {
  return `${t.kind}:${t.orgId ?? ""}:${t.ref?.helpRequestId ?? ""}:${t.ref?.phone ?? ""}`;
}
const openTodos = computed(() => (data.value?.todos ?? []).filter(t => !done.value.has(todoKey(t))));
const kindsPresent = computed(() => {
  const seen: TodoKind[] = [];
  for (const t of openTodos.value) {
    const short = KIND_META[t.kind].short;
    if (!seen.some(k => KIND_META[k].short === short)) seen.push(t.kind);
  }
  return seen;
});
const filter = ref<string>("all");
const filteredTodos = computed(() => {
  if (filter.value === "all") return openTodos.value;
  const short = KIND_META[filter.value as TodoKind]?.short;
  return openTodos.value.filter(t => KIND_META[t.kind].short === short);
});
watch(kindsPresent, (kinds) => {
  if (filter.value !== "all" && !kinds.includes(filter.value as TodoKind)) filter.value = "all";
});

useHead({ title: computed(() => openTodos.value.length ? `(${openTodos.value.length}) Today · Admin` : "Today · Admin") });

const busyKey = ref<string | null>(null);
async function act(t: TodoItem, fn: () => Promise<unknown>) {
  busyKey.value = todoKey(t);
  try {
    await fn();
    done.value = new Set([...done.value, todoKey(t)]);
  }
  finally {
    busyKey.value = null;
  }
}
// Plain string URLs keep Nuxt's typed-route inference from blowing the type checker's stack.
function call(url: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
  return $fetch<unknown>(url, { method, body });
}
const resolveHelp = (t: TodoItem) => act(t, () => call(`/api/admin/help-requests/${t.ref!.helpRequestId}`, "POST", { status: "resolved" }));
const markSetupHelp = (t: TodoItem) => act(t, () => call(`/api/admin/setup-help/${t.orgId}`, "POST", { handled: true }));
const clearFollowUp = (t: TodoItem) => act(t, () => call(`/api/admin/businesses/${t.orgId}/crm`, "PATCH", { followUpOn: null }));

// Digest email preview and manual send.
const preview = ref<{ subject: string; text: string } | null>(null);
const previewLoading = ref(false);
const sending = ref(false);
const digestNote = ref("");
const digestOk = ref(false);
async function togglePreview() {
  if (preview.value) {
    preview.value = null;
    return;
  }
  previewLoading.value = true;
  try {
    preview.value = await $fetch<{ subject: string; text: string }>("/api/admin/digest" as string);
  }
  finally {
    previewLoading.value = false;
  }
}
async function sendDigest() {
  sending.value = true;
  digestNote.value = "";
  try {
    await $fetch("/api/admin/digest/send", { method: "POST" });
    digestOk.value = true;
    digestNote.value = "Sent. Check your inbox.";
  }
  catch (err) {
    digestOk.value = false;
    digestNote.value = errorMessage(err, "Could not send the email.");
  }
  finally {
    sending.value = false;
  }
}
</script>
