<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-slate-800">Expenses</h1>
      <div class="flex items-center gap-2">
        <button type="button" class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200" aria-label="Export expenses" @click="exportExpenses">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
          <span class="hidden sm:inline">Export</span>
        </button>
        <NuxtLink to="/dashboard/expenses/new">
          <AppButton size="sm" class="whitespace-nowrap">+ Add expense</AppButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <AppSearchBar v-model="filters.search" placeholder="Search vendor or description" class="min-w-0 flex-1" />
        <button
          type="button"
          class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium md:hidden"
          :class="showFilters || activeFilterCount > 0 ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-700'"
          :aria-expanded="showFilters"
          @click="showFilters = !showFilters"
        >
          Filters<span v-if="activeFilterCount > 0" class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-xs font-semibold text-white">{{ activeFilterCount }}</span>
        </button>
      </div>
      <div class="grid-cols-1 gap-3 md:grid md:grid-cols-3" :class="showFilters ? 'grid' : 'hidden'">
        <AppSelect
          v-model="filters.categoryId"
          label="Category"
          :options="[{ value: '', label: 'All categories' }, ...categoryOptions]"
        />
        <AppInput v-model="filters.startDate" type="date" label="From" />
        <AppInput v-model="filters.endDate" type="date" label="To" />
      </div>
      <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          v-for="preset in datePresets"
          :key="preset.label"
          class="shrink-0 whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          @click="applyDatePreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <div v-if="expenses.length === 0">
      <AppEmptyState
        title="No expenses recorded"
        description="Start tracking your business expenses to calculate accurate profit."
      />
    </div>

    <div v-else class="space-y-2">
      <NuxtLink v-for="exp in expenses" :key="exp.id" :to="`/dashboard/expenses/${exp.id}`" class="block">
        <AppCard class="!p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <AppBadge :color="exp.categoryColor">{{ exp.categoryName }}</AppBadge>
                <span class="text-xs text-slate-600">{{ formatDate(exp.date) }}</span>
              </div>
              <p class="font-medium text-slate-800 text-sm">{{ exp.description }}</p>
              <div class="flex items-center gap-2 mt-1">
                <p v-if="exp.vendorName" class="text-xs text-slate-600">{{ exp.vendorName }}</p>
                <span v-if="exp.vendorName" class="text-xs text-slate-600">&middot;</span>
                <p class="text-xs text-slate-600 capitalize">{{ exp.paymentMethod.replace('_', ' ') }}</p>
              </div>
              <p v-if="exp.notes" class="text-xs text-slate-600 mt-1">{{ exp.notes }}</p>
            </div>
            <p class="shrink-0 font-semibold text-slate-800">{{ formatCurrency(exp.amount) }}</p>
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
const { formatCurrency } = useFormatCurrency();
const { formatDate } = useFormatDate();

function exportExpenses() {
  const params = new URLSearchParams();
  if (filters.value.categoryId) params.append("categoryId", filters.value.categoryId);
  if (filters.value.startDate) params.append("startDate", filters.value.startDate);
  if (filters.value.endDate) params.append("endDate", filters.value.endDate);
  window.location.href = `/api/orgs/${orgId.value}/expenses/export?${params.toString()}`;
}

interface ExpenseRow {
  id: number;
  amount: number;
  date: string;
  paymentMethod: string;
  vendorName: string | null;
  description: string;
  notes: string | null;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

interface PaginationMeta {
  page: number;
  total: number;
  totalPages: number;
}

// Fetch categories
const categoriesDataReq = useFetch<{ categories: Category[] }>(
  `/api/orgs/${orgId.value}/expense-categories`
);
const { data: categoriesData } = categoriesDataReq;
const categories = computed(() => categoriesData.value?.categories.filter((c) => c.isActive) ?? []);
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: String(c.id), label: c.name }))
);

const showFilters = ref(false);
const activeFilterCount = computed(() => [filters.value.categoryId, filters.value.startDate, filters.value.endDate].filter(Boolean).length);

// Filters
const filters = ref({
  categoryId: "",
  startDate: "",
  endDate: "",
  search: "",
});

const pagination = usePagination(30);

const query = computed(() => {
  const q: any = { page: pagination._page.value };
  if (filters.value.categoryId) q.categoryId = filters.value.categoryId;
  if (filters.value.startDate) q.startDate = filters.value.startDate;
  if (filters.value.endDate) q.endDate = filters.value.endDate;
  if (filters.value.search) q.search = filters.value.search;
  return q;
});

const expensesDataReq = useFetch<{
  expenses: ExpenseRow[];
  pagination: PaginationMeta;
}>(`/api/orgs/${orgId.value}/expenses`, { query, watch: [query] });
const { data: expensesData, refresh } = expensesDataReq;
// Requests above were started without awaiting so they run in parallel;
// wait for all of them here (keeps SSR and navigation behaviour the same).
await Promise.all([categoriesDataReq, expensesDataReq]);

const expenses = computed(() => expensesData.value?.expenses ?? []);

watch(
  expensesData,
  (val) => {
    pagination.updateFromResponse(val?.pagination);
  },
  { immediate: true }
);

// Date presets
const datePresets = [
  {
    label: "This Month",
    getRange: () => {
      const now = new Date();
      return {
        startDate: toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: todayLocal(),
      };
    },
  },
  {
    label: "Last Month",
    getRange: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: toLocalDateString(lastMonth),
        endDate: toLocalDateString(lastMonthEnd),
      };
    },
  },
  {
    label: "Last 3 Months",
    getRange: () => {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return {
        startDate: toLocalDateString(threeMonthsAgo),
        endDate: todayLocal(),
      };
    },
  },
  {
    label: "This Year",
    getRange: () => {
      const now = new Date();
      return {
        startDate: toLocalDateString(new Date(now.getFullYear(), 0, 1)),
        endDate: todayLocal(),
      };
    },
  },
  {
    label: "All Time",
    getRange: () => ({ startDate: "", endDate: "" }),
  },
];

function applyDatePreset(preset: { getRange: () => { startDate: string; endDate: string } }) {
  const range = preset.getRange();
  filters.value.startDate = range.startDate;
  filters.value.endDate = range.endDate;
  pagination.goToPage(1);
}
</script>
