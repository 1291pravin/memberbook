<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink to="/dashboard/check-ins" class="text-sm text-primary-600 hover:text-primary-500">&larr; Check-Ins</NuxtLink>
        <h1 class="text-xl font-bold text-slate-800 mt-1">Check-In History</h1>
      </div>
    </div>

    <AppSearchBar
      v-model="search"
      placeholder="Search by member name or phone..."
    />

    <div v-if="checkIns.length > 0" class="space-y-3">
      <div
        v-for="ci in checkIns"
        :key="ci.id"
        class="bg-white border border-slate-200 rounded-lg px-4 py-3"
      >
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink :to="`/dashboard/members/${ci.memberId}`" class="text-sm font-medium text-primary-600 hover:text-primary-500">
              {{ ci.memberName }}
            </NuxtLink>
            <p class="text-xs text-slate-500">{{ ci.memberPhone || 'No phone' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge :color="subStatusColor(ci.subscriptionStatus)">
              {{ ci.subscriptionStatus }}
            </AppBadge>
            <AppBadge v-if="ci.autoCheckedOut" color="yellow">auto</AppBadge>
            <AppBadge v-if="!ci.checkedOutAt" color="green">active</AppBadge>
          </div>
        </div>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>In: {{ formatDateTime(ci.checkedInAt) }}</span>
          <span v-if="ci.checkedOutAt">Out: {{ formatDateTime(ci.checkedOutAt) }}</span>
          <span v-if="ci.durationMinutes != null">Duration: {{ formatDuration(ci.durationMinutes) }}</span>
        </div>
      </div>
    </div>
    <AppEmptyState
      v-else
      title="No check-in records"
      description="Check-in history will appear here once members are checked in"
    />

    <AppPagination
      :page="pagination.page"
      :total-pages="pagination.totalPages"
      :total="pagination.total"
      :limit="pagination.limit"
      @update:page="goToPage"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const { formatDate } = useFormatDate();
const { _page, page, limit, updateFromResponse, goToPage } = usePagination(20);

const search = ref("");

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

watch(search, () => { _page.value = 1; });

const { data } = await useFetch<{ checkIns: CheckIn[]; pagination: { page: number; total: number; totalPages: number; limit: number } }>(
  `/api/orgs/${orgId.value}/check-ins`,
  {
    query: computed(() => ({
      status: "all",
      search: search.value || undefined,
      page: page.value,
      limit,
    })),
    watch: [page, search],
  },
);

const checkIns = computed(() => data.value?.checkIns ?? []);
const pagination = computed(() => {
  const p = data.value?.pagination;
  if (p) updateFromResponse(p);
  return p ?? { page: 1, totalPages: 1, total: 0, limit: 20 };
});

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

type BadgeColor = "green" | "red" | "yellow" | "blue" | "gray";
function subStatusColor(status: string): BadgeColor {
  if (status === "active") return "green";
  if (status === "expired") return "red";
  if (status === "inactive") return "gray";
  return "yellow";
}
</script>
