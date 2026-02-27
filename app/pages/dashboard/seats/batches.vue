<template>
  <div class="p-4 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink to="/dashboard/seats" class="text-sm text-primary-600 hover:text-primary-500">&larr; Back to Seats</NuxtLink>
        <h1 class="text-xl font-bold text-slate-800 mt-1">Manage Batches</h1>
        <p class="text-sm text-slate-600 mt-1">Configure time-based batches for seat assignments</p>
      </div>
      <AppButton size="sm" @click="openAddModal">
        Add Batch
      </AppButton>
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <p class="text-sm text-red-700">{{ errorMessage }}</p>
      <button class="text-red-500 hover:text-red-700 text-sm font-medium" @click="errorMessage = ''">Dismiss</button>
    </div>

    <!-- Batches Table -->
    <AppCard title="All Batches">
      <div v-if="loading" class="text-center py-8">
        <p class="text-sm text-slate-600">Loading batches...</p>
      </div>
      <div v-else-if="batches.length === 0" class="text-center py-8">
        <AppEmptyState
          title="No batches configured"
          description="Create batches like Morning, Afternoon, Evening to manage seat assignments by time slot"
        />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b border-slate-200">
            <tr class="text-left">
              <th class="pb-2 font-medium text-slate-600">Name</th>
              <th class="pb-2 font-medium text-slate-600">Time</th>
              <th class="pb-2 font-medium text-slate-600">Order</th>
              <th class="pb-2 font-medium text-slate-600">Status</th>
              <th class="pb-2 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="batch in batches" :key="batch.id">
              <td class="py-3 font-medium text-slate-800">{{ batch.name }}</td>
              <td class="py-3 text-slate-600">
                <span v-if="batch.startTime || batch.endTime">
                  {{ batch.startTime || '?' }} - {{ batch.endTime || '?' }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="py-3 text-slate-600">{{ batch.displayOrder }}</td>
              <td class="py-3">
                <AppBadge :color="batch.isActive ? 'green' : 'gray'">
                  {{ batch.isActive ? 'Active' : 'Inactive' }}
                </AppBadge>
              </td>
              <td class="py-3">
                <div class="flex gap-2">
                  <button
                    class="text-primary-600 hover:text-primary-500 text-xs font-medium"
                    @click="openEditModal(batch)"
                  >
                    Edit
                  </button>
                  <button
                    v-if="batch.isActive"
                    class="text-red-600 hover:text-red-500 text-xs font-medium"
                    @click="deactivateBatch(batch)"
                  >
                    Deactivate
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- Add/Edit Batch Modal -->
    <AppModal :open="showModal" @close="showModal = false" :title="editMode ? 'Edit Batch' : 'Add Batch'">
      <form @submit.prevent="saveBatch" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Batch Name"
          placeholder="e.g., Morning, Afternoon, Evening"
          required
        />
        <div class="grid grid-cols-2 gap-3">
          <AppInput
            v-model="form.startTime"
            label="Start Time (Optional)"
            type="time"
          />
          <AppInput
            v-model="form.endTime"
            label="End Time (Optional)"
            type="time"
          />
        </div>
        <AppInput
          v-model.number="form.displayOrder"
          type="number"
          label="Display Order"
          placeholder="e.g., 1"
        />

        <!-- Error -->
        <div v-if="formError" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <AppButton type="submit" class="flex-1" :loading="saving">
            {{ editMode ? 'Update' : 'Create' }}
          </AppButton>
          <AppButton type="button" variant="secondary" class="flex-1" @click="showModal = false">
            Cancel
          </AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const { api } = useApi();

interface Batch {
  id: number;
  name: string;
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  displayOrder: number;
}

const loading = ref(false);
const batches = ref<Batch[]>([]);
const errorMessage = ref("");

// Modal state
const showModal = ref(false);
const editMode = ref(false);
const saving = ref(false);
const formError = ref("");
const form = ref({
  id: null as number | null,
  name: "",
  startTime: "",
  endTime: "",
  displayOrder: 1,
});

async function fetchBatches() {
  loading.value = true;
  try {
    const data = await api<{ batches: Batch[] }>(`/api/orgs/${orgId.value}/seat-batches`);
    batches.value = data.batches;
  } catch {
    errorMessage.value = "Failed to load batches";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchBatches);

function openAddModal() {
  editMode.value = false;
  form.value = {
    id: null,
    name: "",
    startTime: "",
    endTime: "",
    displayOrder: batches.value.length + 1,
  };
  formError.value = "";
  showModal.value = true;
}

function openEditModal(batch: Batch) {
  editMode.value = true;
  form.value = {
    id: batch.id,
    name: batch.name,
    startTime: batch.startTime || "",
    endTime: batch.endTime || "",
    displayOrder: batch.displayOrder,
  };
  formError.value = "";
  showModal.value = true;
}

async function saveBatch() {
  formError.value = "";
  saving.value = true;

  try {
    if (editMode.value && form.value.id) {
      await api(`/api/orgs/${orgId.value}/seat-batches/${form.value.id}`, {
        method: "PUT",
        body: form.value,
      });
    } else {
      await api(`/api/orgs/${orgId.value}/seat-batches`, {
        method: "POST",
        body: form.value,
      });
    }

    showModal.value = false;
    await fetchBatches();
  } catch (error: any) {
    formError.value = error.data?.statusMessage || error.message || "Failed to save batch";
  } finally {
    saving.value = false;
  }
}

async function deactivateBatch(batch: Batch) {
  errorMessage.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/seat-batches/${batch.id}`, {
      method: "DELETE",
    });
    await fetchBatches();
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || error.message || "Failed to deactivate batch";
  }
}
</script>
