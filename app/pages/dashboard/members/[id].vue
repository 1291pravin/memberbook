<template>
  <div class="p-4 space-y-6 max-w-2xl">
    <div>
      <NuxtLink to="/dashboard/members" class="text-sm text-primary-600 hover:text-primary-500">&larr; {{ t.members }}</NuxtLink>
      <div class="flex items-start justify-between mt-1 gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <!-- Photo / avatar -->
          <div class="relative shrink-0">
            <button
              type="button"
              class="h-16 w-16 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-lg font-semibold text-slate-500 hover:ring-primary-300 transition"
              :title="hasPhoto ? 'Change photo' : 'Add photo'"
              @click="triggerPhotoPicker"
            >
              <img v-if="hasPhoto" :src="photoUrl" alt="Member photo" class="h-full w-full object-cover">
              <span v-else>{{ initials }}</span>
              <span v-if="uploadingPhoto" class="absolute inset-0 flex items-center justify-center bg-white/70">
                <svg class="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              </span>
            </button>
            <input
              ref="photoInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onPhotoSelected"
            >
          </div>
          <div class="min-w-0">
            <h1 class="text-xl font-bold leading-tight text-slate-800 break-words line-clamp-2">{{ member?.name }}</h1>
            <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <AppBadge v-if="member" :color="member.status === 'active' ? 'green' : 'gray'">
                {{ member.status }}
              </AppBadge>
              <button
                v-if="hasPhoto"
                type="button"
                class="text-xs text-slate-600 hover:text-red-600"
                :disabled="uploadingPhoto"
                @click="removePhoto"
              >
                Remove photo
              </button>
              <button
                v-else
                type="button"
                class="text-xs font-medium text-primary-700 hover:text-primary-600"
                :disabled="uploadingPhoto"
                @click="triggerPhotoPicker"
              >
                Add photo
              </button>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-0.5 shrink-0">
          <AppAction v-if="member" icon="edit" tone="slate" @click="openEditMember">Edit</AppAction>
          <AppMoreMenu
            v-if="member"
            label="More actions for this member"
            :items="[
              { key: 'status', label: member.status === 'active' ? 'Mark inactive' : 'Mark active' },
              ...(isOwner ? [{ key: 'delete', label: 'Delete member', danger: true }] : []),
            ]"
            @select="k => k === 'status' ? toggleStatus() : (showDeleteModal = true)"
          />
        </div>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-sm text-red-700">{{ errorMessage }}</p>
      <button class="text-red-500 hover:text-red-700 text-sm font-medium" @click="errorMessage = ''">Dismiss</button>
    </div>

    <!-- Member Info -->
    <AppCard v-if="member" title="Contact">
      <div class="space-y-2 text-sm">
        <p v-if="member.phone"><span class="text-slate-600">Phone:</span> <a :href="`tel:${member.phone}`" class="text-primary-600 hover:underline">{{ formatPhone(member.phone) }}</a></p>
        <p v-if="member.email"><span class="text-slate-600">Email:</span> {{ member.email }}</p>
        <p v-if="member.fatherName"><span class="text-slate-600">Father's Name:</span> {{ member.fatherName }}</p>
        <p v-if="member.address"><span class="text-slate-600">Address:</span> {{ member.address }}</p>
        <p v-if="member.batch"><span class="text-slate-600">Batch:</span> {{ member.batch }}</p>
        <p v-if="member.notes"><span class="text-slate-600">Notes:</span> {{ member.notes }}</p>
      </div>
      <div class="-ml-2.5 mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
        <AppAction v-if="member.phone" icon="phone" :href="`tel:${member.phone}`">Call</AppAction>
        <AppAction v-if="canWhatsApp" icon="whatsapp" tone="whatsapp" :href="getWhatsAppLink(member.phone!, '')" external>WhatsApp</AppAction>
        <AppAction v-if="canWhatsApp && needsPaymentReminder" icon="send" tone="whatsapp" @click="sendPaymentReminder">Payment reminder</AppAction>
        <AppAction v-else-if="canWhatsApp && needsRenewalReminder" icon="send" tone="whatsapp" @click="sendRenewalReminder">Renewal reminder</AppAction>
      </div>
    </AppCard>

    <!-- Seat Assignment (library only) -->
    <AppCard v-if="isLibrary" title="Seat Assignment">
      <!-- Multiple batch assignments -->
      <div v-if="seatAssignments.length > 0" class="space-y-3">
        <div v-for="assignment in seatAssignments" :key="assignment.id" class="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
          <div class="space-y-1 text-sm">
            <p>
              <span v-if="assignment.batchName" class="inline-block bg-primary-50 text-primary-700 text-xs font-medium px-2 py-0.5 rounded mr-2">{{ assignment.batchName }}</span>
              <span class="font-medium text-slate-800">Seat {{ assignment.seat.seatNumber }}</span>
              <span v-if="assignment.seat.seatLabel" class="ml-1 text-slate-600">({{ assignment.seat.seatLabel }})</span>
            </p>
            <p v-if="assignment.assignedByName" class="text-slate-600">
              Assigned by {{ assignment.assignedByName }} on {{ formatDate(assignment.assignedAt) }}
            </p>
          </div>
          <div class="mt-1">
            <AppAction tone="slate" class="-ml-2.5" :loading="removingSeat" @click="removeBatchSeatAssignment(assignment.batchId)">
              Remove
            </AppAction>
          </div>
        </div>
      </div>
      <div v-else class="text-sm text-slate-600 py-2">
        No seat assigned
      </div>
      <div class="-ml-2.5 mt-2">
        <AppAction icon="seat" @click="openSeatAssignment">
          {{ seatAssignments.length > 0 ? 'Assign another seat' : 'Assign seat' }}
        </AppAction>
      </div>
    </AppCard>

    <!-- Subscriptions -->
    <AppCard title="Subscriptions">
      <div class="space-y-3">
        <div v-for="sub in subscriptions" :key="sub.id" class="py-2 border-b border-slate-100 last:border-0">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-slate-800 text-sm">{{ sub.planName }}</p>
              <p class="text-xs text-slate-600">
                {{ formatDuration(sub.durationType, sub.durationValue) }} &middot;
                <span class="whitespace-nowrap">{{ formatDate(sub.startDate) }}</span> &ndash; <span class="whitespace-nowrap">{{ formatDate(sub.endDate) }}</span>
              </p>
            </div>
            <p class="shrink-0 text-sm font-semibold text-slate-800">{{ formatCurrency(sub.amount) }}</p>
          </div>
          <div class="mt-1.5 flex flex-wrap items-center gap-1">
            <AppBadge :color="sub.status === 'active' ? 'green' : 'gray'" class="text-xs">
              {{ sub.status }}
            </AppBadge>
            <AppBadge :color="paymentStatusColor(sub.paymentStatus)" class="text-xs">
              {{ paymentStatusLabel(sub.paymentStatus) }}
            </AppBadge>
            <span v-if="sub.totalPaid > 0 && sub.paymentStatus !== 'paid'" class="text-xs text-slate-600">
              Paid {{ formatCurrency(sub.totalPaid) }} of {{ formatCurrency(sub.amount) }}
            </span>
          </div>
          <div class="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
            <div class="-ml-2.5 flex flex-wrap items-center gap-1">
              <AppAction
                v-if="sub.paymentStatus === 'partial' || sub.paymentStatus === 'unpaid'"
                icon="rupee"
                @click="openInlinePayment(sub)"
              >
                {{ sub.paymentStatus === 'partial' ? `Pay ${formatCurrency(sub.amount - sub.totalPaid)} left` : 'Record payment' }}
              </AppAction>
              <AppAction v-if="sub.id === latestSubscriptionId" icon="refresh" @click="renewSubscription(sub)">
                Renew
              </AppAction>
            </div>
            <AppMoreMenu
              v-if="sub.id === latestSubscriptionId || isOwner"
              label="More actions for this subscription"
              :loading="deletingSubscriptionId === sub.id"
              :items="[
                ...(sub.id === latestSubscriptionId ? [{ key: 'change', label: 'Change plan' }] : []),
                ...(isOwner ? [{ key: 'delete', label: 'Delete subscription', danger: true }] : []),
              ]"
              @select="k => k === 'change' ? openChangePlan(sub) : deleteSubscription(sub)"
            />
          </div>
        </div>
        <div v-if="subscriptions.length === 0" class="text-sm text-slate-600 py-2">No subscriptions</div>
      </div>
      <div v-if="subscriptions.length === 0" class="-ml-2.5 mt-2">
        <AppAction icon="plus" @click="openAssignPlan">Assign plan</AppAction>
      </div>
    </AppCard>

    <!-- Payments -->
    <AppCard title="Payments">
      <div class="space-y-3">
        <div v-for="payment in payments" :key="payment.id" class="py-2 border-b border-slate-100 last:border-0">
          <div class="flex items-baseline justify-between gap-3">
            <p class="text-xs text-slate-600">
              <span class="whitespace-nowrap">{{ formatDate(payment.date) }}</span> &middot; <span class="capitalize">{{ payment.method.replace('_', ' ') }}</span>
            </p>
            <p class="shrink-0 text-sm font-semibold text-slate-800">{{ formatCurrency(payment.amount) }}</p>
          </div>
          <p v-if="payment.notes" class="text-xs text-slate-600 break-words">{{ payment.notes }}</p>
          <div class="mt-1 flex items-center justify-between">
            <ReceiptActions :payment-id="payment.id" class="-ml-2.5" />
            <AppMoreMenu
              v-if="isOwner"
              label="More actions for this payment"
              :items="[{ key: 'edit', label: 'Edit payment' }, { key: 'delete', label: 'Delete', danger: true }]"
              :loading="deletingPaymentId === payment.id"
              @select="k => k === 'edit' ? openEditPayment(payment) : deletePayment(payment)"
            />
          </div>
        </div>
        <div v-if="payments.length === 0" class="text-sm text-slate-600 py-2">No payments recorded</div>
      </div>
    </AppCard>

    <!-- Recent Check-Ins -->
    <AppCard title="Recent Check-Ins">
      <div class="space-y-3">
        <div v-for="ci in recentCheckIns" :key="ci.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm text-slate-800">{{ formatCheckInDateTime(ci.checkedInAt) }}</p>
            <p v-if="ci.checkedOutAt" class="text-xs text-slate-600">
              Duration: {{ ci.durationMinutes != null ? formatCheckInDuration(ci.durationMinutes) : '—' }}
            </p>
            <p v-else class="text-xs text-green-600 font-medium">Currently checked in</p>
          </div>
          <div class="flex items-center gap-1">
            <AppBadge :color="subscriptionStatusColor(ci.subscriptionStatus)" class="text-xs">
              {{ ci.subscriptionStatus }}
            </AppBadge>
            <AppBadge v-if="ci.autoCheckedOut" color="yellow" class="text-xs">auto</AppBadge>
          </div>
        </div>
        <div v-if="recentCheckIns.length === 0" class="text-sm text-slate-600 py-2">No check-ins</div>
      </div>
      <div class="mt-3 flex items-center justify-between">
        <AppAction
          v-if="!isCurrentlyCheckedIn"
          icon="login"
          class="-ml-2.5"
          :loading="checkingIn"
          @click="quickCheckIn"
        >
          Check in
        </AppAction>
        <span v-else class="text-xs text-green-600 font-medium">Currently checked in</span>
        <NuxtLink
          v-if="checkInTotal > 5"
          :to="`/dashboard/check-ins/history?search=${encodeURIComponent(member?.name || '')}`"
          class="text-xs text-primary-600 hover:text-primary-500"
        >
          View All ({{ checkInTotal }})
        </NuxtLink>
      </div>
    </AppCard>

    <!-- Assign Plan Modal -->
    <AppModal :open="showAssignModal" :title="isChangingPlan ? 'Change Plan' : 'Assign Subscription'" @close="showAssignModal = false">
      <form class="space-y-4" @submit.prevent="assignPlan">
        <p v-if="isChangingPlan" class="text-sm text-slate-600">
          This updates the selected subscription while keeping its payment history and status linked.
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
            <input v-model="assignForm.recordPayment" type="checkbox" class="rounded border-slate-300 text-primary-600 focus:ring-primary-500">
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

        <div v-if="assignError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ assignError }}</p>
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

    <!-- Edit Payment Modal -->
    <AppModal :open="showEditPaymentModal" title="Edit Payment" @close="showEditPaymentModal = false">
      <form class="space-y-4" @submit.prevent="savePaymentEdit">
        <AppInput v-model="editPaymentForm.amount" label="Amount (Rupees)" type="number" required />
        <AppInput v-model="editPaymentForm.date" label="Date" type="date" required />
        <AppSelect v-model="editPaymentForm.method" label="Payment Method" :options="paymentMethods" />
        <AppSelect v-model="editPaymentForm.subscriptionId" label="Subscription" :options="subscriptionOptions" />
        <AppInput v-model="editPaymentForm.notes" label="Notes" placeholder="Optional" />
        <div v-if="editPaymentError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ editPaymentError }}</p>
        </div>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showEditPaymentModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="savingPaymentEdit">Save Changes</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Delete Member Modal -->
    <AppModal :open="showDeleteModal" title="Delete Member" size="sm" @close="showDeleteModal = false">
      <div class="space-y-4">
        <p class="text-sm text-slate-700">
          Delete <strong class="text-slate-800">{{ member?.name }}</strong> permanently?
        </p>
        <p class="text-sm text-slate-600">
          This also deletes their subscriptions, payments, check-ins, and seat assignments. This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <AppButton variant="secondary" :disabled="deletingMember" @click="showDeleteModal = false">
            Cancel
          </AppButton>
          <AppButton variant="danger" :loading="deletingMember" @click="deleteMember">
            Delete Member
          </AppButton>
        </div>
      </div>
    </AppModal>

    <!-- Edit Member Modal -->
    <AppModal :open="showEditModal" title="Edit Member" @close="showEditModal = false">
      <form class="space-y-4" @submit.prevent="saveEditMember">
        <AppInput v-model="editForm.name" label="Name" required />
        <AppInput
          v-model="editForm.phone"
          label="Phone"
          type="tel"
          placeholder="+91 98765 43210"
          :error="editPhoneError"
          @blur="validateEditPhone"
        />
        <AppInput v-model="editForm.email" label="Email" type="email" placeholder="member@example.com" />
        <AppInput v-model="editForm.fatherName" label="Father's Name" placeholder="Optional" />
        <AppInput v-model="editForm.address" label="Address" placeholder="Optional" />
        <AppInput v-model="editForm.batch" label="Batch / Timing" placeholder="e.g., Morning, Afternoon, Evening" />
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            v-model="editForm.notes"
            rows="3"
            class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="Optional notes"
          />
        </div>
        <div v-if="editError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ editError }}</p>
        </div>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showEditModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="savingEdit">Save</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Assign Seat Modal (library only) -->
    <AppModal v-if="isLibrary" :open="showSeatModal" title="Assign Seat" @close="showSeatModal = false">
      <form class="space-y-4" @submit.prevent="assignSeat">
        <AppSelect
          v-if="seatBatches.length > 0"
          v-model="seatForm.batchId"
          label="Batch"
          :options="batchOptions"
          placeholder="Select a batch"
        />
        <AppSelect
          v-model="seatForm.seatId"
          label="Select Seat"
          :options="availableSeatsOptions"
          placeholder="Choose a seat"
          required
        />
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
          <textarea
            v-model="seatForm.notes"
            rows="2"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Any notes about this seat assignment"
          />
        </div>
        <div v-if="seatError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ seatError }}</p>
        </div>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" @click="showSeatModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="assigningSeat">Assign</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { validatePhone, normalizePhone, formatPhone } from "~~/shared/utils/phone";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const route = useRoute();
