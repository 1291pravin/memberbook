<template>
  <div class="p-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-800">Manage Seats</h1>
        <p class="text-sm text-slate-600 mt-1">Create, edit, and organize library seats</p>
      </div>
      <div class="flex gap-2">
        <AppButton size="sm" variant="secondary" @click="showBulkModal = true">
          Bulk Add Seats
        </AppButton>
        <AppButton size="sm" @click="openAddModal">
          Add Seat
        </AppButton>
      </div>
    </div>

    <!-- Seats Table -->
    <AppCard title="All Seats">
      <div v-if="loading" class="text-center py-8">
        <p class="text-sm text-slate-600">Loading seats...</p>
      </div>
      <div v-else-if="seats.length === 0" class="text-center py-8">
        <AppEmptyState
          title="No seats found"
          description="Click 'Add Seat' or 'Bulk Add Seats' to create seats"
        />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200">
            <tr class="text-left">
              <th class="pb-2 font-medium text-slate-600">Seat Number</th>
              <th class="pb-2 font-medium text-slate-600">Label</th>
              <th class="pb-2 font-medium text-slate-600">Time</th>
              <th class="pb-2 font-medium text-slate-600">Gender</th>
              <th class="pb-2 font-medium text-slate-600">Order</th>
              <th class="pb-2 font-medium text-slate-600">Status</th>
              <th class="pb-2 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="seat in seats" :key="seat.id">
              <td class="py-3 font-medium text-slate-800">{{ seat.seatNumber }}</td>
              <td class="py-3 text-slate-600">{{ seat.seatLabel || '-' }}</td>
              <td class="py-3 text-slate-600 capitalize">{{ seat.timePreference || '-' }}</td>
              <td class="py-3 text-slate-600 capitalize">{{ seat.genderPreference || '-' }}</td>
              <td class="py-3 text-slate-600">{{ seat.displayOrder }}</td>
              <td class="py-3">
                <AppBadge v-if="seat.isOccupied" color="green">Occupied</AppBadge>
                <AppBadge v-else color="slate">Vacant</AppBadge>
              </td>
              <td class="py-3">
                <div class="flex gap-2">
                  <button
                    class="text-primary-600 hover:text-primary-500 text-xs font-medium"
                    @click="openEditModal(seat)"
                  >
                    Edit
                  </button>
                  <button
                    class="text-red-600 hover:text-red-500 text-xs font-medium"
                    @click="confirmDelete(seat)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- Add/Edit Seat Modal -->
    <AppModal :open="showSeatModal" @close="showSeatModal = false" :title="editMode ? 'Edit Seat' : 'Add Seat'">
      <form @submit.prevent="saveSeat" class="space-y-4">
        <AppInput
          v-model="seatForm.seatNumber"
          label="Seat Number"
          placeholder="e.g., TDL-1"
          required
        />
        <AppInput
          v-model="seatForm.seatLabel"
          label="Seat Label (Optional)"
          placeholder="e.g., Window seat"
        />
        <AppSelect
          v-model="seatForm.timePreference"
          label="Time Preference"
          :options="[
            { value: '', label: 'None' },
            { value: 'day', label: 'Day' },
            { value: 'evening', label: 'Evening' },
            { value: 'flexible', label: 'Flexible' },
            { value: 'all-day', label: 'All Day' },
          ]"
        />
        <AppSelect
          v-model="seatForm.genderPreference"
          label="Gender Preference"
          :options="[
            { value: '', label: 'None' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'any', label: 'Any' },
          ]"
        />
        <AppInput
          v-model.number="seatForm.displayOrder"
          type="number"
          label="Display Order"
          placeholder="e.g., 1"
        />
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            v-model="seatForm.notes"
            rows="2"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Optional notes about this seat"
          />
        </div>

        <!-- Error -->
        <div v-if="seatError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ seatError }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <AppButton type="submit" class="flex-1" :loading="saving">
            {{ editMode ? 'Update' : 'Create' }}
          </AppButton>
          <AppButton type="button" variant="secondary" class="flex-1" @click="showSeatModal = false">
            Cancel
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Bulk Add Modal -->
    <AppModal :open="showBulkModal" @close="showBulkModal = false" title="Bulk Add Seats">
      <form @submit.prevent="bulkCreateSeats" class="space-y-4">
        <AppInput
          v-model="bulkForm.prefix"
          label="Seat Number Prefix"
          placeholder="e.g., TDL-"
          required
        />
        <div class="grid grid-cols-2 gap-3">
          <AppInput
            v-model.number="bulkForm.startNumber"
            type="number"
            label="Start Number"
            placeholder="e.g., 1"
            required
          />
          <AppInput
            v-model.number="bulkForm.endNumber"
            type="number"
            label="End Number"
            placeholder="e.g., 25"
            required
          />
        </div>
        <AppSelect
          v-model="bulkForm.timePreference"
          label="Time Preference (Applied to All)"
          :options="[
            { value: '', label: 'None' },
            { value: 'day', label: 'Day' },
            { value: 'evening', label: 'Evening' },
            { value: 'flexible', label: 'Flexible' },
            { value: 'all-day', label: 'All Day' },
          ]"
        />
        <AppSelect
          v-model="bulkForm.genderPreference"
          label="Gender Preference (Applied to All)"
          :options="[
            { value: '', label: 'None' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'any', label: 'Any' },
          ]"
        />

        <!-- Preview -->
        <div v-if="bulkPreview" class="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p class="text-sm text-slate-700">
            This will create <strong>{{ bulkPreview.count }}</strong> seats:
            {{ bulkPreview.example }}
          </p>
        </div>

        <!-- Error -->
        <div v-if="bulkError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ bulkError }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <AppButton type="submit" class="flex-1" :loading="bulkCreating">
            Create {{ bulkPreview?.count || 0 }} Seats
          </AppButton>
          <AppButton type="button" variant="secondary" class="flex-1" @click="showBulkModal = false">
            Cancel
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppModal :open="showDeleteModal" @close="showDeleteModal = false" title="Delete Seat">
      <div class="space-y-4">
        <p class="text-sm text-slate-700">
          Are you sure you want to delete seat <strong>{{ seatToDelete?.seatNumber }}</strong>?
        </p>
        <p class="text-xs text-slate-600">
          This action cannot be undone. The seat will be marked as inactive.
        </p>

        <!-- Error -->
        <div v-if="deleteError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ deleteError }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <AppButton variant="danger" class="flex-1" :loading="deleting" @click="deleteSeat">
            Delete
          </AppButton>
          <AppButton variant="secondary" class="flex-1" @click="showDeleteModal = false">
            Cancel
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
const loading = ref(false);
const seats = ref<any[]>([]);

