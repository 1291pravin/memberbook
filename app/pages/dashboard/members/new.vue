<template>
  <div class="p-4 max-w-lg">
    <!-- First Member Celebration -->
    <div v-if="showCelebration" class="text-center py-8 space-y-6">
      <div class="text-6xl">🎉</div>
      <div>
        <h2 class="text-2xl font-bold text-slate-800">{{ t.member }} Added!</h2>
        <p class="text-slate-600 mt-2">Great start! You're on your way to managing your {{ t.members.toLowerCase() }} like a pro.</p>
      </div>

      <!-- Show Value: concrete benefit preview -->
      <div v-if="celebrationPlanName && celebrationEndDate" class="bg-primary-50 border border-primary-200 rounded-lg p-4 max-w-sm mx-auto text-left">
        <p class="text-sm text-primary-800">
          MemberBook will remind you when {{ celebrationMemberName }}'s membership expires on <strong>{{ celebrationEndDate }}</strong>. No more missed renewals.
        </p>
      </div>

      <!-- Activation Loop: prompt to add more -->
      <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-sm mx-auto">
        <p class="text-sm text-slate-700 font-medium">1 of your {{ t.members.toLowerCase() }} added.</p>
        <p class="text-xs text-slate-600 mt-1">Most {{ currentOrg?.type === 'library' ? 'libraries' : currentOrg?.type === 'tuition' ? 'coaching centers' : 'gyms' }} add 20+ in their first session.</p>
      </div>

      <div class="space-y-3 max-w-xs mx-auto">
        <AppButton class="w-full" @click="resetForm">Add {{ t.member }} #2</AppButton>
        <NuxtLink :to="`/dashboard/members/${newMemberId}`">
          <AppButton variant="secondary" class="w-full">View {{ t.member }} &amp; Record Payment</AppButton>
        </NuxtLink>
        <NuxtLink to="/dashboard">
          <AppButton variant="ghost" class="w-full">Go to Dashboard</AppButton>
        </NuxtLink>
      </div>
    </div>

    <template v-else>
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
      <!-- More Details (optional fields) -->
      <button
        type="button"
        class="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        @click="showMoreDetails = !showMoreDetails"
      >
        <svg
          class="h-4 w-4 transition-transform"
          :class="{ 'rotate-90': showMoreDetails }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        More Details
      </button>

      <template v-if="showMoreDetails">
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
        <AppInput v-model="form.fatherName" label="Father's Name" placeholder="Optional" />
        <AppInput v-model="form.address" label="Address" placeholder="Optional" />
        <div>
          <div class="flex items-center">
            <label class="block text-sm font-medium text-slate-700">Batch / Timing</label>
            <AppHelpIcon>
              The time slot or batch this member attends. Useful for gyms with morning/evening batches or tuition centers with specific class timings.
            </AppHelpIcon>
          </div>
          <AppInput v-model="form.batch" placeholder="e.g., Morning, Afternoon, Evening" class="mt-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="Optional notes"
          />
        </div>
      </template>

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
    </template>
  </div>
</template>

<script setup lang="ts">
import { validatePhone, normalizePhone } from "~~/shared/utils/phone";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId, currentOrg } = useOrg();
const { parseCurrencyToInt } = useFormatCurrency();
const t = useTerminology();
const router = useRouter();
const route = useRoute();

const form = reactive({
  name: "",
  phone: "",
  email: "",
  gender: "",
  fatherName: "",
  address: "",
  batch: "",
  notes: "",
  planId: "",
  startDate: new Date().toISOString().split("T")[0],
  recordPayment: false,
  paymentAmount: "",
  paymentMethod: "cash",
});
const showMoreDetails = ref(false);
const showCelebration = ref(false);
const newMemberId = ref<number | null>(null);
const celebrationMemberName = ref("");
const celebrationPlanName = ref("");
const celebrationEndDate = ref("");
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
    form.recordPayment = true;
  }
  else {
    form.recordPayment = false;
  }
});

function resetForm() {
  form.name = "";
  form.phone = "";
  form.email = "";
  form.gender = "";
  form.fatherName = "";
  form.address = "";
  form.batch = "";
  form.notes = "";
  form.planId = "";
  form.startDate = new Date().toISOString().split("T")[0];
  form.recordPayment = false;
  form.paymentAmount = "";
  form.paymentMethod = "cash";
  showMoreDetails.value = false;
  showCelebration.value = false;
  newMemberId.value = null;
  celebrationMemberName.value = "";
  celebrationPlanName.value = "";
  celebrationEndDate.value = "";
  error.value = "";
  phoneError.value = "";
}

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
      fatherName: form.fatherName || null,
      address: form.address || null,
      batch: form.batch || null,
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

    const data = await $fetch<{ member: { id: number }; totalMembers?: number; subscription?: { planName: string; endDate: string } | null }>(`/api/orgs/${orgId.value}/members`, {
      method: "POST",
      body,
    });

    // Show celebration for the first member
    const isFirst = data.totalMembers === 1 || route.query.first === '1';
    if (isFirst) {
      newMemberId.value = data.member.id;
      celebrationMemberName.value = form.name;
      if (data.subscription) {
        celebrationPlanName.value = data.subscription.planName;
        celebrationEndDate.value = new Date(data.subscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      }
      showCelebration.value = true;
    } else {
      router.push(`/dashboard/members/${data.member.id}`);
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to add member";
  } finally {
    saving.value = false;
  }
}
</script>