const { orgId, currentOrg } = useOrg();
const t = useTerminology();
const { formatCurrency, parseCurrencyToInt } = useFormatCurrency();
const { formatDate } = useFormatDate();
const { getWhatsAppLink, getReminderMessage, getPaymentReminderMessage } = useWhatsApp();

const memberId = route.params.id;
const isLibrary = computed(() => currentOrg.value?.type === 'library');
const isOwner = computed(() => currentOrg.value?.role === 'owner');

interface MemberDetail {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  fatherName: string | null;
  address: string | null;
  batch: string | null;
  photoKey: string | null;
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
  subscriptionId: number | null;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

const showAssignModal = ref(false);
const showPaymentModal = ref(false);
const showEditPaymentModal = ref(false);
const assigning = ref(false);
const recordingPayment = ref(false);
const isChangingPlan = ref(false);
const changingSubscriptionId = ref<number | null>(null);
const savingPaymentEdit = ref(false);
const deletingPaymentId = ref<number | null>(null);
const deletingSubscriptionId = ref<number | null>(null);
const editPaymentError = ref("");
const assignError = ref("");
const errorMessage = ref("");
const showDeleteModal = ref(false);
const deletingMember = ref(false);

const today = todayLocal();
const assignForm = reactive({ planId: "", startDate: today, recordPayment: false, paymentAmount: "", paymentMethod: "cash" });
const paymentForm = reactive({ amount: "", date: today, method: "cash", notes: "", subscriptionId: "" });
const editPaymentForm = reactive({ id: 0, amount: "", date: today, method: "cash", notes: "", subscriptionId: "" });

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

// Seat Assignment
interface SeatAssignment {
  id: number;
  seatId: number;
  batchId: number | null;
  batchName: string | null;
  assignedAt: string;
  assignedByName: string;
  notes: string | null;
  seat: {
    id: number;
    seatNumber: string;
    seatLabel?: string | null;
    timePreference?: string | null;
    genderPreference?: string | null;
  };
}

interface SeatBatch {
  id: number;
  name: string;
  isActive: boolean;
}

interface LibrarySeat {
  id: number;
  seatNumber: string;
  seatLabel?: string | null;
  isOccupied: boolean;
}

const showSeatModal = ref(false);
const assigningSeat = ref(false);
const removingSeat = ref(false);
const seatError = ref("");
const seatForm = reactive({ seatId: "", batchId: "", notes: "" });

// Seat data — only fetch for library orgs
const seatAssignmentDataReq = useFetch<{ assignment: SeatAssignment | null; assignments: SeatAssignment[] }>(
  `/api/orgs/${orgId.value}/members/${memberId}/seat-assignment`,
  { immediate: isLibrary.value },
);
const { data: seatAssignmentData, refresh: refreshSeatAssignment } = seatAssignmentDataReq;
const seatAssignments = computed(() => seatAssignmentData.value?.assignments ?? []);

const seatBatchesDataReq = useFetch<{ batches: SeatBatch[] }>(
  `/api/orgs/${orgId.value}/seat-batches`,
  { immediate: isLibrary.value },
);
const { data: seatBatchesData } = seatBatchesDataReq;
const seatBatches = computed(() => (seatBatchesData.value?.batches ?? []).filter(b => b.isActive));
const batchOptions = computed(() => [
  { value: "", label: "No batch (default)" },
  ...seatBatches.value.map(b => ({ value: b.id, label: b.name })),
]);

const availableSeatsDataReq = useFetch<{ seats: LibrarySeat[] }>(
  `/api/orgs/${orgId.value}/seats`,
  { query: { status: "all" }, immediate: isLibrary.value },
);
const { data: availableSeatsData } = availableSeatsDataReq;
const availableSeats = computed(() => availableSeatsData.value?.seats ?? []);
const availableSeatsOptions = computed(() =>
  availableSeats.value.map(s => ({
    value: s.id,
    label: `${s.seatNumber}${s.seatLabel ? ` (${s.seatLabel})` : ""}${s.isOccupied ? " - Occupied" : ""}`,
  })),
);

function openSeatAssignment() {
  seatForm.seatId = "";
  seatForm.batchId = "";
  seatForm.notes = "";
  seatError.value = "";
  showSeatModal.value = true;
}

async function assignSeat() {
  assigningSeat.value = true;
  seatError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}/seat-assignment`, {
      method: "POST",
      body: {
        seatId: Number(seatForm.seatId),
        batchId: seatForm.batchId ? Number(seatForm.batchId) : null,
        notes: seatForm.notes || null,
      },
    });
    showSeatModal.value = false;
    await refreshSeatAssignment();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    seatError.value = e.data?.statusMessage || e.message || "Failed to assign seat";
  } finally {
    assigningSeat.value = false;
  }
}

async function removeBatchSeatAssignment(batchId: number | null) {
  if (!confirm("Are you sure you want to remove this seat assignment?")) return;

  removingSeat.value = true;
  errorMessage.value = "";
  try {
    const query = batchId ? `?batchId=${batchId}` : "";
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}/seat-assignment${query}`, {
      method: "DELETE",
    });
    await refreshSeatAssignment();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to remove seat assignment";
  } finally {
    removingSeat.value = false;
  }
}

