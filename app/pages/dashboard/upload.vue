<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Send us your data</h1>
      <p class="mt-1 text-sm text-slate-600">
        Send your {{ t.membersLower }} list once, in any format. We add your plans, {{ t.membersLower }} and due dates,
        and from then on MemberBook keeps track of who needs to pay.
      </p>
    </div>

    <div v-if="justSent" class="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
      Got it. We're adding your data now, usually within a few hours. This page shows when it's done.
    </div>

    <AppCard v-if="uploads?.length" title="What you've sent">
      <ul class="divide-y divide-slate-100">
        <li v-for="u in uploads" :key="u.id" class="py-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800">
                {{ describe(u) }}
              </p>
              <p class="text-xs text-slate-600">Sent {{ formatDate(u.createdAt) }}</p>
            </div>
            <AppBadge :color="statusColor(u.status)">{{ statusLabel(u.status) }}</AppBadge>
          </div>

          <div v-if="u.status === 'done' && u.result" class="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
            <p>
              <span class="font-semibold">{{ u.result.membersLoaded }} {{ t.membersLower }} added</span><template v-if="u.result.plansCreated">
                and {{ u.result.plansCreated }} {{ u.result.plansCreated === 1 ? "plan" : "plans" }}</template>.
              <template v-if="u.result.dueNow">{{ u.result.dueNow }} {{ u.result.dueNow === 1 ? "needs" : "need" }} to pay now.</template>
            </p>
            <p v-if="u.result.membersWithoutDueDate" class="mt-1 text-slate-600">
              {{ u.result.membersWithoutDueDate }} {{ u.result.membersWithoutDueDate === 1 ? "has" : "have" }} no due date yet. Add one from their page so we can remind them.
            </p>
            <details v-if="problems(u).length" class="mt-2">
              <summary class="cursor-pointer text-sm font-medium text-amber-800">
                {{ problems(u).length }} {{ problems(u).length === 1 ? "row needs" : "rows need" }} a look
              </summary>
              <ul class="mt-2 space-y-1 text-sm text-slate-700">
                <li v-for="(p, i) in problems(u)" :key="i">
                  <span class="font-medium">{{ p.name || "Unnamed row" }}:</span> {{ p.reason }}
                </li>
              </ul>
            </details>
            <div class="mt-3 flex flex-wrap gap-2">
              <AppButton size="sm" @click="navigateTo('/dashboard/collections')">See who needs to pay</AppButton>
              <AppButton size="sm" variant="secondary" @click="navigateTo('/dashboard/members')">See {{ t.membersLower }}</AppButton>
            </div>
          </div>
          <p v-else-if="u.status === 'failed'" class="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {{ u.message || "We couldn't read this one." }}
          </p>
        </li>
      </ul>
    </AppCard>

    <AppCard :title="uploads?.length ? 'Send more' : undefined">
      <DataUploadForm :show-upi="isOwner" @uploaded="onUploaded" />
      <p class="mt-4 text-center text-sm text-slate-600">
        Prefer WhatsApp?
        <a :href="whatsappLink(waMessage)" target="_blank" rel="noopener" class="font-medium text-primary-700 hover:underline">Send it to us there</a>
      </p>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Send us your data - MemberBook" });

interface Problem { name?: string | null; reason: string }
interface Upload {
  id: number;
  status: string;
  files: string[];
  hasText: boolean;
  result: { plansCreated: number; membersLoaded: number; membersWithoutDueDate: number; dueNow: number; skipped: Problem[]; warnings?: Problem[] } | null;
  message: string | null;
  createdAt: string;
  processedAt: string | null;
}

const { orgId, currentOrg } = useOrg();
const t = useTerminology();
const { whatsappLink } = useSupport();
const isOwner = computed(() => currentOrg.value?.role === "owner");
const justSent = ref(useRoute().query.sent === "1");

const { data: uploads, refresh } = await useFetch<Upload[]>(() => `/api/orgs/${orgId.value}/uploads`, {
  key: `uploads-${orgId.value}`,
});

const waMessage = computed(() =>
  `Hi MemberBook team, here is the ${t.value.membersLower} list for ${currentOrg.value?.name ?? "my business"}.`,
);

// Check back while something is still being loaded.
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    if (uploads.value?.some(u => u.status === "pending" || u.status === "processing")) refresh();
  }, 60000);
});
onBeforeUnmount(() => clearInterval(timer));

async function onUploaded() {
  justSent.value = true;
  await refresh();
}

function describe(u: Upload) {
  const parts = [];
  if (u.files.length) parts.push(u.files.length === 1 ? u.files[0] : `${u.files.length} files`);
  if (u.hasText) parts.push("pasted list");
  return parts.join(" and ");
}

function problems(u: Upload) {
  return [...(u.result?.skipped ?? []), ...(u.result?.warnings ?? [])];
}

function statusLabel(s: string) {
  return { pending: "Waiting", processing: "Adding now", done: "Added", failed: "Couldn't read" }[s] ?? s;
}

function statusColor(s: string) {
  return ({ pending: "yellow", processing: "blue", done: "green", failed: "red" } as const)[s as "pending"] ?? "gray";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}
</script>
