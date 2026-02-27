<template>
  <div class="p-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Library Seats</h1>
      <div class="flex gap-2">
        <AppButton v-if="batches.length > 0" size="sm" variant="secondary" @click="navigateTo('/dashboard/seats/batches')">
          Manage Batches
        </AppButton>
        <AppButton size="sm" variant="secondary" @click="navigateTo('/dashboard/seats/manage')">
          Manage Seats
        </AppButton>
      </div>
    </div>

    <!-- Batch Tabs (if org has batches) -->
    <div v-if="batches.length > 0" class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="batch in activeBatches"
        :key="batch.id"
        class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
        :class="selectedBatchId === batch.id
          ? 'bg-primary-600 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
        @click="selectBatch(batch.id)"
      >
        {{ batch.name }}
        <span v-if="batch.startTime" class="text-xs opacity-75 ml-1">
          ({{ batch.startTime }}<span v-if="batch.endTime">-{{ batch.endTime }}</span>)
        </span>
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <AppStatCard
        label="Total Seats"
        :value="stats.total"
        icon="&#x1FA91;"
      />
      <AppStatCard
        label="Occupied"
        :value="stats.occupied"
        icon="&#x2713;"
        color="green"
      />
      <AppStatCard
        label="Vacant"
        :value="stats.vacant"
        icon="&#x25CB;"
        color="slate"
      />
      <AppStatCard
        v-if="selectedBatchId"
        label="Assigned"
        :value="stats.assigned || 0"
        icon="&#x1F4CC;"
        color="blue"
      />
      <AppStatCard
        v-if="selectedBatchId"
        label="Unassigned"
        :value="stats.unassigned || 0"
        icon="&#x2014;"
        color="gray"
      />
      <AppStatCard
        v-if="!selectedBatchId"
        label="Male"
        :value="stats.maleOccupied"
        icon="&#x2642;"
        color="yellow"
      />
      <AppStatCard
        v-if="!selectedBatchId"
        label="Female"
        :value="stats.femaleOccupied"
        icon="&#x2640;"
        color="pink"
      />
      <AppStatCard
        v-if="stats.needsAttention > 0"
        label="Needs Attention"
        :value="stats.needsAttention"
        icon="&#x26A0;"
        color="red"
      />
    </div>

    <!-- Filters (only show when no batch selected) -->
    <AppCard v-if="!selectedBatchId" title="Filters">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AppSelect
          v-model="statusFilter"
          label="Status"
          :options="[
            { value: 'all', label: 'All Seats' },
            { value: 'occupied', label: 'Occupied' },
            { value: 'vacant', label: 'Vacant' },
          ]"
        />
        <AppSelect
          v-model="timeFilter"
          label="Time Preference"
          :options="[
            { value: 'all', label: 'All Times' },
            { value: 'day', label: 'Day' },
            { value: 'evening', label: 'Evening' },
            { value: 'flexible', label: 'Flexible' },
            { value: 'all-day', label: 'All Day' },
          ]"
        />
        <AppSelect
          v-model="genderFilter"
          label="Gender Preference"
          :options="[
            { value: 'all', label: 'All Genders' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'any', label: 'Any' },
          ]"
        />
      </div>
    </AppCard>

    <!-- Search by Member Name -->
    <AppSearchBar
      v-model="searchQuery"
      placeholder="Search by member name..."
    />

    <!-- Seat Grid -->
    <AppCard title="Seat Grid">
      <div v-if="loading" class="text-center py-8">
        <p class="text-sm text-slate-600">Loading seats...</p>
      </div>
      <div v-else-if="seats.length === 0" class="text-center py-8">
        <AppEmptyState
          title="No seats found"
          description="Create seats in the Manage Seats page"
        />
      </div>
      <div v-else-if="filteredSeats.length === 0" class="text-center py-8">
        <p class="text-sm text-slate-600">No seats match "{{ searchQuery }}"</p>
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <SeatCard
          v-for="seat in filteredSeats"
          :key="seat.id"
          :seat="seat"
          :assigned-member="seat.assignedMember"
          :member-alert="seat.memberAlert"
          @click="handleSeatClick"
        />
      </div>
    </AppCard>

    <!-- Seat Details Modal -->
    <AppModal :open="showSeatModal" :title="`Seat ${selectedSeat?.seatNumber}`" @close="showSeatModal = false">
      <div v-if="selectedSeat" class="space-y-4">
        <!-- Seat Info -->
        <div>
          <h3 class="text-sm font-medium text-slate-700 mb-2">Seat Information</h3>
          <div class="space-y-1 text-sm">
            <p v-if="selectedSeat.seatLabel">
              <span class="text-slate-600">Label:</span>
              <span class="ml-2 text-slate-800">{{ selectedSeat.seatLabel }}</span>
            </p>
            <p v-if="selectedSeat.timePreference">
              <span class="text-slate-600">Time:</span>
              <span class="ml-2 text-slate-800 capitalize">{{ selectedSeat.timePreference }}</span>
            </p>
            <p v-if="selectedSeat.genderPreference">
              <span class="text-slate-600">Gender:</span>
              <span class="ml-2 text-slate-800 capitalize">{{ selectedSeat.genderPreference }}</span>
            </p>
          </div>
        </div>

        <!-- Assigned Member (batch mode) -->
        <div v-if="selectedSeat.assignedMember && !selectedSeat.isOccupied">
          <h3 class="text-sm font-medium text-slate-700 mb-2">Assigned Member</h3>
          <div class="space-y-1 text-sm">
            <p>
              <span class="text-slate-600">Name:</span>
              <NuxtLink
                :to="`/dashboard/members/${selectedSeat.assignedMember.memberId}`"
                class="ml-2 text-primary-600 hover:text-primary-500"
              >
                {{ selectedSeat.assignedMember.memberName }}
              </NuxtLink>
            </p>
          </div>
        </div>

        <!-- Current Occupant -->
        <div v-if="selectedSeat.isOccupied && selectedSeat.currentOccupant">
          <h3 class="text-sm font-medium text-slate-700 mb-2">Current Occupant</h3>
          <div class="space-y-1 text-sm">
            <p>
              <span class="text-slate-600">Name:</span>
              <NuxtLink
                :to="`/dashboard/members/${selectedSeat.currentOccupant.memberId}`"
                class="ml-2 text-primary-600 hover:text-primary-500"
              >
                {{ selectedSeat.currentOccupant.memberName }}
              </NuxtLink>
            </p>
            <p>
              <span class="text-slate-600">Checked in:</span>
              <span class="ml-2 text-slate-800">{{ formatDateTime(selectedSeat.currentOccupant.checkedInAt) }}</span>
            </p>
          </div>
        </div>
        <div v-else-if="!selectedSeat.assignedMember">
          <p class="text-sm text-slate-600">This seat is currently vacant</p>
        </div>

        <!-- Assign Member Inline Form -->
        <div v-if="showAssignForm && !selectedSeat.isOccupied && !selectedSeat.assignedMember" class="space-y-3">
          <h3 class="text-sm font-medium text-slate-700">Assign Member to Seat</h3>
          <div class="relative">
            <AppInput
              v-model="memberSearchQuery"
              label="Search Member"
              placeholder="Type member name or phone..."
              @input="debouncedMemberSearch"
            />
            <!-- Search Results Dropdown -->
            <div
              v-if="memberSearchResults.length > 0 && memberSearchQuery.trim()"
              class="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <button
                v-for="m in memberSearchResults"
                :key="m.id"
                type="button"
                class="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors"
                :class="selectedMemberId === m.id ? 'bg-primary-50 text-primary-700' : 'text-slate-800'"
                @click="selectMember(m)"
              >
                <span class="font-medium">{{ m.name }}</span>
                <span v-if="m.phone" class="text-slate-600 ml-2">{{ m.phone }}</span>
              </button>
            </div>
            <div
              v-else-if="memberSearchQuery.trim().length >= 2 && !searchingMembers && memberSearchResults.length === 0"
              class="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2"
            >
              <p class="text-sm text-slate-600">No members found</p>
            </div>
          </div>
          <div v-if="selectedMemberName" class="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2">
            <span class="text-sm text-primary-700 font-medium">{{ selectedMemberName }}</span>
            <button type="button" class="text-primary-500 hover:text-primary-700 text-xs" @click="clearSelectedMember">&times; Clear</button>
          </div>
          <div v-if="assignError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p class="text-sm text-red-700">{{ assignError }}</p>
          </div>
          <div class="flex gap-2">
            <AppButton
              variant="primary"
              :disabled="!selectedMemberId || assigningMember"
              @click="handleAssignMember"
            >
              {{ assigningMember ? "Assigning..." : "Assign" }}
            </AppButton>
            <AppButton variant="secondary" @click="showAssignForm = false">
              Cancel
            </AppButton>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <AppButton
            v-if="selectedSeat.isOccupied && selectedSeat.currentOccupant"
            variant="primary"
            class="flex-1"
            :disabled="checkingOut"
            @click="handleCheckout"
          >
            {{ checkingOut ? "Checking out..." : "Checkout" }}
          </AppButton>
          <AppButton
            v-if="!selectedSeat.isOccupied && selectedSeat.assignedMember"
            variant="primary"
            class="flex-1"
            :disabled="checkingIn"
            @click="handleQuickCheckIn"
          >
            {{ checkingIn ? "Checking in..." : `Check In ${selectedSeat.assignedMember.memberName}` }}
          </AppButton>
          <AppButton
            v-if="!selectedSeat.isOccupied && !selectedSeat.assignedMember && !showAssignForm"
            variant="secondary"
            class="flex-1"
            @click="openAssignForm"
          >
            Assign Member
          </AppButton>
          <AppButton
            v-if="!showAssignForm"
            variant="secondary"
            class="flex-1"
            @click="showSeatModal = false"
          >
            Close
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const { api } = useApi();
const searchQuery = ref("");
const statusFilter = ref("all");
const timeFilter = ref("all");
const genderFilter = ref("all");
const loading = ref(false);
const showSeatModal = ref(false);
const selectedSeat = ref<any>(null);
const checkingOut = ref(false);
const checkingIn = ref(false);

