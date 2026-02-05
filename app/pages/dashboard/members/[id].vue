<template>
  <div class="p-4 space-y-6 max-w-2xl">
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink to="/dashboard/members" class="text-sm text-primary-600 hover:text-primary-500">&larr; Members</NuxtLink>
        <h1 class="text-xl font-bold text-slate-800 mt-1">{{ member?.name }}</h1>
      </div>
      <AppBadge v-if="member" :color="member.status === 'active' ? 'green' : 'gray'">
        {{ member.status }}
      </AppBadge>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-sm text-red-700">{{ errorMessage }}</p>
      <button class="text-red-500 hover:text-red-700 text-sm font-medium" @click="errorMessage = ''">Dismiss</button>
    </div>

    <!-- Member Info -->
    <AppCard v-if="member" title="Contact">
      <div class="space-y-2 text-sm">
        <p v-if="member.phone"><span class="text-slate-500">Phone:</span> {{ member.phone }}</p>
        <p v-if="member.email"><span class="text-slate-500">Email:</span> {{ member.email }}</p>
        <p v-if="member.notes"><span class="text-slate-500">Notes:</span> {{ member.notes }}</p>
      </div>
      <div class="mt-3 flex gap-2">
        <AppButton size="sm" variant="ghost" @click="toggleStatus">
          {{ member.status === "active" ? "Mark Inactive" : "Mark Active" }}
        </AppButton>
      </div>
    </AppCard>

    <!-- Subscriptions -->
    <AppCard title="Subscriptions">
      <div class="space-y-3">
        <div v-for="sub in subscriptions" :key="sub.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="font-medium text-slate-800 text-sm">{{ sub.planName }}</p>
            <p class="text-sm text-slate-600">{{ formatDuration(sub.durationType, sub.durationValue) }}</p>
            <p class="text-xs text-slate-400">{{ formatDate(sub.startDate) }} &mdash; {{ formatDate(sub.endDate) }}</p>
          </div>
          <div class="text-right space-y-1">
            <p class="text-sm font-semibold">{{ formatCurrency(sub.amount) }}</p>
            <div class="flex items-center gap-1 justify-end">
              <AppBadge :color="sub.status === 'active' ? 'green' : 'gray'" class="text-xs">
                {{ sub.status }}
              </AppBadge>
              <AppBadge :color="paymentStatusColor(sub.paymentStatus)" class="text-xs">
                {{ paymentStatusLabel(sub.paymentStatus) }}
              </AppBadge>
            </div>
            <p v-if="sub.totalPaid > 0 && sub.paymentStatus !== 'paid'" class="text-xs text-slate-500">
              Paid: {{ formatCurrency(sub.totalPaid) }} / {{ formatCurrency(sub.amount) }}
            </p>
            <div class="flex items-center gap-1 justify-end mt-1">
              <AppButton
                v-if="sub.paymentStatus === 'partial'"
                size="sm"
                variant="ghost"
                @click="openInlinePayment(sub)"
              >
                Pay Remaining ({{ formatCurrency(sub.amount - sub.totalPaid) }})
              </AppButton>
              <AppButton
                v-if="sub.paymentStatus === 'unpaid'"
                size="sm"
                variant="ghost"
                @click="openInlinePayment(sub)"
              >
                Record Payment
              </AppButton>
              <AppButton
                v-if="sub.id === latestSubscriptionId"
                size="sm"
                variant="ghost"
                @click="renewSubscription(sub)"
              >
                Renew
              </AppButton>
            </div>
          </div>
        </div>
        <div v-if="subscriptions.length === 0" class="text-sm text-slate-500 py-2">No subscriptions</div>
      </div>
      <div class="mt-3">
        <AppButton v-if="hasActiveSubscription" size="sm" variant="secondary" @click="openChangePlan">Change Plan</AppButton>
        <AppButton v-else size="sm" @click="openAssignPlan">Assign Plan</AppButton>
      </div>
    </AppCard>

    <!-- Payments -->
    <AppCard title="Payments">
      <div class="space-y-3">
        <div v-for="payment in payments" :key="payment.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ formatCurrency(payment.amount) }}</p>
            <p class="text-xs text-slate-500">{{ formatDate(payment.date) }} &middot; {{ payment.method }}</p>
          </div>
          <p v-if="payment.notes" class="text-xs text-slate-500 max-w-[200px] truncate">{{ payment.notes }}</p>
        </div>
        <div v-if="payments.length === 0" class="text-sm text-slate-500 py-2">No payments recorded</div>
      </div>
    </AppCard>

    <!-- Assign Plan Modal -->
    <AppModal :open="showAssignModal" :title="isChangingPlan ? 'Change Plan' : 'Assign Subscription'" @close="showAssignModal = false">
      <form class="space-y-4" @submit.prevent="assignPlan">
        <p v-if="isChangingPlan" class="text-sm text-slate-600">
          The current active plan will be cancelled and replaced with the new one.
        </p>
        <AppSelect
          v-model="assignForm.planId"
          label="Plan"
          :options="planOptions"
          placeholder="Select a plan"
          required
        />
        <AppInput v-model="assignForm.startDate" label="Start Date" type="date" required />

        <!-- Inline Payment -->
        <div class="border-t border-slate-200 pt-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="assignForm.recordPayment" type="checkbox" class="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span class="text-sm font-medium text-slate-700">Record payment now</span>
          </label>
          <div v-if="assignForm.recordPayment" class="mt-3 space-y-3 pl-6">
            <AppInput v-model="assignForm.paymentAmount" label="Amount (Rupees)" type="number" required />
            <AppSelect
              v-model="assignForm.paymentMethod"
              label="Payment Method"
              :options="paymentMethods"
            />
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showAssignModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="assigning">{{ isChangingPlan ? 'Change' : 'Assign' }}</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Record Payment Modal -->
    <AppModal :open="showPaymentModal" title="Record Payment" @close="showPaymentModal = false">
      <form class="space-y-4" @submit.prevent="recordPayment">
        <AppInput v-model="paymentForm.amount" label="Amount (Rupees)" type="number" required />
        <AppInput v-model="paymentForm.date" label="Date" type="date" required />
        <AppSelect
          v-model="paymentForm.method"
          label="Payment Method"
          :options="paymentMethods"
        />
        <AppInput v-model="paymentForm.notes" label="Notes" placeholder="Optional" />
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showPaymentModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="recordingPayment">Save</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const route = useRoute();
const { orgId } = useOrg();
const { formatCurrency, parseCurrencyToInt } = useFormatCurrency();
const { formatDate } = useFormatDate();