// Add/Edit Modal
const showSeatModal = ref(false);
const editMode = ref(false);
const saving = ref(false);
const seatError = ref("");
const seatForm = ref({
  id: null as number | null,
  seatNumber: "",
  seatLabel: "",
  timePreference: "",
  genderPreference: "",
  displayOrder: 1,
  notes: "",
});

// Bulk Add Modal
const showBulkModal = ref(false);
const bulkCreating = ref(false);
const bulkError = ref("");
const bulkForm = ref({
  prefix: "",
  startNumber: 1,
  endNumber: 10,
  timePreference: "",
  genderPreference: "",
});

// Delete Modal
const showDeleteModal = ref(false);
const deleting = ref(false);
const deleteError = ref("");
const seatToDelete = ref<any>(null);

// Fetch seats
async function fetchSeats() {
  loading.value = true;
  try {
    const data = await api<{ seats: any[]; stats: any }>(`/api/orgs/${orgId.value}/seats`, {
      query: { status: "all" },
    });
    seats.value = data.seats;
  } catch (error: any) {
    console.error("Failed to fetch seats:", error);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchSeats);

// Open add modal
function openAddModal() {
  editMode.value = false;
  seatForm.value = {
    id: null,
    seatNumber: "",
    seatLabel: "",
    timePreference: "",
    genderPreference: "",
    displayOrder: seats.value.length + 1,
    notes: "",
  };
  seatError.value = "";
  showSeatModal.value = true;
}

// Open edit modal
function openEditModal(seat: any) {
  editMode.value = true;
  seatForm.value = {
    id: seat.id,
    seatNumber: seat.seatNumber,
    seatLabel: seat.seatLabel || "",
    timePreference: seat.timePreference || "",
    genderPreference: seat.genderPreference || "",
    displayOrder: seat.displayOrder,
    notes: seat.notes || "",
  };
  seatError.value = "";
  showSeatModal.value = true;
}

// Save seat (create or update)
async function saveSeat() {
  seatError.value = "";
  saving.value = true;

  try {
    if (editMode.value && seatForm.value.id) {
      // Update
      await api(`/api/orgs/${orgId.value}/seats/${seatForm.value.id}`, {
        method: "PUT",
        body: seatForm.value,
      });
    } else {
      // Create
      await api(`/api/orgs/${orgId.value}/seats`, {
        method: "POST",
        body: seatForm.value,
      });
    }

    showSeatModal.value = false;
    await fetchSeats();
  } catch (error: any) {
    seatError.value = error.data?.message || error.message || "Failed to save seat";
  } finally {
    saving.value = false;
  }
}

// Bulk preview
const bulkPreview = computed(() => {
  if (!bulkForm.value.prefix || !bulkForm.value.startNumber || !bulkForm.value.endNumber) {
    return null;
  }

  const count = bulkForm.value.endNumber - bulkForm.value.startNumber + 1;
  if (count <= 0) return null;

  const start = bulkForm.value.prefix + bulkForm.value.startNumber;
  const end = bulkForm.value.prefix + bulkForm.value.endNumber;
  const example = count <= 3
    ? Array.from({ length: count }, (_, i) => bulkForm.value.prefix + (bulkForm.value.startNumber + i)).join(", ")
    : `${start}, ${bulkForm.value.prefix}${bulkForm.value.startNumber + 1}, ..., ${end}`;

  return { count, example };
});

// Bulk create seats
async function bulkCreateSeats() {
  bulkError.value = "";
  bulkCreating.value = true;

  try {
    await api(`/api/orgs/${orgId.value}/seats/bulk`, {
      method: "POST",
      body: bulkForm.value,
    });

    showBulkModal.value = false;
    await fetchSeats();
  } catch (error: any) {
    bulkError.value = error.data?.message || error.message || "Failed to create seats";
  } finally {
    bulkCreating.value = false;
  }
}

// Confirm delete
function confirmDelete(seat: any) {
  seatToDelete.value = seat;
  deleteError.value = "";
  showDeleteModal.value = true;
}

// Delete seat
async function deleteSeat() {
  if (!seatToDelete.value) return;

  deleteError.value = "";
  deleting.value = true;

  try {
    await api(`/api/orgs/${orgId.value}/seats/${seatToDelete.value.id}`, {
      method: "DELETE",
    });

    showDeleteModal.value = false;
    await fetchSeats();
  } catch (error: any) {
    deleteError.value = error.data?.message || error.message || "Failed to delete seat";
  } finally {
    deleting.value = false;
  }
}
</script>
