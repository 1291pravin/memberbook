<template>
  <div class="p-4 space-y-6">
    <h1 class="text-xl font-bold text-slate-800">Check-Ins</h1>

    <!-- Check In a Member -->
    <AppCard title="Check In a Member">
      <div class="space-y-3">
        <AppSearchBar
          v-model="memberSearch"
          placeholder="Search member by name or phone..."
        />
        <!-- Search Results -->
        <div v-if="memberSearch && searchResults.length > 0" class="border border-slate-200 rounded-lg divide-y divide-slate-100">
          <div
            v-for="m in searchResults"
            :key="m.id"
            class="flex items-center justify-between px-3 py-2"
          >
            <div>
              <p class="text-sm font-medium text-slate-800">{{ m.name }}</p>
              <p class="text-xs text-slate-500">{{ m.phone || 'No phone' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <AppBadge :color="subStatusColor(m.subscriptionStatus)">
                {{ m.subscriptionStatus || 'no plan' }}
              </AppBadge>
              <AppButton size="sm" :loading="checkingInId === m.id" @click="checkIn(m.id)">
                Check In
              </AppButton>
            </div>
          </div>
        </div>
        <p v-else-if="memberSearch && !searchLoading" class="text-sm text-slate-500">No members found</p>
      </div>

      <!-- Warning Banner -->
      <div v-if="warningMessage" class="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <p class="text-sm text-amber-700">{{ warningMessage }}</p>
        <button class="text-amber-500 hover:text-amber-700 text-sm font-medium" @click="warningMessage = ''">Dismiss</button>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMessage" class="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <p class="text-sm text-red-700">{{ errorMessage }}</p>
        <button class="text-red-500 hover:text-red-700 text-sm font-medium" @click="errorMessage = ''">Dismiss</button>
      </div>
    </AppCard>

    <!-- Currently Checked In -->
    <AppCard title="Currently Checked In">
      <!-- Auto-checkout banner for owners -->
      <div v-if="isOwner && staleCount > 0" class="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <p class="text-sm text-amber-700">{{ staleCount }} check-in(s) older than 24 hours</p>
        <AppButton size="sm" variant="secondary" :loading="autoCheckingOut" @click="autoCheckout">
          Auto Check-Out All
        </AppButton>
      </div>

      <div v-if="activeCheckIns.length > 0" class="space-y-3">
        <div
          v-for="ci in activeCheckIns"
          :key="ci.id"
          class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
        >
          <div>
            <NuxtLink :to="`/dashboard/members/${ci.memberId}`" class="text-sm font-medium text-primary-600 hover:text-primary-500">
              {{ ci.memberName }}
            </NuxtLink>
            <p class="text-xs text-slate-500">{{ ci.memberPhone || 'No phone' }}</p>
            <p class="text-xs text-slate-400">Checked in {{ formatDateTime(ci.checkedInAt) }}</p>
            <p class="text-xs font-medium text-slate-600">{{ liveDuration(ci.checkedInAt) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge :color="subStatusColor(ci.subscriptionStatus)">
              {{ ci.subscriptionStatus }}
            </AppBadge>
            <AppButton size="sm" variant="secondary" :loading="checkingOutId === ci.id" @click="checkOut(ci.id)">
              Check Out
            </AppButton>
          </div>
        </div>
      </div>
      <AppEmptyState
        v-else
        title="No active check-ins"
        description="Search for a member above to check them in"
      />
    </AppCard>

    <!-- Link to history -->
    <div class="text-center">
      <NuxtLink to="/dashboard/check-ins/history" class="text-sm text-primary-600 hover:text-primary-500">
        View Check-In History &rarr;
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId, currentOrg } = useOrg();
const { formatDate } = useFormatDate();
const isOwner = computed(() => currentOrg.value?.role === "owner");

interface SearchMember {
  id: number;
  name: string;
  phone: string | null;
  subscriptionStatus: string | null;
}

interface CheckIn {
  id: number;
  memberId: number;
  memberName: string;
  memberPhone: string | null;
  checkedInAt: string;
  checkedOutAt: string | null;
  durationMinutes: number | null;
  autoCheckedOut: boolean;
  subscriptionStatus: string;
  notes: string | null;
}

const memberSearch = ref("");
const searchResults = ref<SearchMember[]>([]);
const searchLoading = ref(false);
const checkingInId = ref<number | null>(null);
const checkingOutId = ref<number | null>(null);
const autoCheckingOut = ref(false);
const warningMessage = ref("");
const errorMessage = ref("");
const cacheVersion = ref(Date.now());

// Debounced member search
let searchTimeout: ReturnType<typeof setTimeout>;
watch(memberSearch, (val) => {
  clearTimeout(searchTimeout);
  if (!val || val.length < 2) {
    searchResults.value = [];
    return;
  }
  searchTimeout = setTimeout(async () => {
    searchLoading.value = true;
    try {
      const data = await $fetch<{ members: SearchMember[] }>(
        `/api/orgs/${orgId.value}/members`,
        { query: { search: val, limit: 5 } },
      );
      searchResults.value = data.members;
    } catch {
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }, 300);
});

// Fetch active check-ins
const { data: activeData, refresh: refreshActive } = await useFetch<{ checkIns: CheckIn[] }>(
  `/api/orgs/${orgId.value}/check-ins`,
  { query: computed(() => ({ status: "active", _v: cacheVersion.value })) },
);
const activeCheckIns = computed(() => activeData.value?.checkIns ?? []);

const staleCount = computed(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return activeCheckIns.value.filter(ci => new Date(ci.checkedInAt).getTime() < cutoff).length;
});

// Live duration ticker
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval>;
onMounted(() => {
  ticker = setInterval(() => { now.value = Date.now(); }, 60000);
});
onUnmounted(() => clearInterval(ticker));

function liveDuration(checkedInAt: string): string {
  const ms = now.value - new Date(checkedInAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

type BadgeColor = "green" | "red" | "yellow" | "blue" | "gray";
function subStatusColor(status: string | null): BadgeColor {
  if (status === "active") return "green";
  if (status === "expired") return "red";
  if (status === "inactive") return "gray";
  return "yellow";
}

async function checkIn(mId: number) {
  checkingInId.value = mId;
  errorMessage.value = "";
  warningMessage.value = "";
  try {
    const data = await $fetch<{ checkIn: CheckIn; warning: string }>(
      `/api/orgs/${orgId.value}/check-ins`,
      { method: "POST", body: { memberId: mId } },
    );
    if (data.warning) {
      warningMessage.value = data.warning;
    }
    memberSearch.value = "";
    searchResults.value = [];
    cacheVersion.value = Date.now();
    await refreshActive();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to check in";
  } finally {
    checkingInId.value = null;
  }
}

async function checkOut(checkInId: number) {
  checkingOutId.value = checkInId;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/check-ins/${checkInId}`, { method: "PUT" });
    cacheVersion.value = Date.now();
    await refreshActive();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to check out";
  } finally {
    checkingOutId.value = null;
  }
}

async function autoCheckout() {
  autoCheckingOut.value = true;
  errorMessage.value = "";
  try {
    const data = await $fetch<{ checkedOutCount: number }>(
      `/api/orgs/${orgId.value}/check-ins/auto-checkout`,
      { method: "POST" },
    );
    warningMessage.value = `Auto checked out ${data.checkedOutCount} member(s)`;
    cacheVersion.value = Date.now();
    await refreshActive();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to auto check-out";
  } finally {
    autoCheckingOut.value = false;
  }
}
</script>
