<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Payments</h1>
      <div class="flex gap-2">
        <AppButton @click="showRecordModal = true">Record Payment</AppButton>
        <AppButton variant="secondary" @click="exportPayments">Export</AppButton>
        <NuxtLink to="/dashboard/payments/pending">
          <AppButton variant="secondary">Pending</AppButton>
        </NuxtLink>
      </div>
    </div>

    <div v-if="pageError" class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-sm text-red-700">{{ pageError }}</p>
      <button type="button" class="text-sm font-medium text-red-700 hover:text-red-800" @click="pageError = ''">Dismiss</button>
    </div>

    <div v-if="payments.length === 0">
      <AppEmptyState title="No payments recorded" description="Payments will appear here when you record them from a member's page." />
    </div>

    <div v-else class="space-y-2">
      <AppCard v-for="p in payments" :key="p.id">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-800 text-sm">{{ p.memberName }}</p>
            <p class="text-xs text-slate-600">{{ formatDate(p.date) }} &middot; {{ p.method }}</p>
            <p v-if="p.notes" class="text-xs text-slate-600 mt-1">{{ p.notes }}</p>
          </div>
          <div class="flex items-center gap-1">
            <p class="font-semibold text-slate-800">{{ formatCurrency(p.amount) }}</p>
            <AppButton v-if="isOwner" size="sm" variant="ghost" @click="openEditPayment(p)">Edit</AppButton>
            <AppButton v-if="isOwner" size="sm" variant="danger" :loading="deletingPaymentId === p.id" @click="deletePayment(p)">Delete</AppButton>
          </div>
        </div>
      </AppCard>
    </div>

    <AppPagination
      :page="pagination.page.value"
      :total-pages="pagination.totalPages.value"
      :total="pagination.total.value"
      :limit="pagination.limit"
      @update:page="pagination.goToPage"
    />

    <!-- Record Payment Modal -->
    <AppModal :open="showRecordModal" title="Record Payment" @close="showRecordModal = false">
      <form class="space-y-4" @submit.prevent="submitPayment">
        <!-- Member Search -->
        <div class="relative">
          <AppInput
            v-model="memberSearch"
            label="Member"
            placeholder="Search by name or phone..."
            @input="debouncedMemberSearch"
          />
          <div
            v-if="memberResults.length > 0 && memberSearch.trim()"
            class="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            <button
              v-for="m in memberResults"
              :key="m.id"
              type="button"
              class="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors"
              @click="selectPaymentMember(m)"
            >
              <span class="font-medium text-slate-800">{{ m.name }}</span>
              <span v-if="m.phone" class="text-slate-600 ml-2">{{ m.phone }}</span>
            </button>
          </div>
        </div>
        <div v-if="selectedMember" class="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2">
          <span class="text-sm text-primary-700 font-medium">{{ selectedMember.name }}</span>
          <button type="button" class="text-primary-500 hover:text-primary-700 text-xs" @click="clearPaymentMember">&times;</button>
        </div>

        <AppInput v-model="paymentForm.amount" label="Amount (Rupees)" type="number" required />
        <AppInput v-model="paymentForm.date" label="Date" type="date" required />
        <AppSelect
          v-model="paymentForm.method"
          label="Payment Method"
          :options="[
            { value: 'cash', label: 'Cash' },
            { value: 'upi', label: 'UPI' },
            { value: 'card', label: 'Card' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
          ]"
        />
        <AppInput v-model="paymentForm.notes" label="Notes" placeholder="Optional" />

        <div v-if="paymentError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ paymentError }}</p>
        </div>

        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showRecordModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="submittingPayment" :disabled="!selectedMember">Save</AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal :open="showEditModal" title="Edit Payment" @close="showEditModal = false">
      <form class="space-y-4" @submit.prevent="savePaymentEdit">
        <p class="text-sm text-slate-600">Payment for <strong class="text-slate-800">{{ editingPayment?.memberName }}</strong></p>
        <AppInput v-model="editForm.amount" label="Amount (Rupees)" type="number" required />
        <AppInput v-model="editForm.date" label="Date" type="date" required />
        <AppSelect v-model="editForm.method" label="Payment Method" :options="paymentMethodOptions" />
        <AppInput v-model="editForm.notes" label="Notes" placeholder="Optional" />
        <div v-if="editError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2"><p class="text-sm text-red-700">{{ editError }}</p></div>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showEditModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="savingEdit">Save Changes</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId, currentOrg } = useOrg();
