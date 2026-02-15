<template>
  <div class="p-4 space-y-6">
    <h1 class="text-xl font-bold text-slate-800">Check-Ins</h1>

    <!-- Check In a Member -->
    <AppCard title="Check In a Member">
      <div class="space-y-3">
        <AppSearchBar
          v-model="memberSearch"
          placeholder="Search member by name or phone..."
        />
        <!-- Search Results -->
        <div v-if="memberSearch && searchResults.length > 0" class="border border-slate-200 rounded-lg divide-y divide-slate-100">
          <div
            v-for="m in searchResults"
            :key="m.id"
            class="flex items-center justify-between px-3 py-2"
          >
            <div>
              <p class="text-sm font-medium text-slate-800">{{ m.name }}</p>
              <p class="text-xs text-slate-600">{{ m.phone || 'No phone' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <AppBadge :color="subStatusColor(m.subscriptionStatus)">
                {{ m.subscriptionStatus || 'no plan' }}
              </AppBadge>
              <AppButton size="sm" @click="openSeatSelector(m)">
                Check In
              </AppButton>
            </div>
          </div>
        </div>
        <p v-else-if="memberSearch && !searchLoading" class="text-sm text-slate-600">No members found</p>
      </div>

      <!-- Warning Banner -->
      <div v-if="warningMessage" class="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <p class="text-sm text-amber-700">{{ warningMessage }}</p>
        <button class="text-amber-500 hover:text-amber-700 text-sm font-medium" @click="warningMessage = ''">Dismiss</button>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMessage" class="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <p class="text-sm text-red-700">{{ errorMessage }}</p>
        <button class="text-red-500 hover:text-red-700 text-sm font-medium" @click="errorMessage = ''">Dismiss</button>
      </div>
    </AppCard>

    <!-- Currently Checked In -->
    <AppCard title="Currently Checked In">
      <!-- Auto-checkout banner for owners -->
      <div v-if="isOwner && staleCount > 0" class="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <p class="text-sm text-amber-700">{{ staleCount }} check-in(s) older than 24 hours</p>
        <AppButton size="sm" variant="secondary" :loading="autoCheckingOut" @click="autoCheckout">
          Auto Check-Out All
        </AppButton>
      </div>

      <div v-if="activeCheckIns.length > 0" class="space-y-3">
        <div
          v-for="ci in activeCheckIns"
          :key="ci.id"
          class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
        >
          <div>
            <div class="flex items-center gap-2">
              <NuxtLink :to="`/dashboard/members/${ci.memberId}`" class="text-sm font-medium text-primary-600 hover:text-primary-500">
                {{ ci.memberName }}
              </NuxtLink>
              <span v-if="ci.seatNumber" class="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                🪑 {{ ci.seatNumber }}
              </span>
            </div>
            <p class="text-xs text-slate-600">{{ ci.memberPhone || 'No phone' }}</p>
            <p class="text-xs text-slate-600">Checked in {{ formatDateTime(ci.checkedInAt) }}</p>
            <p class="text-xs font-medium text-slate-600">{{ liveDuration(ci.checkedInAt) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge :color="subStatusColor(ci.subscriptionStatus)">
              {{ ci.subscriptionStatus }}
            </AppBadge>
            <AppButton size="sm" variant="secondary" :loading="checkingOutId === ci.id" @click="checkOut(ci.id)">
              Check Out
            </AppButton>
          </div>
        </div>
      </div>
      <AppEmptyState
        v-else
        title="No active check-ins"
        description="Search for a member above to check them in"
      />
    </AppCard>

    <!-- Link to history -->
    <div class="text-center">
      <NuxtLink to="/dashboard/check-ins/history" class="text-sm text-primary-600 hover:text-primary-500">
        View Check-In History &rarr;
      </NuxtLink>
    </div>

    <!-- Seat Selection Modal -->
    <AppModal :open="showSeatModal" :title="`Check In: ${selectedMember?.name}`" @close="closeSeatModal">
      <div v-if="selectedMember" class="space-y-4">
        <!-- Member Info -->
        <div class="bg-slate-50 rounded-lg p-3">
          <p class="text-sm font-medium text-slate-800">{{ selectedMember.name }}</p>
          <p class="text-xs text-slate-600">{{ selectedMember.phone || 'No phone' }}</p>
          <div class="mt-2">
            <AppBadge :color="subStatusColor(selectedMember.subscriptionStatus)">
              {{ selectedMember.subscriptionStatus || 'no plan' }}
            </AppBadge>
          </div>
        </div>

        <!-- Default Seat Info -->
        <div v-if="memberDefaultSeat" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-xs font-medium text-blue-800 mb-1">Default Seat Assigned</p>
          <p class="text-sm text-blue-700">
            Seat {{ memberDefaultSeat.seatNumber }}
            <span v-if="memberDefaultSeat.seatLabel" class="text-xs">({{ memberDefaultSeat.seatLabel }})</span>
          </p>
          <p class="text-xs text-blue-600 mt-1">
            This seat will be used if you don't select a different one
          </p>
        </div>

        <!-- Seat Selection -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-slate-700">Select a Seat (Optional)</h3>
            <button
              v-if="selectedSeatId"
              class="text-xs text-slate-600 hover:text-slate-700"
              @click="selectedSeatId = null"
            >
              Clear Selection
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loadingSeats" class="text-center py-8">
            <p class="text-sm text-slate-600">Loading available seats...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="availableSeats.length === 0" class="text-center py-8">
            <p class="text-sm text-slate-600">No seats available</p>
          </div>

          <!-- Seat Grid -->
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            <div
              v-for="seat in availableSeats"
              :key="seat.id"
              :class="[
                'relative rounded-lg border p-3 cursor-pointer transition-all',
                selectedSeatId === seat.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : seat.isOccupied
                    ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm',
              ]"
              @click="selectSeat(seat)"
            >
              <!-- Selected Indicator -->
              <div
                v-if="selectedSeatId === seat.id"
                class="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
              >
                <span class="text-white text-xs">✓</span>
              </div>

              <!-- Seat Number -->
              <div class="text-lg font-bold text-slate-800 mb-1">
                {{ seat.seatNumber }}
              </div>

              <!-- Seat Label -->
              <div v-if="seat.seatLabel" class="text-xs text-slate-600 mb-1">
                {{ seat.seatLabel }}
              </div>

              <!-- Status -->
              <div class="text-xs" :class="seat.isOccupied ? 'text-red-600' : 'text-green-600'">
                {{ seat.isOccupied ? 'Occupied' : 'Vacant' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4 border-t border-slate-200">
          <AppButton
            variant="secondary"
            class="flex-1"
            @click="closeSeatModal"
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            class="flex-1"
            :loading="checkingInId === selectedMember.id"
            @click="confirmCheckIn"
          >
            {{ selectedSeatId ? 'Check In with Seat' : 'Check In (No Seat)' }}
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const route = useRoute();
const { orgId, currentOrg } = useOrg();
const { formatDate } = useFormatDate();
const isOwner = computed(() => currentOrg.value?.role === "owner");

// Check for pre-selected seat from query params
const preSelectedSeatId = computed(() => {
  const seatId = route.query.seatId;
  return seatId ? Number(seatId) : null;
});

interface SearchMember {
  id: number;
  name: string;
  phone: string | null;
  subscriptionStatus: string | null;
}

interface CheckIn {
  id: number;
  memberId: number;
  memberName: string;
  memberPhone: string | null;
  checkedInAt: string;
  checkedOutAt: string | null;
  durationMinutes: number | null;
  autoCheckedOut: boolean;
  subscriptionStatus: string;
  notes: string | null;
  seatId: number | null;
  seatNumber: string | null;
}

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
}

const memberSearch = ref("");
const searchResults = ref<SearchMember[]>([]);
const searchLoading = ref(false);
const checkingInId = ref<number | null>(null);
const checkingOutId = ref<number | null>(null);
const autoCheckingOut = ref(false);
const warningMessage = ref("");
const errorMessage = ref("");
const cacheVersion = ref(Date.now());

// Seat selection state
const showSeatModal = ref(false);
const selectedMember = ref<SearchMember | null>(null);
const selectedSeatId = ref<number | null>(null);
const availableSeats = ref<Seat[]>([]);
const loadingSeats = ref(false);
const memberDefaultSeat = ref<Seat | null>(null);

// Debounced member search
let searchTimeout: ReturnType<typeof setTimeout>;
watch(memberSearch, (val) => {
  clearTimeout(searchTimeout);
  if (!val || val.length < 2) {
    searchResults.value = [];
    return;
  }
  searchTimeout = setTimeout(async () => {
    searchLoading.value = true;
    try {
      const data = await $fetch<{ members: SearchMember[] }>(
        `/api/orgs/${orgId.value}/members`,
        { query: { search: val, limit: 5 } },
      );
      searchResults.value = data.members;
    } catch {
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }, 300);
});

// Fetch active check-ins
const { data: activeData, refresh: refreshActive } = await useFetch<{ checkIns: CheckIn[] }>(
  `/api/orgs/${orgId.value}/check-ins`,
  { query: computed(() => ({ status: "active", _v: cacheVersion.value })) },
);
const activeCheckIns = computed(() => activeData.value?.checkIns ?? []);

const staleCount = computed(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return activeCheckIns.value.filter(ci => new Date(ci.checkedInAt).getTime() < cutoff).length;
});

// Live duration ticker
const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval>;
onMounted(() => {
  ticker = setInterval(() => { now.value = Date.now(); }, 60000);
});
onUnmounted(() => clearInterval(ticker));

function liveDuration(checkedInAt: string): string {
  const ms = now.value - new Date(checkedInAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

type BadgeColor = "green" | "red" | "yellow" | "blue" | "gray";
function subStatusColor(status: string | null): BadgeColor {
  if (status === "active") return "green";
  if (status === "expired") return "red";
  if (status === "inactive") return "gray";
  return "yellow";
}

// Open seat selector modal
async function openSeatSelector(member: SearchMember) {
  selectedMember.value = member;
  selectedSeatId.value = preSelectedSeatId.value;
  memberDefaultSeat.value = null;
  showSeatModal.value = true;

  // Fetch available seats
  loadingSeats.value = true;
  try {
    const data = await $fetch<{ seats: Seat[] }>(
      `/api/orgs/${orgId.value}/seats`,
      { query: { status: "all" } }
    );
    availableSeats.value = data.seats;

    // Fetch member's default seat assignment
    try {
      const response = await $fetch<{ assignment: { seatId: number; seat: { seatNumber: string; seatLabel?: string | null } } | null }>(
        `/api/orgs/${orgId.value}/members/${member.id}/seat-assignment`
      );
      if (response.assignment && response.assignment.seatId) {
        // Find the seat in available seats
        const defaultSeat = availableSeats.value.find(s => s.id === response.assignment!.seatId);
        if (defaultSeat) {
          memberDefaultSeat.value = defaultSeat;
        }
      }
    } catch {
      // No default seat or error fetching - that's okay
    }

    // If no pre-selected seat from query and no selection made yet, auto-select default
    if (!preSelectedSeatId.value && !selectedSeatId.value && memberDefaultSeat.value) {
      selectedSeatId.value = memberDefaultSeat.value.id;
    }
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to load seats";
  } finally {
    loadingSeats.value = false;
  }
}

// Close seat modal
function closeSeatModal() {
  showSeatModal.value = false;
  selectedMember.value = null;
  selectedSeatId.value = null;
  availableSeats.value = [];
  memberDefaultSeat.value = null;
}

// Select a seat
function selectSeat(seat: Seat) {
  if (seat.isOccupied) {
    return; // Can't select occupied seats
  }
  selectedSeatId.value = seat.id;
}

// Confirm check-in with selected seat
async function confirmCheckIn() {
  if (!selectedMember.value) return;

  checkingInId.value = selectedMember.value.id;
  errorMessage.value = "";
  warningMessage.value = "";

  try {
    const data = await $fetch<{ checkIn: CheckIn; warning: string }>(
      `/api/orgs/${orgId.value}/check-ins`,
      {
        method: "POST",
        body: {
          memberId: selectedMember.value.id,
          seatId: selectedSeatId.value || undefined
        }
      },
    );
    if (data.warning) {
      warningMessage.value = data.warning;
    }
    memberSearch.value = "";
    searchResults.value = [];
    cacheVersion.value = Date.now();
    await refreshActive();
    closeSeatModal();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to check in";
  } finally {
    checkingInId.value = null;
  }
}

async function checkOut(checkInId: number) {
  checkingOutId.value = checkInId;
  errorMessage.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/check-ins/${checkInId}`, { method: "PUT" });
    cacheVersion.value = Date.now();
    await refreshActive();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to check out";
  } finally {
    checkingOutId.value = null;
  }
}

async function autoCheckout() {
  autoCheckingOut.value = true;
  errorMessage.value = "";
  try {
    const data = await $fetch<{ checkedOutCount: number }>(
      `/api/orgs/${orgId.value}/check-ins/auto-checkout`,
      { method: "POST" },
    );
    warningMessage.value = `Auto checked out ${data.checkedOutCount} member(s)`;
    cacheVersion.value = Date.now();
    await refreshActive();
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string };
    errorMessage.value = e.data?.statusMessage || e.message || "Failed to auto check-out";
  } finally {
    autoCheckingOut.value = false;
  }
}
</script>
