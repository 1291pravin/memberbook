<template>
  <div class="p-4 max-w-lg">
    <div class="mb-6">
      <NuxtLink to="/dashboard/expenses" class="text-sm text-primary-600 hover:text-primary-500">&larr; Expenses</NuxtLink>
      <h1 class="text-xl font-bold text-slate-800 mt-1">Edit Expense</h1>
    </div>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-if="!expense" class="text-sm text-slate-600">Loading...</div>

    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <AppSelect
        v-model="form.categoryId"
        label="Category"
        :options="categoryOptions"
        placeholder="Select category"
        required
      />

      <AppInput
        v-model="form.description"
        label="Description"
        placeholder="What was purchased?"
        required
      />

      <AppInput
        v-model="form.amount"
        label="Amount (Rupees)"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
      />

      <AppInput
        v-model="form.date"
        label="Date"
        type="date"
        required
      />

      <AppSelect
        v-model="form.paymentMethod"
        label="Payment Method"
        :options="paymentMethodOptions"
      />

      <AppInput
        v-model="form.vendorName"
        label="Vendor/Supplier (Optional)"
        placeholder="Company or person name"
      />

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder="Additional details"
        />
      </div>

      <div class="border-t border-slate-200 pt-4">
        <p class="text-xs text-slate-600">
          Created by {{ expense.createdByName }} on {{ formatDate(expense.createdAt) }}
        </p>
      </div>

      <div class="flex gap-2">
        <AppButton type="submit" :loading="saving">Update</AppButton>
        <AppButton variant="secondary" @click="$router.back()">Cancel</AppButton>
        <AppButton
          v-if="isOwner"
          variant="danger"
          :loading="deleting"
          @click="handleDelete"
          class="ml-auto"
        >
          Delete
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const router = useRouter();
const route = useRoute();
const { formatDate } = useFormatDate();

const expenseId = parseInt(route.params.id as string);

interface Expense {
  id: number;
  amount: number;
  date: string;
  paymentMethod: string;
  vendorName: string | null;
  description: string;
  notes: string | null;
  categoryId: number;
  categoryName: string;
  createdByName: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

// Fetch expense
const { data: expenseData } = await useFetch<{ expense: Expense }>(
  `/api/orgs/${orgId.value}/expenses/${expenseId}`
);
const expense = computed(() => expenseData.value?.expense);

// Fetch categories
const { data: categoriesData } = await useFetch<{ categories: Category[] }>(
  `/api/orgs/${orgId.value}/expense-categories`
);
const activeCategories = computed(() =>
  categoriesData.value?.categories.filter((c) => c.isActive) ?? []
);

const categoryOptions = computed(() =>
  activeCategories.value.map((c) => ({ value: String(c.id), label: c.name }))
);

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

// Check if user is owner (for delete permission)
const { data: sessionData } = await useFetch("/api/auth/session");
const isOwner = computed(() => sessionData.value?.currentOrg?.role === "owner");

const form = ref({
  categoryId: "",
  description: "",
  amount: "",
  date: "",
  paymentMethod: "cash",
  vendorName: "",
  notes: "",
});

// Initialize form when expense loads
watch(
  expense,
  (exp) => {
    if (exp) {
      form.value = {
        categoryId: exp.categoryId.toString(),
        description: exp.description,
        amount: (exp.amount / 100).toFixed(2), // Convert paise to rupees
        date: exp.date,
        paymentMethod: exp.paymentMethod,
        vendorName: exp.vendorName || "",
        notes: exp.notes || "",
      };
    }
  },
  { immediate: true }
);

const error = ref("");
const saving = ref(false);
const deleting = ref(false);

async function handleSubmit() {
  error.value = "";
  saving.value = true;

  try {
    const amountInPaise = Math.round(parseFloat(form.value.amount) * 100);

    await $fetch(`/api/orgs/${orgId.value}/expenses/${expenseId}`, {
      method: "PUT",
      body: {
        categoryId: parseInt(form.value.categoryId),
        description: form.value.description,
        amount: amountInPaise,
        date: form.value.date,
        paymentMethod: form.value.paymentMethod,
        vendorName: form.value.vendorName || null,
        notes: form.value.notes || null,
      },
    });

    router.push("/dashboard/expenses");
  } catch (e: any) {
    error.value = e.data?.message || "Failed to update expense";
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
    return;
  }

  error.value = "";
  deleting.value = true;

  try {
    await $fetch(`/api/orgs/${orgId.value}/expenses/${expenseId}`, {
      method: "DELETE",
    });

    router.push("/dashboard/expenses");
  } catch (e: any) {
    error.value = e.data?.message || "Failed to delete expense";
  } finally {
    deleting.value = false;
  }
}
</script>
