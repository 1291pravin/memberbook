<template>
  <div class="p-4 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Subscription Plans</h1>
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
            <h3 class="font-semibold text-slate-800">{{ plan.name }}</h3>
            <p class="text-2xl font-bold text-primary-600 mt-1">{{ formatCurrency(plan.price) }}</p>
            <p class="text-sm text-slate-500 mt-1">{{ formatDuration(plan.durationType, plan.durationValue) }}</p>
          </div>
          <AppBadge :color="plan.active ? 'green' : 'gray'">
            {{ plan.active ? "Active" : "Inactive" }}
          </AppBadge>
        </div>
        <NuxtLink
          :to="`/dashboard/members?planId=${plan.id}`"
          class="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          <span>{{ plan.memberCount }} {{ plan.memberCount === 1 ? t.memberLower : t.membersLower }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
          </svg>
        </NuxtLink>
        <div class="mt-2 flex gap-2">
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
        <div class="grid grid-cols-2 gap-3">
          <AppInput v-model="form.durationValue" label="Duration" type="number" placeholder="1" min="1" required />
          <AppSelect
            v-model="form.durationType"
            label="Period"
            :options="durationTypeOptions"
            required
          />
        </div>
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
const t = useTerminology();

interface Plan {
  id: number;
  name: string;
  price: number;
  durationType: string;
  durationValue: number;
  active: boolean;
  memberCount: number;
}

const durationTypeOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const showForm = ref(false);
const saving = ref(false);
const editingPlan = ref<Plan | null>(null);
const form = reactive({ name: "", price: "", durationValue: "1", durationType: "monthly" });

const { data: plansData, refresh: refreshPlans, status: plansStatus } = await useFetch<{ plans: Plan[] }>(
  `/api/orgs/${orgId.value}/plans`,
);
const plans = computed(() => plansData.value?.plans ?? []);
const loading = computed(() => plansStatus.value === "pending");

function formatDuration(durationType: string, durationValue: number): string {
  const labels: Record<string, [string, string]> = {
    daily: ["Day", "Days"],
    weekly: ["Week", "Weeks"],
    monthly: ["Month", "Months"],
    yearly: ["Year", "Years"],
  };
  const [singular, plural] = labels[durationType] ?? ["Unit", "Units"];
  return `${durationValue} ${durationValue === 1 ? singular : plural}`;
}

function editPlan(plan: Plan) {
  editingPlan.value = plan;
  form.name = plan.name;
  form.price = String(plan.price / 100);
  form.durationValue = String(plan.durationValue);
  form.durationType = plan.durationType;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingPlan.value = null;
  form.name = "";
  form.price = "";
  form.durationValue = "1";
  form.durationType = "monthly";
}

async function savePlan() {
  saving.value = true;
  const payload = {
    name: form.name,
    price: parseCurrencyToInt(Number(form.price)),
    durationType: form.durationType,
    durationValue: Number(form.durationValue),
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