// Assign member state
const showAssignForm = ref(false);
const memberSearchQuery = ref("");
const memberSearchResults = ref<{ id: number; name: string; phone: string | null }[]>([]);
const searchingMembers = ref(false);
const selectedMemberId = ref<number | null>(null);
const selectedMemberName = ref("");
const assigningMember = ref(false);
const assignError = ref("");

// Batch support
interface Batch {
  id: number;
  name: string;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  displayOrder: number;
}

const batches = ref<Batch[]>([]);
const selectedBatchId = ref<number | null>(null);
const activeBatches = computed(() => batches.value.filter(b => b.isActive));

interface Seat {
  id: number;
  seatNumber: string;
  seatLabel?: string | null;
  timePreference?: string | null;
  genderPreference?: string | null;
  isOccupied: boolean;
  currentOccupant?: {
    checkInId: number;
    memberId: number;
    memberName: string;
    memberGender?: string | null;
    checkedInAt: string;
  } | null;
  assignedMember?: {
    memberId: number;
    memberName: string;
    memberGender?: string | null;
  } | null;
  memberAlert?: {
    hasActiveSubscription: boolean;
    paymentStatus: string | null;
  } | null;
}

const seats = ref<Seat[]>([]);
const stats = ref({
  total: 0,
  occupied: 0,
  vacant: 0,
  assigned: 0,
  unassigned: 0,
  maleOccupied: 0,
  femaleOccupied: 0,
  needsAttention: 0,
});