const memberDataReq = useFetch<{ member: MemberDetail; subscriptions: Subscription[]; payments: Payment[] }>(
  `/api/orgs/${orgId.value}/members/${memberId}`,
);
const { data: memberData, refresh: refreshMember } = memberDataReq;
const member = computed(() => memberData.value?.member ?? null);
const subscriptions = computed(() => memberData.value?.subscriptions ?? []);
const latestSubscriptionId = computed(() => {
  const subs = subscriptions.value;
  if (subs.length === 0) return null;
  return subs.reduce((latest, sub) =>
    sub.endDate > latest.endDate ? sub : latest,
  ).id;
});
const subscriptionOptions = computed(() => [
  { value: "", label: "Not linked to a subscription" },
  ...subscriptions.value.map(s => ({ value: String(s.id), label: `${s.planName} (${formatDate(s.startDate)} - ${formatDate(s.endDate)})` })),
]);
const payments = computed(() => memberData.value?.payments ?? []);

// Member photo
const photoInput = ref<HTMLInputElement | null>(null);
const uploadingPhoto = ref(false);
const photoVersion = ref(0);
const hasPhoto = computed(() => !!member.value?.photoKey);
const photoUrl = computed(() =>
  `/api/orgs/${orgId.value}/members/${memberId}/photo?v=${member.value?.photoKey ?? ""}&_=${photoVersion.value}`,
);
const initials = computed(() => {
  const name = member.value?.name?.trim() || "";
  if (!name) return "?";
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
});

