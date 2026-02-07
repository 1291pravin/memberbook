<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">{{ t.members }}</h1>
      <div class="flex gap-2">
        <AppButton variant="secondary" @click="showImport = true">Import</AppButton>
        <AppButton variant="secondary" @click="exportMembers">Export</AppButton>
        <NuxtLink to="/dashboard/members/new">
          <AppButton>{{ t.addMember }}</AppButton>
        </NuxtLink>
      </div>
    </div>

    <CsvImportModal
      :open="showImport"
      @close="showImport = false"
      @imported="onImported"
    />

    <div class="space-y-2">
      <div class="flex gap-2">
        <button
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="quickFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          @click="quickFilter = 'all'"
        >
          All {{ t.members }}
        </button>
        <button
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="quickFilter === 'action-required' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'"
          @click="quickFilter = 'action-required'"
        >
          Action Required
        </button>
      </div>
      <div class="flex gap-2 items-center">
        <AppSearchBar v-model="search" placeholder="Search by name or phone..." class="flex-1 min-w-0" />
        <button
          class="relative flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          :class="showFilters || activeFilterCount > 0 ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'"
          @click="showFilters = !showFilters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
          </svg>
          <span class="hidden sm:inline">Filters</span>
          <span
            v-if="activeFilterCount > 0"
            class="flex items-center justify-center h-5 min-w-5 rounded-full bg-primary-600 text-white text-xs font-semibold px-1"
          >
            {{ activeFilterCount }}
          </span>
        </button>
        <select
          v-model="sortBy"
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>
      <div v-if="showFilters && quickFilter === 'all'" class="flex flex-wrap gap-2 items-center rounded-lg border border-slate-200 bg-slate-50 p-3">
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
        <button
          v-if="activeFilterCount > 0"
          class="text-sm text-slate-500 hover:text-slate-700 underline"
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
        <AppCard class="hover:border-primary-200 transition-colors">
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-slate-800">{{ member.name }}</p>
              <p v-if="member.phone" class="text-sm text-slate-500">{{ member.phone }}</p>
              <p v-if="member.planName" class="text-sm text-slate-500 mt-0.5">
                {{ member.planName }}
                <span v-if="member.subscriptionEndDate" class="text-slate-400">
                  &middot; ends {{ formatDate(member.subscriptionEndDate) }}
                </span>
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 ml-2 shrink-0">
              <AppBadge :color="member.status === 'active' ? 'green' : 'gray'">
                {{ member.status }}
              </AppBadge>
              <AppBadge v-if="member.subscriptionEndDate" :color="subscriptionBadgeColor(member)">
                {{ subscriptionLabel(member) }}
              </AppBadge>
              <AppBadge v-if="member.paymentStatus && member.paymentStatus !== 'paid'" :color="member.paymentStatus === 'unpaid' ? 'red' : 'yellow'">
                {{ member.paymentStatus === 'unpaid' ? 'unpaid' : 'partial' }}
              </AppBadge>
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
const { data: plansData } = await useFetch<{ plans: PlanOption[] }>(
  `/api/orgs/${orgId.value}/plans`,
);
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

const { data: membersData, status: membersStatus } = await useFetch<{ members: Member[]; pagination: PaginationMeta }>(
  `/api/orgs/${orgId.value}/members`,
  { query },
);
const filteredMembers = computed(() => membersData.value?.members ?? []);
const loading = computed(() => membersStatus.value === "pending");

watch(membersData, (val) => {
  pagination.updateFromResponse(val?.pagination);
}, { immediate: true });

const { formatDate } = useFormatDate();

function isExpired(member: Member): boolean {
  if (!member.subscriptionEndDate) return false;
  return member.subscriptionEndDate < new Date().toISOString().split("T")[0];
}

function isExpiringSoon(member: Member): boolean {
  if (!member.subscriptionEndDate) return false;
  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];
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