// Filter seats by search query (member name)
const filteredSeats = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return seats.value;
  return seats.value.filter((seat) => {
    const occupantName = seat.currentOccupant?.memberName?.toLowerCase() || "";
    const assignedName = seat.assignedMember?.memberName?.toLowerCase() || "";
    const seatNumber = seat.seatNumber?.toLowerCase() || "";
    return occupantName.includes(query) || assignedName.includes(query) || seatNumber.includes(query);
  });
});

// Fetch batches on mount
async function fetchBatches() {
  try {
    const data = await api<{ batches: Batch[] }>(`/api/orgs/${orgId.value}/seat-batches`);
    batches.value = data.batches;
    // Auto-select first active batch if batches exist
    if (activeBatches.value.length > 0 && !selectedBatchId.value) {
      selectedBatchId.value = activeBatches.value[0]!.id;
    }
  } catch {
    batches.value = [];
  }
}

function selectBatch(batchId: number) {
  selectedBatchId.value = batchId;
}

// Fetch seats
async function fetchSeats() {
  loading.value = true;
  try {
    const queryParams: Record<string, any> = {
      status: statusFilter.value,
    };
    if (selectedBatchId.value) {
      queryParams.batchId = selectedBatchId.value;
    } else {
      if (timeFilter.value !== "all") queryParams.timeFilter = timeFilter.value;
      if (genderFilter.value !== "all") queryParams.genderFilter = genderFilter.value;
    }

    const data = await api<{ seats: Seat[]; stats: any }>(`/api/orgs/${orgId.value}/seats`, {
      query: queryParams,
    });
    seats.value = data.seats;
    stats.value = data.stats;
  } catch (error: any) {
    console.error("Failed to fetch seats:", error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchBatches();
  await fetchSeats();
});

// Watch filters and batch selection
watch([statusFilter, timeFilter, genderFilter, selectedBatchId], () => {
  fetchSeats();
});

// Handle seat click
function handleSeatClick(seat: Seat) {
  selectedSeat.value = seat;
  showAssignForm.value = false;
  showSeatModal.value = true;
}

// Go to check-in page
function goToCheckIn() {
  if (selectedSeat.value) {
    const params = new URLSearchParams({ seatId: String(selectedSeat.value.id) });
    if (selectedBatchId.value) {
      params.set("batchId", String(selectedBatchId.value));
    }
    navigateTo(`/dashboard/check-ins?${params.toString()}`);
  } else {
    navigateTo("/dashboard/check-ins");
  }
  showSeatModal.value = false;
}

// Quick check-in for seats with assigned members
async function handleQuickCheckIn() {
  if (!selectedSeat.value?.assignedMember?.memberId) return;

  checkingIn.value = true;
  try {
    const payload: Record<string, any> = {
      memberId: selectedSeat.value.assignedMember.memberId,
      seatId: selectedSeat.value.id,
    };
    if (selectedBatchId.value) {
      payload.batchId = selectedBatchId.value;
    }

    await api(`/api/orgs/${orgId.value}/check-ins`, {
      method: "POST",
      body: payload,
    });

    showSeatModal.value = false;
    selectedSeat.value = null;
    await fetchSeats();
  } catch (error: any) {
    console.error("Failed to check in:", error);
    alert(error?.data?.statusMessage || "Failed to check in member");
  } finally {
    checkingIn.value = false;
  }
}

// Handle checkout
async function handleCheckout() {
  if (!selectedSeat.value?.currentOccupant?.checkInId) {
    return;
  }

  checkingOut.value = true;
  try {
    await api(`/api/orgs/${orgId.value}/check-ins/${selectedSeat.value.currentOccupant.checkInId}`, {
      method: "PUT",
    });

    // Close modal
    showSeatModal.value = false;
    selectedSeat.value = null;

    // Refresh seats
    await fetchSeats();
  } catch (error: any) {
    console.error("Failed to checkout:", error);
  } finally {
    checkingOut.value = false;
  }
}

// Assign member from seat modal
let memberSearchTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedMemberSearch() {
  if (memberSearchTimeout) clearTimeout(memberSearchTimeout);
  memberSearchTimeout = setTimeout(() => searchMembers(), 300);
}

async function searchMembers() {
  const q = memberSearchQuery.value.trim();
  if (q.length < 2) {
    memberSearchResults.value = [];
    return;
  }
  searchingMembers.value = true;
  try {
    const data = await api<{ members: { id: number; name: string; phone: string | null }[] }>(
      `/api/orgs/${orgId.value}/members`,
      { query: { search: q, status: "active", limit: 10 } },
    );
    memberSearchResults.value = data.members;
  } catch {
    memberSearchResults.value = [];
  } finally {
    searchingMembers.value = false;
  }
}

function selectMember(m: { id: number; name: string }) {
  selectedMemberId.value = m.id;
  selectedMemberName.value = m.name;
  memberSearchQuery.value = "";
  memberSearchResults.value = [];
}

function clearSelectedMember() {
  selectedMemberId.value = null;
  selectedMemberName.value = "";
}

function openAssignForm() {
  showAssignForm.value = true;
  assignError.value = "";
  memberSearchQuery.value = "";
  memberSearchResults.value = [];
  clearSelectedMember();
}

async function handleAssignMember() {
  if (!selectedMemberId.value || !selectedSeat.value) return;

  assigningMember.value = true;
  assignError.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/members/${selectedMemberId.value}/seat-assignment`, {
      method: "POST",
      body: {
        seatId: selectedSeat.value.id,
        batchId: selectedBatchId.value || null,
      },
    });

    showAssignForm.value = false;
    showSeatModal.value = false;
    selectedSeat.value = null;
    await fetchSeats();
  } catch (error: any) {
    assignError.value = error?.data?.statusMessage || "Failed to assign member";
  } finally {
    assigningMember.value = false;
  }
}

// Format date time
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