function triggerPhotoPicker() {
  if (uploadingPhoto.value) return;
  photoInput.value?.click();
}

// Downscale + re-encode to webp on the client to keep storage/bandwidth tiny
async function resizeImage(file: File, maxSize = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/webp", 0.85);
  });
}

async function onPhotoSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // reset so re-selecting the same file fires change again
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    errorMessage.value = "Please select an image file";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = "Image is too large (max 10MB)";
    return;
  }

  uploadingPhoto.value = true;
  errorMessage.value = "";
  try {
    const resized = await resizeImage(file);
    const form = new FormData();
    form.append("file", resized, "photo.webp");
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}/photo`, {
      method: "POST",
      body: form,
    });
    photoVersion.value++;
    await refreshMember();
  } catch (err: unknown) {
    const ex = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = ex.data?.statusMessage || ex.message || "Failed to upload photo";
  } finally {
    uploadingPhoto.value = false;
  }
}

async function removePhoto() {
  if (uploadingPhoto.value || !hasPhoto.value) return;
  if (!confirm("Remove this member's photo?")) return;
  uploadingPhoto.value = true;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}/photo`, { method: "DELETE" });
    photoVersion.value++;
    await refreshMember();
  } catch (err: unknown) {
    const ex = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = ex.data?.statusMessage || ex.message || "Failed to remove photo";
  } finally {
    uploadingPhoto.value = false;
  }
}

