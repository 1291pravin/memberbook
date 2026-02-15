<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Expenses</h1>
      <div class="flex gap-2">
        <AppButton variant="secondary" @click="exportExpenses">Export</AppButton>
        <NuxtLink to="/dashboard/expenses/new">
          <AppButton>Add Expense</AppButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <AppSelect
        v-model="filters.categoryId"
        label="Category"
        :options="categoryOptions"
        placeholder="All Categories"
      />

      <AppInput v-model="filters.startDate" type="date" label="Start Date" />
      <AppInput v-model="filters.endDate" type="date" label="End Date" />
      <AppSearchBar v-model="filters.search" placeholder="Search vendor or description" />
    </div>

    <!-- Quick date presets -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="preset in datePresets"
        :key="preset.label"
        @click="applyDatePreset(preset)"
        class="px-3 py-1 text-xs rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
      >
        {{ preset.label }}
      </button>
    </div>

    <div v-if="expenses.length === 0">
      <AppEmptyState
        title="No expenses recorded"
        description="Start tracking your business expenses to calculate accurate profit."
      />
    </div>

    <div v-else class="space-y-2">
      <NuxtLink v-for="exp in expenses" :key="exp.id" :to="`/dashboard/expenses/${exp.id}`">
        <AppCard class="hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <AppBadge :color="exp.categoryColor">{{ exp.categoryName }}</AppBadge>
                <span class="text-xs text-slate-600">{{ formatDate(exp.date) }}</span>
              </div>
              <p class="font-medium text-slate-800 text-sm">{{ exp.description }}</p>
              <div class="flex items-center gap-2 mt-1">
                <p v-if="exp.vendorName" class="text-xs text-slate-600">{{ exp.vendorName }}</p>
                <span v-if="exp.vendorName" class="text-xs text-slate-400">&middot;</span>
                <p class="text-xs text-slate-600 capitalize">{{ exp.paymentMethod.replace('_', ' ') }}</p>
              </div>
              <p v-if="exp.notes" class="text-xs text-slate-600 mt-1">{{ exp.notes }}</p>
            </div>
            <p class="font-semibold text-slate-800">{{ formatCurrency(exp.amount) }}</p>
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
const { data: categoriesData } = await useFetch<{ categories: Category[] }>(
  `/api/orgs/${orgId.value}/expense-categories`
);
const categories = computed(() => categoriesData.value?.categories.filter((c) => c.isActive) ?? []);
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: String(c.id), label: c.name }))
);

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

const { data: expensesData, refresh } = await useFetch<{
  expenses: ExpenseRow[];
  pagination: PaginationMeta;
}>(`/api/orgs/${orgId.value}/expenses`, { query, watch: [query] });

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
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
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
        startDate: lastMonth.toISOString().split("T")[0],
        endDate: lastMonthEnd.toISOString().split("T")[0],
      };
    },
  },
  {
    label: "Last 3 Months",
    getRange: () => {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return {
        startDate: threeMonthsAgo.toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      };
    },
  },
  {
    label: "This Year",
    getRange: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
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
