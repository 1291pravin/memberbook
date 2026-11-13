<template>
  <div class="p-4 space-y-4">
    <div class="space-y-3 sm:flex sm:items-center sm:justify-between sm:space-y-0">
      <div class="flex items-center justify-between gap-3">
        <h1 class="text-xl font-bold text-slate-800">{{ t.members }}</h1>
        <NuxtLink to="/dashboard/members/new" class="sm:hidden">
          <AppButton size="sm" class="whitespace-nowrap">+ {{ t.addMember }}</AppButton>
        </NuxtLink>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200" @click="showImport = true">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15V4m0 0L8 8m4-4l4 4M5 20h14" /></svg>
          Import
        </button>
        <button type="button" class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200" @click="exportMembers">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
          Export
        </button>
        <NuxtLink to="/dashboard/members/new" class="hidden sm:block">
          <AppButton class="whitespace-nowrap">{{ t.addMember }}</AppButton>
        </NuxtLink>
      </div>
    </div>

    <CsvImportModal
      :open="showImport"
      @close="showImport = false"
      @imported="onImported"
    />

    <div class="space-y-2">
      <AppSearchBar v-model="search" placeholder="Search by name or phone..." />
      <div class="flex items-center gap-2">
        <button
          class="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
          :class="quickFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="quickFilter = 'all'"
        >
          All
        </button>
        <button
          class="whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
          :class="quickFilter === 'action-required' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'"
          @click="quickFilter = 'action-required'"
        >
          Action required
        </button>
        <button
          class="relative ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="showFilters || activeFilterCount > 0 ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'"
          :aria-expanded="showFilters"
          @click="showFilters = !showFilters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
          </svg>
          Sort &amp; filter
          <span
            v-if="activeFilterCount > 0"
            class="flex items-center justify-center h-5 min-w-5 rounded-full bg-primary-600 text-white text-xs font-semibold px-1"
          >
            {{ activeFilterCount }}
          </span>
        </button>
      </div>
      <div v-if="showFilters" class="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex sm:flex-wrap sm:items-center">
        <select
          v-model="sortBy"
          aria-label="Sort"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
        <template v-if="quickFilter === 'all'">
        <select
          v-model="planFilter"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Plans</option>
          <option v-for="plan in availablePlans" :key="plan.id" :value="String(plan.id)">
            {{ plan.name }}
          </option>
        </select>
        <select
          v-model="statusFilter"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          v-model="subscriptionFilter"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Subscriptions</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="no-subscription">No Subscription</option>
        </select>
        <select
          v-model="paymentFilter"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">All Payments</option>
          <option value="unpaid-or-partial">Unpaid / Partial</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partially Paid</option>
        </select>
        </template>
        <button
          v-if="activeFilterCount > 0"
          class="text-sm text-slate-600 hover:text-slate-700 underline"
          @click="clearFilters"
        >
          Clear all
        </button>
      </div>
    </div>

    <div v-if="filteredMembers.length === 0 && !loading">
      <AppEmptyState
        :title="quickFilter === 'action-required' ? 'All caught up!' : hasFilters ? `No ${t.membersLower} found` : t.noMembers"
        :description="quickFilter === 'action-required' ? `No ${t.membersLower} need attention right now.` : hasFilters ? 'Try adjusting your filters.' : `Add your first ${t.memberLower} to get started.`"
      >
        <template v-if="!hasFilters" #action>
          <NuxtLink to="/dashboard/members/new">
            <AppButton>{{ t.addMember }}</AppButton>
          </NuxtLink>
        </template>
      </AppEmptyState>
    </div>

    <div v-else class="space-y-2">
      <NuxtLink
        v-for="member in filteredMembers"
        :key="member.id"
        :to="`/dashboard/members/${member.id}`"
        class="block"
      >
        <AppCard class="!p-4 hover:border-primary-200 transition-colors">
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
              <img v-if="member.photoKey" :src="`/api/orgs/${orgId}/members/${member.id}/photo?v=${member.photoKey}`" alt="" class="h-full w-full object-cover">
              <span v-else>{{ memberInitials(member.name) }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <p class="font-medium text-slate-800 truncate">{{ member.name }}</p>
                <p v-if="member.phone" class="shrink-0 text-xs text-slate-600">{{ member.phone }}</p>
              </div>
              <p v-if="member.planName" class="mt-0.5 text-sm text-slate-600 truncate">
                {{ member.planName }}<span v-if="member.subscriptionEndDate"> &middot; ends {{ formatDate(member.subscriptionEndDate) }}</span>
              </p>
              <p v-else class="mt-0.5 text-sm text-slate-600">No plan</p>
              <div v-if="member.status !== 'active' || member.subscriptionEndDate || (member.paymentStatus && member.paymentStatus !== 'paid')" class="mt-1.5 flex flex-wrap gap-1">
                <AppBadge v-if="member.status !== 'active'" color="gray">{{ member.status }}</AppBadge>
                <AppBadge v-if="member.subscriptionEndDate" :color="subscriptionBadgeColor(member)">
                  {{ subscriptionLabel(member) }}
                </AppBadge>
                <AppBadge v-if="member.paymentStatus && member.paymentStatus !== 'paid'" :color="member.paymentStatus === 'unpaid' ? 'red' : 'yellow'">
                  {{ member.paymentStatus === 'unpaid' ? 'unpaid' : 'partial' }}
                </AppBadge>
              </div>
            </div>
          </div>
        </AppCard>
      </NuxtLink>
    </div>

    <AppPagination
      :page="pagination.page.value"
      :total-pages="pagination.totalPages.value"
      :total="pagination.total.value"
      :limit="pagination.limit"
      @update:page="pagination.goToPage"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const t = useTerminology();

interface Member {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  photoKey: string | null;
  subscriptionEndDate: string | null;
  subscriptionStatus: string | null;
  paymentStatus: string | null;
  planName: string | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const showImport = ref(false);
const showFilters = ref(false);

function exportMembers() {
  window.location.href = `/api/orgs/${orgId.value}/members/export`;
}

function onImported() {
  refreshNuxtData();
}

// Initialize plan filter from URL query param (for "View Members" link from plans page)
const route = useRoute();
const initialPlanId = (route.query.planId as string) || "all";

// Auto-open import modal if ?import=1 query param is present
onMounted(() => {
  if (route.query.import === '1') {
    showImport.value = true;
  }
});

const search = ref("");
const quickFilter = ref("all");
const statusFilter = ref("all");
const subscriptionFilter = ref("all");
const paymentFilter = ref("all");
const planFilter = ref(initialPlanId);
const sortBy = ref("newest");

// When "Action Required" is active, clear individual filters; when switching back, reset
watch(quickFilter, (val) => {
  if (val === "action-required") {
    statusFilter.value = "all";
    subscriptionFilter.value = "all";
    paymentFilter.value = "all";
    planFilter.value = "all";
    showFilters.value = false;
  }
});

// Auto-open filters panel if a filter is pre-set via URL
if (initialPlanId !== "all") {
  showFilters.value = true;
}

// Fetch plans for the filter dropdown
interface PlanOption { id: number; name: string }
const plansDataReq = useFetch<{ plans: PlanOption[] }>(
  `/api/orgs/${orgId.value}/plans`,
);
const { data: plansData } = plansDataReq;
const availablePlans = computed(() => plansData.value?.plans ?? []);

const pagination = usePagination(20);

const activeFilterCount = computed(() => {
  let c = 0;
  if (statusFilter.value !== "all") c++;
  if (subscriptionFilter.value !== "all") c++;
  if (paymentFilter.value !== "all") c++;
  if (planFilter.value !== "all") c++;
  return c;
});

const hasFilters = computed(() => search.value || activeFilterCount.value > 0 || quickFilter.value !== "all" || sortBy.value !== "newest");

function clearFilters() {
  statusFilter.value = "all";
  subscriptionFilter.value = "all";
  paymentFilter.value = "all";
  planFilter.value = "all";
}

// When individual filters are set, switch back to "All Members"
watch([statusFilter, subscriptionFilter, paymentFilter, planFilter], () => {
  if (activeFilterCount.value > 0) {
    quickFilter.value = "all";
  }
});

// Reset page when filters change
watch([search, quickFilter, statusFilter, subscriptionFilter, paymentFilter, planFilter, sortBy], () => {
  pagination.resetPage();
});

const query = computed(() => {
  const params: Record<string, string | number> = {};
  if (search.value) params.search = search.value;
  if (quickFilter.value === "action-required") {
    params.actionRequired = "true";
  } else {
    if (statusFilter.value !== "all") params.status = statusFilter.value;
    if (subscriptionFilter.value !== "all") params.subscription = subscriptionFilter.value;
    if (paymentFilter.value !== "all") params.payment = paymentFilter.value;
    if (planFilter.value !== "all") params.planId = planFilter.value;
  }
  if (sortBy.value !== "newest") params.sort = sortBy.value;
  params.page = pagination._page.value;
  return params;
});

const membersDataReq = useFetch<{ members: Member[]; pagination: PaginationMeta }>(
  `/api/orgs/${orgId.value}/members`,
  { query },
);
const { data: membersData, status: membersStatus } = membersDataReq;
// Requests above were started without awaiting so they run in parallel;
// wait for all of them here (keeps SSR and navigation behaviour the same).
await Promise.all([plansDataReq, membersDataReq]);
const filteredMembers = computed(() => membersData.value?.members ?? []);
const loading = computed(() => membersStatus.value === "pending");

watch(membersData, (val) => {
  pagination.updateFromResponse(val?.pagination);
}, { immediate: true });

const { formatDate } = useFormatDate();

function memberInitials(name: string): string {
  const n = name?.trim() || "";
  if (!n) return "?";
  const parts = n.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

function isExpired(member: Member): boolean {
  if (!member.subscriptionEndDate) return false;
  return member.subscriptionEndDate < todayLocal();
}

function isExpiringSoon(member: Member): boolean {
  if (!member.subscriptionEndDate) return false;
  const today = todayLocal();
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = toLocalDateString(weekLater);
  return member.subscriptionEndDate >= today && member.subscriptionEndDate <= weekStr;
}

function subscriptionBadgeColor(member: Member): "green" | "red" | "yellow" | "gray" {
  if (isExpired(member)) return "red";
  if (isExpiringSoon(member)) return "yellow";
  return "green";
}

function subscriptionLabel(member: Member): string {
  if (isExpired(member)) return "expired";
  if (isExpiringSoon(member)) return "expiring soon";
  return "active";
}
</script>