// WhatsApp helpers
const canWhatsApp = computed(() => !!member.value?.phone);

const latestSubscription = computed(() => {
  const subs = subscriptions.value;
  if (subs.length === 0) return null;
  return subs.reduce((latest, sub) => sub.endDate > latest.endDate ? sub : latest);
});

const needsRenewalReminder = computed(() => {
  const sub = latestSubscription.value;
  if (!sub) return false;
  return sub.endDate <= today || (sub.status === 'expired');
});

const needsPaymentReminder = computed(() => {
  const sub = latestSubscription.value;
  if (!sub) return false;
  return sub.paymentStatus === 'unpaid' || sub.paymentStatus === 'partial';
});

function openWhatsApp(message: string) {
  if (!member.value?.phone) return;
  const url = getWhatsAppLink(member.value.phone, message);
  window.open(url, '_blank');
}

function sendRenewalReminder() {
  if (!member.value || !latestSubscription.value) return;
  const msg = getReminderMessage(member.value.name, latestSubscription.value.planName, formatDate(latestSubscription.value.endDate));
  openWhatsApp(msg);
}

function sendPaymentReminder() {
  if (!member.value || !latestSubscription.value) return;
  const remaining = latestSubscription.value.amount - latestSubscription.value.totalPaid;
  const msg = getPaymentReminderMessage(member.value.name, formatCurrency(remaining));
  openWhatsApp(msg);
}

