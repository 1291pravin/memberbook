<template>
  <div class="p-4 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Subscription Plans</h1>
      <AppButton @click="showForm = true">Add Plan</AppButton>
    </div>

    <div v-if="plans.length === 0 && !loading">
      <AppEmptyState title="No plans yet" description="Create your first subscription plan to get started.">
        <template #action>
          <AppButton @click="showForm = true">Create Plan</AppButton>
        </template>
      </AppEmptyState>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AppCard v-for="plan in plans" :key="plan.id">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">{{ plan.name }}</h3>
            <p class="text-2xl font-bold text-primary-600 mt-1">{{ formatCurrency(plan.price) }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ plan.durationDays }} days</p>
          </div>
          <AppBadge :color="plan.active ? 'green' : 'gray'">
            {{ plan.active ? "Active" : "Inactive" }}
          </AppBadge>
        </div>
        <div class="mt-3 flex gap-2">
          <AppButton size="sm" variant="ghost" @click="editPlan(plan)">Edit</AppButton>
          <AppButton
            size="sm"
            variant="ghost"
            @click="toggleActive(plan)"
          >
            {{ plan.active ? "Deactivate" : "Activate" }}
          </AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Add/Edit Plan Modal -->
    <AppModal :open="showForm" :title="editingPlan ? 'Edit Plan' : 'New Plan'" @close="closeForm">
      <form class="space-y-4" @submit.prevent="savePlan">
        <AppInput v-model="form.name" label="Plan Name" placeholder="e.g. Monthly" required />
        <AppInput v-model="form.price" label="Price (in Rupees)" type="number" placeholder="500" required />
        <AppInput v-model="form.durationDays" label="Duration (days)" type="number" placeholder="30" required />
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="closeForm">Cancel</AppButton>
          <AppButton type="submit" :loading="saving">Save</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency, parseCurrencyToInt } = useFormatCurrency();
const { orgId } = useOrg();

interface Plan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  active: boolean;
}

const showForm = ref(false);
const saving = ref(false);
const editingPlan = ref<Plan | null>(null);
const form = reactive({ name: "", price: "", durationDays: "" });

const { data: plansData, refresh: refreshPlans, status: plansStatus } = await useFetch<{ plans: Plan[] }>(
  () => `/api/orgs/${orgId.value}/plans`,
);
const plans = computed(() => plansData.value?.plans ?? []);
const loading = computed(() => plansStatus.value === "pending");

function editPlan(plan: Plan) {
  editingPlan.value = plan;
  form.name = plan.name;
  form.price = String(plan.price / 100);
  form.durationDays = String(plan.durationDays);
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingPlan.value = null;
  form.name = "";
  form.price = "";
  form.durationDays = "";
}

async function savePlan() {
  saving.value = true;
  const payload = {
    name: form.name,
    price: parseCurrencyToInt(Number(form.price)),
    durationDays: Number(form.durationDays),
  };

  if (editingPlan.value) {
    await $fetch(`/api/orgs/${orgId.value}/plans/${editingPlan.value.id}`, {
      method: "PUT",
      body: payload,
    });
  } else {
    await $fetch(`/api/orgs/${orgId.value}/plans`, {
      method: "POST",
      body: payload,
    });
  }

  await refreshPlans();
  closeForm();
  saving.value = false;
}

async function toggleActive(plan: Plan) {
  await $fetch(`/api/orgs/${orgId.value}/plans/${plan.id}`, {
    method: "PUT",
    body: { active: !plan.active },
  });
  await refreshPlans();
}
</script>
