<template>
  <div class="p-4 max-w-lg">
    <h1 class="text-xl font-bold text-slate-800 mb-6">Add Expense</h1>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
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
          class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder="Additional details"
        />
      </div>

      <div class="flex gap-2">
        <AppButton type="submit" :loading="saving">Add Expense</AppButton>
        <AppButton variant="secondary" @click="$router.back()">Cancel</AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const router = useRouter();

interface Category {
  id: number;
  name: string;
  isActive: boolean;
}

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

const form = ref({
  categoryId: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  paymentMethod: "cash",
  vendorName: "",
  notes: "",
});

const error = ref("");
const saving = ref(false);

async function handleSubmit() {
  error.value = "";
  saving.value = true;

  try {
    const amountInPaise = Math.round(parseFloat(form.value.amount) * 100);

    await $fetch(`/api/orgs/${orgId.value}/expenses`, {
      method: "POST",
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
    error.value = e.data?.message || "Failed to add expense";
  } finally {
    saving.value = false;
  }
}
</script>