const isOwner = computed(() => currentOrg.value?.role === "owner");
const { formatCurrency } = useFormatCurrency();
const { formatDate } = useFormatDate();

function exportPayments() {
  window.location.href = `/api/orgs/${orgId.value}/payments/export`;
}

interface PaymentRow {
  id: number;
  amount: number;
  date: string;
  method: string;
  notes: string | null;
  memberName: string;
  memberId: number;
  subscriptionId: number | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const pagination = usePagination(30);

const query = computed(() => {
  return { page: pagination._page.value };
});

const { data: paymentsData, refresh: refreshPayments } = await useFetch<{ payments: PaymentRow[]; pagination: PaginationMeta }>(
  `/api/orgs/${orgId.value}/payments`,
  { query },
);
const payments = computed(() => paymentsData.value?.payments ?? []);

watch(paymentsData, (val) => {
  pagination.updateFromResponse(val?.pagination);
}, { immediate: true });

// Record Payment Modal
const showRecordModal = ref(false);
const memberSearch = ref("");
const memberResults = ref<{ id: number; name: string; phone: string | null }[]>([]);
const selectedMember = ref<{ id: number; name: string } | null>(null);
const submittingPayment = ref(false);
const paymentError = ref("");
const pageError = ref("");
const showEditModal = ref(false);
const editingPayment = ref<PaymentRow | null>(null);
const savingEdit = ref(false);
const deletingPaymentId = ref<number | null>(null);
const editError = ref("");

const today = new Date().toISOString().split("T")[0];
const paymentForm = reactive({
  amount: "",
  date: today,
  method: "cash",
  notes: "",
});
const editForm = reactive({ amount: "", date: today, method: "cash", notes: "" });
const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedMemberSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const q = memberSearch.value.trim();
    if (q.length < 2) { memberResults.value = []; return; }
    try {
      const data = await $fetch<{ members: { id: number; name: string; phone: string | null }[] }>(
        `/api/orgs/${orgId.value}/members`,
        { query: { search: q, status: "active", limit: 10 } },
      );
      memberResults.value = data.members;
    } catch {
      memberResults.value = [];
    }
  }, 300);
}

function selectPaymentMember(m: { id: number; name: string }) {
  selectedMember.value = m;
  memberSearch.value = "";
  memberResults.value = [];
}

function clearPaymentMember() {
  selectedMember.value = null;
}

const { parseCurrencyToInt } = useFormatCurrency();

async function submitPayment() {
  if (!selectedMember.value) return;
  submittingPayment.value = true;
  paymentError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/payments`, {
      method: "POST",
      body: {
        memberId: selectedMember.value.id,
        amount: parseCurrencyToInt(Number(paymentForm.amount)),
        date: paymentForm.date,
        method: paymentForm.method,
        notes: paymentForm.notes || null,
      },
    });
    showRecordModal.value = false;
    selectedMember.value = null;
    paymentForm.amount = "";
    paymentForm.date = new Date().toISOString().split("T")[0];
    paymentForm.method = "cash";
    paymentForm.notes = "";
    // Refresh payments list
    await refreshNuxtData();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    paymentError.value = e.data?.statusMessage || e.message || "Failed to record payment";
  } finally {
    submittingPayment.value = false;
  }
}
function openEditPayment(payment: PaymentRow) {
  editingPayment.value = payment;
  editForm.amount = String(payment.amount / 100);
  editForm.date = payment.date;
  editForm.method = payment.method;
  editForm.notes = payment.notes || "";
  editError.value = "";
  showEditModal.value = true;
}

async function savePaymentEdit() {
  if (!editingPayment.value) return;
  savingEdit.value = true;
  editError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/payments/${editingPayment.value.id}`, {
      method: "PUT",
      body: {
        amount: parseCurrencyToInt(Number(editForm.amount)),
        date: editForm.date,
        method: editForm.method,
        notes: editForm.notes || null,
      },
    });
    showEditModal.value = false;
    await refreshPayments();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    editError.value = e.data?.statusMessage || e.message || "Failed to update payment";
  } finally {
    savingEdit.value = false;
  }
}

async function deletePayment(payment: PaymentRow) {
  if (!confirm(`Delete the ${formatCurrency(payment.amount)} payment for ${payment.memberName}? This cannot be undone.`)) return;
  deletingPaymentId.value = payment.id;
  pageError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/payments/${payment.id}`, { method: "DELETE" });
    await refreshPayments();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    pageError.value = e.data?.statusMessage || e.message || "Failed to delete payment";
  } finally {
    deletingPaymentId.value = null;
  }
}

</script>
