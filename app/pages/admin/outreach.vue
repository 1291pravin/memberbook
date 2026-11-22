<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Outreach</h1>
      <p class="mt-1 text-sm text-slate-600">
        Cold emails to gyms, libraries and coaching centres, sent from support@memberbook.in at 9 AM IST.
      </p>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      Could not load outreach.
    </div>

    <div v-if="pending" class="grid gap-4 grid-cols-2 md:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-lg bg-white" />
    </div>

    <template v-else-if="data">
      <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <span class="inline-flex items-center gap-1.5 font-semibold text-slate-800">
          <span class="h-2 w-2 rounded-full" :class="data.enabled && data.hasKey ? 'bg-green-600' : 'bg-slate-400'" aria-hidden="true" />
          {{ data.enabled && data.hasKey ? "Sending is on" : "Sending is off" }}
        </span>
        &middot; {{ data.sentToday }} of {{ data.dailyCap }} sent today &middot; one follow-up {{ data.followUpDays }} days after the first email.
        <a href="https://resend.com/emails" target="_blank" rel="noopener" class="font-semibold text-primary-700 hover:underline">See each email in Resend</a>
      </div>

      <div class="grid gap-3 grid-cols-2 md:grid-cols-4">
        <div v-for="s in stats" :key="s.label" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p class="text-sm text-slate-600">{{ s.label }}</p>
          <p class="mt-1 text-2xl font-semibold text-slate-900">{{ s.value }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="min-h-9 rounded-full border px-3 text-sm font-medium"
          :class="filter === f.key ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
          @click="filter = f.key"
        >
          {{ f.label }} ({{ f.count }})
        </button>
      </div>

      <AppCard>
        <p v-if="!shown.length" class="py-6 text-center text-sm text-slate-600">No leads here yet.</p>
        <ul class="divide-y divide-slate-100">
          <li v-for="lead in shown" :key="lead.id" class="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p class="font-semibold text-slate-800">{{ lead.businessName }}</p>
                <span v-if="lead.businessType" class="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">{{ lead.businessType }}</span>
                <span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusDot(lead.status)" aria-hidden="true" />{{ statusLabel(lead) }}
                </span>
              </div>
              <p class="mt-0.5 break-all text-sm text-slate-600">
                {{ lead.email }}<template v-if="lead.city"> &middot; {{ lead.city }}</template>
              </p>
              <p class="mt-0.5 text-xs text-slate-600">{{ timeline(lead) }}</p>
              <p v-if="lead.lastError" class="mt-0.5 text-xs text-red-700">Error: {{ lead.lastError }}</p>
              <p v-if="lead.notes" class="mt-0.5 text-xs text-slate-600">Note: {{ lead.notes }}</p>
            </div>
            <div class="flex shrink-0 flex-wrap gap-3 text-sm">
              <a v-if="lead.sourceUrl" :href="lead.sourceUrl" target="_blank" rel="noopener" class="font-semibold text-primary-700 hover:underline">Their website</a>
              <button
                v-if="lead.status === 'sent' || lead.status === 'followed_up'"
                type="button"
                class="font-semibold text-primary-700 hover:underline disabled:opacity-50"
                :disabled="busyId === lead.id"
                @click="mark(lead.id, 'replied')"
              >
                Mark replied
              </button>
            </div>
          </li>
        </ul>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Outreach" });

type Lead = {
  id: number;
  email: string;
  businessName: string;
  businessType: string | null;
  city: string | null;
  sourceUrl: string | null;
  notes: string | null;
  createdAt: string;
  status: string;
  sentAt: string | null;
  followedUpAt: string | null;
  lastError: string | null;
};
type Outreach = {
  enabled: boolean;
  hasKey: boolean;
  dailyCap: number;
  followUpDays: number;
  sentToday: number;
  counts: Record<string, number>;
  leads: Lead[];
};

const requestFetch = useRequestFetch();
const { data, pending, error, refresh } = await useAsyncData<Outreach>("admin-outreach", () => requestFetch("/api/admin/outreach"));

const leads = computed(() => data.value?.leads ?? []);
const count = (status: string) => data.value?.counts?.[status] ?? 0;
const emailed = computed(() => leads.value.filter(l => l.sentAt).length);
const followedUp = computed(() => leads.value.filter(l => l.followedUpAt).length);

const stats = computed(() => [
  { label: "Emailed", value: emailed.value },
  { label: "Followed up", value: followedUp.value },
  { label: "Replied", value: count("replied") },
  { label: "Waiting to send", value: count("new") },
]);

const filter = ref("all");
const filters = computed(() => [
  { key: "all", label: "All", count: leads.value.length },
  { key: "sent", label: "Emailed", count: count("sent") + count("followed_up") },
  { key: "replied", label: "Replied", count: count("replied") },
  { key: "new", label: "Waiting", count: count("new") },
  { key: "stopped", label: "Stopped", count: count("unsubscribed") + count("bounced") + count("failed") },
]);
const shown = computed(() => {
  if (filter.value === "all") return leads.value;
  if (filter.value === "stopped") return leads.value.filter(l => ["unsubscribed", "bounced", "failed"].includes(l.status));
  if (filter.value === "sent") return leads.value.filter(l => l.status === "sent" || l.status === "followed_up");
  return leads.value.filter(l => l.status === filter.value);
});

function statusDot(status: string) {
  if (status === "replied") return "bg-green-600";
  if (status === "sent" || status === "followed_up") return "bg-primary-600";
  if (status === "new") return "bg-slate-400";
  return "bg-red-600";
}
function statusLabel(lead: Lead) {
  if (lead.status === "sent") return "Emailed";
  if (lead.status === "followed_up") return "Followed up";
  if (lead.status === "new") return "Waiting to send";
  return lead.status.charAt(0).toUpperCase() + lead.status.slice(1);
}

function fmt(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}
function timeline(lead: Lead) {
  if (!lead.sentAt) return `Added ${fmt(lead.createdAt)}`;
  const parts = [`Emailed ${fmt(lead.sentAt)}`];
  if (lead.followedUpAt) parts.push(`followed up ${fmt(lead.followedUpAt)}`);
  else if (lead.status === "sent") {
    const due = new Date(new Date(lead.sentAt).getTime() + (data.value?.followUpDays ?? 5) * 86400000);
    parts.push(`follow-up due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`);
  }
  return parts.join(" · ");
}

const busyId = ref<number | null>(null);
async function mark(id: number, status: string) {
  busyId.value = id;
  try {
    await $fetch(`/api/admin/outreach/leads/${id}`, { method: "POST", body: { status } });
    await refresh();
  } finally {
    busyId.value = null;
  }
}
</script>
