<template>
  <div class="space-y-5">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Businesses</h1>
        <p class="mt-1 text-sm text-slate-600">
          Every business on MemberBook, how it's doing, and where it stands with us.
        </p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          v-model="search"
          type="search"
          placeholder="Search name, owner, email or phone"
          class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:w-72"
        >
        <select
          v-model="sort"
          aria-label="Sort"
          class="block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          <option value="health">Sort by health</option>
          <option value="recent">Newest signup</option>
          <option value="lastActive">Last active</option>
          <option value="members">Most members</option>
          <option value="collected">Most recorded (30 days)</option>
          <option value="followUp">Follow-up date</option>
        </select>
      </div>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="chip in chips"
        :key="chip.value"
        type="button"
        class="inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors"
        :class="health === chip.value ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
        :title="chip.help"
        @click="health = chip.value"
      >
        <span v-if="chip.dot" class="h-2 w-2 rounded-full" :class="chip.dot" aria-hidden="true" />
        {{ chip.label }}
        <span class="tabular-nums text-slate-600">{{ chip.count }}</span>
      </button>
      <label class="ml-auto inline-flex items-center gap-2 text-sm text-slate-600">
        <input v-model="includeTest" type="checkbox" class="h-4 w-4 rounded border-slate-300">
        Show test businesses<template v-if="data?.testCount"> ({{ data.testCount }})</template>
      </label>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      Could not load businesses.
    </div>

    <div v-if="pending && !data" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-16 animate-pulse rounded-xl bg-white" />
    </div>

    <div v-else-if="data" class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th class="whitespace-nowrap px-4 py-2.5">Business</th>
              <th class="whitespace-nowrap px-3 py-2.5">Health</th>
              <th class="whitespace-nowrap px-3 py-2.5">Last active</th>
              <th class="whitespace-nowrap px-3 py-2.5 text-right">Members</th>
              <th class="whitespace-nowrap px-3 py-2.5 text-right">Recorded, 30d</th>
              <th class="whitespace-nowrap px-3 py-2.5">Collections</th>
              <th class="whitespace-nowrap px-3 py-2.5">With us</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr
              v-for="b in rows"
              :key="b.id"
              class="cursor-pointer align-top hover:bg-slate-50"
              @click="navigateTo(`/admin/businesses/${b.id}`)"
            >
              <td class="px-4 py-3">
                <NuxtLink :to="`/admin/businesses/${b.id}`" class="font-semibold text-slate-900 hover:text-primary-700" @click.stop>
                  {{ b.name }}
                </NuxtLink>
                <p class="mt-0.5 text-xs text-slate-600">
                  <span class="capitalize">{{ b.type }}</span> · {{ b.ownerName || (b.heldBySetup ? "Held by us" : "No owner") }}
                  <template v-if="b.ownerWhatsapp"> · {{ b.ownerWhatsapp }}</template>
                </p>
                <p class="text-xs text-slate-600">Joined {{ formatDate(b.createdAt) }}</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <span class="inline-flex items-center gap-1.5 font-medium text-slate-800" :title="HEALTH_META[b.health].help">
                  <span class="h-2 w-2 rounded-full" :class="HEALTH_META[b.health].dot" aria-hidden="true" />
                  {{ HEALTH_META[b.health].label }}
                </span>
                <p v-if="b.setupHelpAskedAt && !b.setupHelpHandledAt" class="mt-0.5 text-xs font-medium text-red-700">Wants setup help</p>
                <p v-else-if="b.uploadsWaiting" class="mt-0.5 text-xs text-slate-600">Upload waiting</p>
                <p v-else-if="b.lastUploadStatus === 'failed'" class="mt-0.5 text-xs font-medium text-red-700">Upload failed</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <p class="text-slate-800">{{ ago(b.lastActiveAt) }}</p>
                <p class="mt-0.5 text-xs text-slate-600">{{ b.activeDays30 }} of last 30 days</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                <p class="text-slate-800">{{ formatNumber(b.realMembers) }}</p>
                <p v-if="b.membersAdded30" class="mt-0.5 text-xs text-slate-600">+{{ b.membersAdded30 }} in 30d</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                <p class="text-slate-800">{{ formatRupees(b.collected30) }}</p>
                <p class="mt-0.5 text-xs text-slate-600">{{ b.payments30 }} payments</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3 text-xs text-slate-600">
                <p :class="b.upiSet ? '' : 'font-medium text-amber-700'">{{ b.upiSet ? "UPI set" : "No UPI ID" }}</p>
                <p class="mt-0.5">{{ b.unpaidSubscriptions }} unpaid · {{ b.reminders30 }} reminders</p>
                <p v-if="b.claimsWaiting" class="mt-0.5 font-medium text-amber-700">{{ b.claimsWaiting }} to confirm</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3 text-xs">
                <p class="font-medium text-slate-800">{{ stageLabel(b.stage) }}</p>
                <p
                  v-if="b.followUpOn"
                  class="mt-0.5"
                  :class="b.followUpOn <= todayIso ? 'font-medium text-red-700' : 'text-slate-600'"
                >
                  Follow up {{ b.followUpOn <= todayIso ? (b.followUpOn === todayIso ? "today" : `since ${formatDate(b.followUpOn)}`) : formatDate(b.followUpOn) }}
                </p>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="7" class="px-4 py-10 text-center text-sm text-slate-600">
                No businesses match. Try another filter or clear the search.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600">
        Showing {{ rows.length }} of {{ data.businesses.length }}. Members excludes sample data. "Last active" is the latest visit, member or payment.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminBusiness } from "~/composables/useAdmin";

definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Businesses · Admin" });

interface BusinessesData {
  businesses: AdminBusiness[];
  counts: Record<string, number>;
  testCount: number;
  stages: Array<{ value: string; label: string }>;
}

const route = useRoute();
const router = useRouter();
const { formatNumber, formatRupees, formatDate, ago } = useAdmin();

const includeTest = ref(false);
const requestFetch = useRequestFetch();
const { data, pending, error } = await useAsyncData<BusinessesData>(
  "admin-businesses",
  () => requestFetch("/api/admin/businesses", { query: includeTest.value ? { all: "1" } : {} }),
  { watch: [includeTest] },
);

const health = ref<string>(typeof route.query.health === "string" ? route.query.health : "all");
const search = ref(typeof route.query.q === "string" ? route.query.q : "");
const sort = ref("health");

watch([health, search], ([h, q]) => {
  router.replace({ query: { ...(h !== "all" ? { health: h } : {}), ...(q ? { q } : {}) } });
});

const todayIso = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const chips = computed(() => {
  const counts = data.value?.counts ?? {};
  const total = data.value?.businesses.length ?? 0;
  const followUps = (data.value?.businesses ?? []).filter(b => b.followUpOn && b.followUpOn <= todayIso).length;
  return [
    { value: "all", label: "All", count: total, dot: "", help: "" },
    ...HEALTH_ORDER.map(h => ({ value: h, label: HEALTH_META[h].label, count: counts[h] ?? 0, dot: HEALTH_META[h].dot, help: HEALTH_META[h].help })),
    { value: "follow_up", label: "Follow-up due", count: followUps, dot: "", help: "Follow-up date is today or earlier" },
  ];
});

function stageLabel(stage: string | null) {
  if (!stage) return "No stage";
  return data.value?.stages.find(s => s.value === stage)?.label ?? stage;
}

const rows = computed(() => {
  let list = data.value?.businesses ?? [];
  if (health.value === "follow_up") list = list.filter(b => b.followUpOn && b.followUpOn <= todayIso);
  else if (health.value !== "all") list = list.filter(b => b.health === health.value);

  const q = search.value.trim().toLowerCase();
  if (q) {
    const digits = q.replace(/\D/g, "");
    list = list.filter(b =>
      b.name.toLowerCase().includes(q)
      || (b.ownerName ?? "").toLowerCase().includes(q)
      || (b.ownerEmail ?? "").toLowerCase().includes(q)
      || (digits.length >= 4 && (b.ownerWhatsapp ?? "").replace(/\D/g, "").includes(digits)),
    );
  }

  const time = (v: string | null) => (v ? new Date(v.length === 10 ? `${v}T12:00:00+05:30` : v).getTime() : 0);
  const sorted = [...list];
  switch (sort.value) {
    case "recent": sorted.sort((a, b) => time(b.createdAt) - time(a.createdAt)); break;
    case "lastActive": sorted.sort((a, b) => time(b.lastActiveAt) - time(a.lastActiveAt)); break;
    case "members": sorted.sort((a, b) => b.realMembers - a.realMembers); break;
    case "collected": sorted.sort((a, b) => b.collected30 - a.collected30); break;
    case "followUp": sorted.sort((a, b) => (a.followUpOn ?? "9999").localeCompare(b.followUpOn ?? "9999")); break;
    default:
      sorted.sort((a, b) =>
        HEALTH_ORDER.indexOf(a.health) - HEALTH_ORDER.indexOf(b.health)
        || b.realMembers - a.realMembers
        || time(b.createdAt) - time(a.createdAt));
  }
  return sorted;
});
</script>
