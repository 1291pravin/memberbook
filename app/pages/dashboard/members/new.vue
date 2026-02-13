<template>
  <div class="p-4 max-w-lg">
    <h1 class="text-xl font-bold text-slate-800 mb-6">{{ t.addMember }}</h1>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <AppInput v-model="form.name" label="Name" :placeholder="`${t.member} name`" required />
      <AppInput
        v-model="form.phone"
        label="Phone"
        type="tel"
        placeholder="+91 98765 43210"
        :error="phoneError"
        @blur="validatePhoneField"
      />
      <AppInput v-model="form.email" label="Email" type="email" placeholder="member@example.com" />
      <AppSelect
        v-model="form.gender"
        label="Gender (Optional)"
        :options="[
          { value: '', label: 'Prefer not to say' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]"
      />
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          placeholder="Optional notes"
        />
      </div>

      <!-- Optional Plan Selection -->
      <div class="border-t border-slate-200 pt-4">
        <h2 class="text-sm font-semibold text-slate-700 mb-3">Subscription (optional)</h2>
        <AppSelect
          v-model="form.planId"
          label="Plan"
          :options="planOptionsWithNone"
          placeholder="No plan"
        />
        <template v-if="form.planId">
          <AppInput v-model="form.startDate" label="Start Date" type="date" required class="mt-3" />

          <div class="mt-3 border-t border-slate-200 pt-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.recordPayment" type="checkbox" class="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <span class="text-sm font-medium text-slate-700">Record payment now</span>
            </label>
            <div v-if="form.recordPayment" class="mt-3 space-y-3 pl-6">
              <AppInput v-model="form.paymentAmount" label="Amount (Rupees)" type="number" required />
              <AppSelect
                v-model="form.paymentMethod"
                label="Payment Method"
                :options="paymentMethods"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="flex gap-2">
        <AppButton type="submit" :loading="saving">{{ t.addMember }}</AppButton>
        <AppButton variant="secondary" @click="$router.back()">Cancel</AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { validatePhone, normalizePhone } from "~~/shared/utils/phone";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const { parseCurrencyToInt } = useFormatCurrency();
const t = useTerminology();
const router = useRouter();

const form = reactive({
  name: "",
  phone: "",
  email: "",
  gender: "",
  notes: "",
  planId: "",
  startDate: new Date().toISOString().split("T")[0],
  recordPayment: false,
  paymentAmount: "",
  paymentMethod: "cash",
});
const error = ref("");
const phoneError = ref("");
const saving = ref(false);

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

// Fetch plans
interface Plan {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

const { data: plansData } = await useFetch<{ plans: Plan[] }>(
  `/api/orgs/${orgId.value}/plans`,
);
const plans = computed(() => plansData.value?.plans ?? []);

const planOptionsWithNone = computed(() => [
  { value: "", label: "No plan" },
  ...plans.value.filter(p => p.active).map(p => ({ value: p.id, label: p.name })),
]);

// Auto-populate payment amount when plan changes
watch(() => form.planId, (planId) => {
  const plan = plans.value.find(p => p.id === Number(planId));
  if (plan) {
    form.paymentAmount = String(plan.price / 100);
  }
});

function validatePhoneField() {
  phoneError.value = validatePhone(form.phone) || "";
}

async function handleSubmit() {
  // Validate phone before submit
  const phoneErr = validatePhone(form.phone);
  if (phoneErr) {
    phoneError.value = phoneErr;
    return;
  }
  phoneError.value = "";

  error.value = "";
  saving.value = true;
  try {
    const body: Record<string, unknown> = {
      name: form.name,
      phone: form.phone ? normalizePhone(form.phone) : "",
      email: form.email,
      gender: form.gender || null,
      notes: form.notes,
    };

    // Include plan data if selected
    if (form.planId) {
      body.planId = Number(form.planId);
      body.startDate = form.startDate;
      if (form.recordPayment && form.paymentAmount) {
        body.payment = {
          amount: parseCurrencyToInt(Number(form.paymentAmount)),
          date: form.startDate,
          method: form.paymentMethod,
        };
      }
    }

    const data = await $fetch<{ member: { id: number } }>(`/api/orgs/${orgId.value}/members`, {
      method: "POST",
      body,
    });
    router.push(`/dashboard/members/${data.member.id}`);
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to add member";
  } finally {
    saving.value = false;
  }
}
</script>