const memberId = route.params.id;
const cacheVersion = ref(Date.now());

interface MemberDetail {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
}

interface Subscription {
  id: number;
  planId: number;
  planName: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
  autoRenew: boolean;
  paymentStatus: string;
  durationType: string;
  durationValue: number;
  totalPaid: number;
}

interface Payment {
  id: number;
  amount: number;
  date: string;
  method: string;
  notes: string | null;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

const showAssignModal = ref(false);
const showPaymentModal = ref(false);
const assigning = ref(false);
const recordingPayment = ref(false);
const isChangingPlan = ref(false);
const errorMessage = ref("");

const today = new Date().toISOString().split("T")[0];
const assignForm = reactive({ planId: "", startDate: today, recordPayment: false, paymentAmount: "", paymentMethod: "cash" });
const paymentForm = reactive({ amount: "", date: today, method: "cash", notes: "", subscriptionId: "" });

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const { data: memberData, refresh: refreshMember } = await useFetch<{ member: MemberDetail; subscriptions: Subscription[]; payments: Payment[] }>(
  `/api/orgs/${orgId.value}/members/${memberId}`,
  { query: { _v: cacheVersion } },
);
const member = computed(() => memberData.value?.member ?? null);
const subscriptions = computed(() => memberData.value?.subscriptions ?? []);
const latestSubscriptionId = computed(() => {
  const subs = subscriptions.value;
  if (subs.length === 0) return null;
  return subs.reduce((latest, sub) =>
    sub.endDate > latest.endDate ? sub : latest,
  ).id;
});
const hasActiveSubscription = computed(() =>
  subscriptions.value.some(s => s.status === "active" && s.endDate >= today),
);
const payments = computed(() => memberData.value?.payments ?? []);

const { data: plansData } = await useFetch<{ plans: Plan[] }>(
  `/api/orgs/${orgId.value}/plans`,
);
const plans = computed(() => plansData.value?.plans ?? []);

const planOptions = computed(() =>
  plans.value.filter(p => p.active).map(p => ({ value: p.id, label: p.name })),
);

watch(() => assignForm.planId, (planId) => {
  const plan = plans.value.find(p => p.id === Number(planId));
  if (plan) {
    assignForm.paymentAmount = String(plan.price / 100);
  }
});

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

function paymentStatusColor(status: string): string {
  if (status === "paid") return "green";
  if (status === "partial") return "yellow";
  return "red";
}

function paymentStatusLabel(status: string): string {
  if (status === "paid") return "Paid";
  if (status === "partial") return "Partial";
  return "Unpaid";
}

function resetPaymentFields() {
  assignForm.recordPayment = false;
  assignForm.paymentAmount = "";
  assignForm.paymentMethod = "cash";
}

function renewSubscription(sub: Subscription) {
  // Reset planId first so the watcher fires even for the same plan
  assignForm.planId = "";
  nextTick(() => {
    assignForm.planId = String(sub.planId);
  });
  // Start the new subscription on the end date of the current one
  assignForm.startDate = sub.endDate;
  isChangingPlan.value = false;
  resetPaymentFields();
  // Explicitly set payment amount for the renewed plan
  const plan = plans.value.find(p => p.id === sub.planId);
  if (plan) {
    assignForm.paymentAmount = String(plan.price / 100);
  }
  showAssignModal.value = true;
}

function openAssignPlan() {
  assignForm.planId = "";
  assignForm.startDate = today;
  isChangingPlan.value = false;
  resetPaymentFields();
  showAssignModal.value = true;
}

function openChangePlan() {
  assignForm.planId = "";
  assignForm.startDate = today;
  isChangingPlan.value = true;
  resetPaymentFields();
  showAssignModal.value = true;
}

async function toggleStatus() {
  if (!member.value) return;
  try {
    errorMessage.value = "";
    const newStatus = member.value.status === "active" ? "inactive" : "active";
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}`, {
      method: "PUT",
      body: { status: newStatus },
    });
    cacheVersion.value = Date.now();
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to update status";
  }
}

async function assignPlan() {
  assigning.value = true;
  errorMessage.value = "";
  try {
    const body: Record<string, unknown> = {
      planId: Number(assignForm.planId),
      startDate: assignForm.startDate,
      changePlan: isChangingPlan.value,
    };
    if (assignForm.recordPayment && assignForm.paymentAmount) {
      body.payment = {
        amount: parseCurrencyToInt(Number(assignForm.paymentAmount)),
        date: assignForm.startDate,
        method: assignForm.paymentMethod,
      };
    }
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}/subscriptions`, {
      method: "POST",
      body,
    });
    showAssignModal.value = false;
    isChangingPlan.value = false;
    assignForm.planId = "";
    assignForm.startDate = today;
    assignForm.recordPayment = false;
    assignForm.paymentAmount = "";
    assignForm.paymentMethod = "cash";
    cacheVersion.value = Date.now();
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to assign plan";
  } finally {
    assigning.value = false;
  }
}

async function recordPayment() {
  recordingPayment.value = true;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/payments`, {
      method: "POST",
      body: {
        memberId: Number(memberId),
        amount: parseCurrencyToInt(Number(paymentForm.amount)),
        date: paymentForm.date,
        method: paymentForm.method,
        notes: paymentForm.notes || null,
        subscriptionId: paymentForm.subscriptionId ? Number(paymentForm.subscriptionId) : null,
      },
    });
    showPaymentModal.value = false;
    paymentForm.amount = "";
    paymentForm.notes = "";
    paymentForm.subscriptionId = "";
    cacheVersion.value = Date.now();
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to record payment";
  } finally {
    recordingPayment.value = false;
  }
}

function openInlinePayment(sub: Subscription) {
  paymentForm.subscriptionId = String(sub.id);
  const remainingPaise = sub.amount - sub.totalPaid;
  paymentForm.amount = String(remainingPaise / 100);
  paymentForm.date = today;
  paymentForm.method = "cash";
  paymentForm.notes = "";
  showPaymentModal.value = true;
}
</script>
