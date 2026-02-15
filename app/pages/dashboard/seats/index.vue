<template>
  <div class="p-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Library Seats</h1>
      <div class="flex gap-2">
        <AppButton size="sm" variant="secondary" @click="navigateTo('/dashboard/seats/manage')">
          Manage Seats
        </AppButton>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <AppStatCard
        label="Total Seats"
        :value="stats.total"
        icon="🪑"
      />
      <AppStatCard
        label="Occupied"
        :value="stats.occupied"
        icon="✓"
        color="green"
      />
      <AppStatCard
        label="Vacant"
        :value="stats.vacant"
        icon="○"
        color="slate"
      />
      <AppStatCard
        label="Male"
        :value="stats.maleOccupied"
        icon="♂"
        color="yellow"
      />
      <AppStatCard
        label="Female"
        :value="stats.femaleOccupied"
        icon="♀"
        color="pink"
      />
    </div>

    <!-- Filters -->
    <AppCard title="Filters">
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
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <SeatCard
          v-for="seat in seats"
          :key="seat.id"
          :seat="seat"
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
        <div v-else>
          <p class="text-sm text-slate-600">This seat is currently vacant</p>
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
            v-if="!selectedSeat.isOccupied"
            variant="primary"
            class="flex-1"
            @click="goToCheckIn"
          >
            Check In Member
          </AppButton>
          <AppButton
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
const statusFilter = ref("all");
const timeFilter = ref("all");
const genderFilter = ref("all");
const loading = ref(false);
const showSeatModal = ref(false);
const selectedSeat = ref<any>(null);
const checkingOut = ref(false);

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

const seats = ref<Seat[]>([]);
const stats = ref({
  total: 0,
  occupied: 0,
  vacant: 0,
  maleOccupied: 0,
  femaleOccupied: 0,
});

// Fetch seats
async function fetchSeats() {
  loading.value = true;
  try {
    const data = await api<{ seats: Seat[]; stats: any }>(`/api/orgs/${orgId.value}/seats`, {
      query: {
        status: statusFilter.value,
        timeFilter: timeFilter.value !== "all" ? timeFilter.value : undefined,
        genderFilter: genderFilter.value !== "all" ? genderFilter.value : undefined,
      },
    });
    seats.value = data.seats;
    stats.value = data.stats;
  } catch (error: any) {
    console.error("Failed to fetch seats:", error);
  } finally {
    loading.value = false;
  }
}

// Auto-refresh every 60 seconds
let refreshInterval: NodeJS.Timeout;
onMounted(() => {
  fetchSeats();
  refreshInterval = setInterval(fetchSeats, 60000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch filters
watch([statusFilter, timeFilter, genderFilter], () => {
  fetchSeats();
});

// Handle seat click
function handleSeatClick(seat: Seat) {
  selectedSeat.value = seat;
  showSeatModal.value = true;
}

// Go to check-in page
function goToCheckIn() {
  if (selectedSeat.value) {
    navigateTo(`/dashboard/check-ins?seatId=${selectedSeat.value.id}`);
  } else {
    navigateTo("/dashboard/check-ins");
  }
  showSeatModal.value = false;
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
    alert(error.statusMessage || "Failed to checkout");
  } finally {
    checkingOut.value = false;
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