// Check-ins
interface CheckInRecord {
  id: number;
  checkedInAt: string;
  checkedOutAt: string | null;
  durationMinutes: number | null;
  autoCheckedOut: boolean;
  subscriptionStatus: string;
  notes: string | null;
}
const checkingIn = ref(false);
const checkInsDataReq = useFetch<{ checkIns: CheckInRecord[]; pagination: { total: number } }>(
  `/api/orgs/${orgId.value}/members/${memberId}/check-ins`,
  { query: { limit: 5 } },
);
const { data: checkInsData, refresh: refreshCheckIns } = checkInsDataReq;
const recentCheckIns = computed(() => checkInsData.value?.checkIns ?? []);
const checkInTotal = computed(() => checkInsData.value?.pagination?.total ?? 0);
const isCurrentlyCheckedIn = computed(() => recentCheckIns.value.some(ci => !ci.checkedOutAt));

function formatCheckInDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatCheckInDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

async function quickCheckIn() {
  checkingIn.value = true;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/check-ins`, {
      method: "POST",
      body: { memberId: Number(memberId) },
    });
    await refreshCheckIns();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to check in";
  } finally {
    checkingIn.value = false;
  }
}

const plansDataReq = useFetch<{ plans: Plan[] }>(
  `/api/orgs/${orgId.value}/plans`,
);
const { data: plansData } = plansDataReq;
// Requests above were started without awaiting so they run in parallel;
// wait for all of them here (keeps SSR and navigation behaviour the same).
await Promise.all([seatAssignmentDataReq, seatBatchesDataReq, availableSeatsDataReq, memberDataReq, checkInsDataReq, plansDataReq]);
const plans = computed(() => plansData.value?.plans ?? []);

const planOptions = computed(() =>
  plans.value.filter(p => p.active).map(p => ({ value: p.id, label: p.name })),
);

watch(() => assignForm.planId, (planId) => {
  const plan = plans.value.find(p => p.id === Number(planId));
  if (plan) {
    assignForm.paymentAmount = String(plan.price / 100);
  }
  else {
    assignForm.paymentAmount = "";
    assignForm.recordPayment = false;
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

function subscriptionStatusColor(status: string): "green" | "red" | "yellow" {
  if (status === "active") return "green";
  if (status === "expired") return "red";
  return "yellow";
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
  assignError.value = "";
  // Reset planId first so the watcher fires even for the same plan
  assignForm.planId = "";
  nextTick(() => {
    assignForm.planId = String(sub.planId);
  });
  // Start the renewal the day after the current subscription ends (end dates are inclusive)
  assignForm.startDate = addDaysToDateString(sub.endDate, 1);
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
  assignError.value = "";
  assignForm.planId = "";
  assignForm.startDate = today;
  isChangingPlan.value = false;
  resetPaymentFields();
  showAssignModal.value = true;
}

function openChangePlan(sub: Subscription) {
  assignError.value = "";
  changingSubscriptionId.value = sub.id;
  assignForm.planId = String(sub.planId);
  assignForm.startDate = sub.startDate;
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
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to update status";
  }
}

// Edit Member
const showEditModal = ref(false);
const savingEdit = ref(false);
const editError = ref("");
const editPhoneError = ref("");
const editForm = reactive({
  name: "",
  phone: "",
  email: "",
  fatherName: "",
  address: "",
  batch: "",
  notes: "",
});

function openEditMember() {
  if (!member.value) return;
  editForm.name = member.value.name;
  editForm.phone = member.value.phone || "";
  editForm.email = member.value.email || "";
  editForm.fatherName = member.value.fatherName || "";
  editForm.address = member.value.address || "";
  editForm.batch = member.value.batch || "";
  editForm.notes = member.value.notes || "";
  editError.value = "";
  editPhoneError.value = "";
  showEditModal.value = true;
}

function validateEditPhone() {
  editPhoneError.value = validatePhone(editForm.phone) || "";
}

async function saveEditMember() {
  const phoneErr = validatePhone(editForm.phone);
  if (phoneErr) {
    editPhoneError.value = phoneErr;
    return;
  }
  editPhoneError.value = "";

  savingEdit.value = true;
  editError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}`, {
      method: "PUT",
      body: {
        name: editForm.name,
        phone: editForm.phone ? normalizePhone(editForm.phone) : null,
        email: editForm.email || null,
        fatherName: editForm.fatherName || null,
        address: editForm.address || null,
        batch: editForm.batch || null,
        notes: editForm.notes || null,
      },
    });
    showEditModal.value = false;
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    editError.value = e.data?.statusMessage || e.message || "Failed to update member";
  } finally {
    savingEdit.value = false;
  }
}

