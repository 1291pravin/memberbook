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
            <p class="text-xs text-slate-400">{{ sub.startDate }} &mdash; {{ sub.endDate }}</p>
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
            <AppButton
              v-if="sub.status === 'expired'"
              size="sm"
              variant="ghost"
              class="mt-1"
              @click="renewSubscription(sub)"
            >
              Renew
            </AppButton>
          </div>
        </div>
        <div v-if="subscriptions.length === 0" class="text-sm text-slate-500 py-2">No subscriptions</div>
      </div>
      <div class="mt-3">
        <AppButton size="sm" @click="showAssignModal = true">Assign Plan</AppButton>
      </div>
    </AppCard>

    <!-- Payments -->
    <AppCard title="Payments">
      <div class="space-y-3">
        <div v-for="payment in payments" :key="payment.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ formatCurrency(payment.amount) }}</p>
            <p class="text-xs text-slate-500">{{ payment.date }} &middot; {{ payment.method }}</p>
          </div>
          <p v-if="payment.notes" class="text-xs text-slate-500 max-w-[200px] truncate">{{ payment.notes }}</p>
        </div>
        <div v-if="payments.length === 0" class="text-sm text-slate-500 py-2">No payments recorded</div>
      </div>
      <div class="mt-3">
        <AppButton size="sm" @click="openPaymentModal">Record Payment</AppButton>
      </div>
    </AppCard>

    <!-- Assign Plan Modal -->
    <AppModal :open="showAssignModal" title="Assign Subscription" @close="showAssignModal = false">
      <form class="space-y-4" @submit.prevent="assignPlan">
        <AppSelect
          v-model="assignForm.planId"
          label="Plan"
          :options="planOptions"
          placeholder="Select a plan"
          required
        />
        <AppInput v-model="assignForm.startDate" label="Start Date" type="date" required />
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showAssignModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="assigning">Assign</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Record Payment Modal -->
    <AppModal :open="showPaymentModal" title="Record Payment" @close="showPaymentModal = false">
      <form class="space-y-4" @submit.prevent="recordPayment">
        <AppSelect
          v-if="unpaidSubscriptionOptions.length > 0"
          v-model="paymentForm.subscriptionId"
          label="For Subscription"
          :options="unpaidSubscriptionOptions"
          placeholder="Select subscription (optional)"
        />
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

const memberId = route.params.id;

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

const today = new Date().toISOString().split("T")[0];
const assignForm = reactive({ planId: "", startDate: today });
const paymentForm = reactive({ amount: "", date: today, method: "cash", notes: "", subscriptionId: "" });

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const { data: memberData, refresh: refreshMember } = await useFetch<{ member: MemberDetail; subscriptions: Subscription[]; payments: Payment[] }>(
  () => `/api/orgs/${orgId.value}/members/${memberId}`,
);
const member = computed(() => memberData.value?.member ?? null);
const subscriptions = computed(() => memberData.value?.subscriptions ?? []);
const payments = computed(() => memberData.value?.payments ?? []);

const { data: plansData } = await useFetch<{ plans: Plan[] }>(
  () => `/api/orgs/${orgId.value}/plans`,
);
const plans = computed(() => plansData.value?.plans ?? []);

const planOptions = computed(() =>
  plans.value.filter(p => p.active).map(p => ({ value: p.id, label: p.name })),
);

const unpaidSubscriptionOptions = computed(() =>
  subscriptions.value
    .filter(s => s.paymentStatus !== "paid")
    .map(s => ({
      value: s.id,
      label: `${s.planName} (${s.startDate} to ${s.endDate})`,
    })),
);

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

function renewSubscription(sub: Subscription) {
  assignForm.planId = String(sub.planId);
  assignForm.startDate = sub.endDate;
  showAssignModal.value = true;
}

async function toggleStatus() {
  if (!member.value) return;
  const newStatus = member.value.status === "active" ? "inactive" : "active";
  await $fetch(`/api/orgs/${orgId.value}/members/${memberId}`, {
    method: "PUT",
    body: { status: newStatus },
  });
  await refreshMember();
}

async function assignPlan() {
  assigning.value = true;
  await $fetch(`/api/orgs/${orgId.value}/members/${memberId}/subscriptions`, {
    method: "POST",
    body: { planId: Number(assignForm.planId), startDate: assignForm.startDate },
  });
  showAssignModal.value = false;
  assigning.value = false;
  await refreshMember();
}

async function recordPayment() {
  recordingPayment.value = true;
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
  recordingPayment.value = false;
  paymentForm.amount = "";
  paymentForm.notes = "";
  paymentForm.subscriptionId = "";
  await refreshMember();
}

function openPaymentModal() {
  const unpaid = subscriptions.value.filter(s => s.paymentStatus !== "paid");
  if (unpaid.length === 1) {
    paymentForm.subscriptionId = String(unpaid[0].id);
  } else {
    paymentForm.subscriptionId = "";
  }
  showPaymentModal.value = true;
}
</script>
