<template>
  <div class="p-4 space-y-6 max-w-2xl">
    <h1 class="text-xl font-bold text-gray-900">Settings</h1>

    <!-- Org Info -->
    <AppCard title="Organization">
      <form class="space-y-4" @submit.prevent="saveOrg">
        <AppInput v-model="orgForm.name" label="Business Name" required />
        <AppSelect
          v-model="orgForm.type"
          label="Business Type"
          :options="businessTypes"
        />
        <AppButton type="submit" size="sm" :loading="savingOrg">Save</AppButton>
      </form>
    </AppCard>

    <!-- Staff Management -->
    <AppCard title="Staff Members">
      <div class="space-y-3 mb-4">
        <div v-for="s in staff" :key="s.id" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ s.name }}</p>
            <p class="text-xs text-gray-500">{{ s.email }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge :color="s.role === 'owner' ? 'blue' : 'gray'">{{ s.role }}</AppBadge>
            <AppButton
              v-if="s.role !== 'owner' && isOwner"
              size="sm"
              variant="danger"
              @click="removeStaff(s.id)"
            >
              Remove
            </AppButton>
          </div>
        </div>
        <div v-if="staff.length === 0" class="text-sm text-gray-500">No staff added yet.</div>
      </div>

      <div v-if="isOwner">
        <h4 class="text-sm font-medium text-gray-700 mb-2">Add Staff</h4>
        <form class="flex gap-2" @submit.prevent="addStaff">
          <AppInput
            v-model="staffEmail"
            type="email"
            placeholder="staff@example.com"
            class="flex-1"
            required
          />
          <AppButton type="submit" size="sm" :loading="addingStaff">Add</AppButton>
        </form>
        <p v-if="staffError" class="mt-1 text-sm text-red-600">{{ staffError }}</p>
        <p v-if="staffSuccess" class="mt-1 text-sm text-green-600">{{ staffSuccess }}</p>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId, currentOrg } = useOrg();

const businessTypes = [
  { value: "gym", label: "Gym / Fitness Center" },
  { value: "library", label: "Library" },
  { value: "tuition", label: "Tuition / Coaching Center" },
  { value: "other", label: "Other" },
];

interface StaffMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: string;
}

const orgForm = reactive({ name: currentOrg.value?.name || "", type: currentOrg.value?.type || "" });
const savingOrg = ref(false);

const staffEmail = ref("");
const addingStaff = ref(false);
const staffError = ref("");
const staffSuccess = ref("");

const isOwner = computed(() => currentOrg.value?.role === "owner");

const { data: staffData, refresh: refreshStaff } = await useFetch<{ staff: StaffMember[] }>(
  () => `/api/orgs/${orgId.value}/staff`,
);
const staff = computed(() => staffData.value?.staff ?? []);

async function saveOrg() {
  savingOrg.value = true;
  await $fetch(`/api/orgs/${orgId.value}`, {
    method: "PUT",
    body: orgForm,
  });
  savingOrg.value = false;
}

async function addStaff() {
  staffError.value = "";
  staffSuccess.value = "";
  addingStaff.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/staff`, {
      method: "POST",
      body: { email: staffEmail.value },
    });
    staffSuccess.value = "Staff member added successfully";
    staffEmail.value = "";
    await refreshStaff();
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    staffError.value = err.data?.statusMessage || "Failed to add staff member";
  } finally {
    addingStaff.value = false;
  }
}

async function removeStaff(membershipId: number) {
  await $fetch(`/api/orgs/${orgId.value}/staff/${membershipId}`, {
    method: "DELETE",
  });
  await refreshStaff();
}
</script>