async function assignPlan() {
  assigning.value = true;
  assignError.value = "";
  try {
    const body: Record<string, unknown> = {
      planId: Number(assignForm.planId),
      startDate: assignForm.startDate,
      changePlan: isChangingPlan.value,
      subscriptionId: isChangingPlan.value ? changingSubscriptionId.value : undefined,
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
    changingSubscriptionId.value = null;
    assignForm.planId = "";
    assignForm.startDate = today;
    assignForm.recordPayment = false;
    assignForm.paymentAmount = "";
    assignForm.paymentMethod = "cash";
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    assignError.value = e.data?.statusMessage || e.message || "Failed to assign plan";
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
function openEditPayment(payment: Payment) {
  editPaymentForm.id = payment.id;
  editPaymentForm.amount = String(payment.amount / 100);
  editPaymentForm.date = payment.date;
  editPaymentForm.method = payment.method;
  editPaymentForm.notes = payment.notes || "";
  editPaymentForm.subscriptionId = payment.subscriptionId ? String(payment.subscriptionId) : "";
  editPaymentError.value = "";
  showEditPaymentModal.value = true;
}

async function savePaymentEdit() {
  savingPaymentEdit.value = true;
  editPaymentError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/payments/${editPaymentForm.id}`, {
      method: "PUT",
      body: {
        amount: parseCurrencyToInt(Number(editPaymentForm.amount)),
        date: editPaymentForm.date,
        method: editPaymentForm.method,
        notes: editPaymentForm.notes || null,
        subscriptionId: editPaymentForm.subscriptionId ? Number(editPaymentForm.subscriptionId) : null,
      },
    });
    showEditPaymentModal.value = false;
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    editPaymentError.value = e.data?.statusMessage || e.message || "Failed to update payment";
  } finally {
    savingPaymentEdit.value = false;
  }
}

async function deletePayment(payment: Payment) {
  if (!confirm(`Delete the ${formatCurrency(payment.amount)} payment? This cannot be undone.`)) return;
  deletingPaymentId.value = payment.id;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/payments/${payment.id}`, { method: "DELETE" });
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to delete payment";
  } finally {
    deletingPaymentId.value = null;
  }
}

async function deleteMember() {
  if (!member.value || deletingMember.value) return;

  deletingMember.value = true;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}`, { method: "DELETE" });
    await navigateTo("/dashboard/members");
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to delete member";
    showDeleteModal.value = false;
  } finally {
    deletingMember.value = false;
  }
}

async function deleteSubscription(sub: Subscription) {
  if (!confirm(`Delete the ${sub.planName} subscription? Linked payments will be preserved.`)) return;
  deletingSubscriptionId.value = sub.id;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/members/${memberId}/subscriptions/${sub.id}`, { method: "DELETE" });
    await refreshMember();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to delete subscription";
  } finally {
    deletingSubscriptionId.value = null;
  }
}

</script>
