<template>
  <AppModal :open="open" title="Add outlet" size="sm" @close="$emit('close')">
    <p class="mb-4 text-sm text-slate-600">
      Create another outlet/branch. It starts fresh with its own members, plans, and payments.
    </p>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <form class="space-y-4" @submit.prevent="handleCreate">
      <AppInput
        v-model="form.name"
        label="Outlet name"
        placeholder="e.g. FitZone — Andheri"
        required
      />
      <AppSelect
        v-model="form.type"
        label="Outlet type"
        :options="businessTypes"
        placeholder="Select type"
        required
      />
      <div class="flex gap-2 pt-2">
        <AppButton type="button" variant="secondary" class="flex-1" @click="$emit('close')">
          Cancel
        </AppButton>
        <AppButton type="submit" class="flex-1" :loading="loading">
          Create outlet
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; created: [] }>();

const { fetch: refreshSession } = useUserSession();

const form = reactive({ name: "", type: "" });
const error = ref("");
const loading = ref(false);

const businessTypes = [
  { value: "gym", label: "Gym / Fitness Center" },
  { value: "library", label: "Library" },
  { value: "tuition", label: "Tuition / Coaching Center" },
  { value: "other", label: "Other" },
];

async function handleCreate() {
  error.value = "";
  loading.value = true;
  try {
    // POST /api/orgs creates the org, owner membership, and switches the
    // session to the new outlet.
    await $fetch("/api/orgs", {
      method: "POST",
      body: { name: form.name, type: form.type },
    });
    await refreshSession();
    form.name = "";
    form.type = "";
    emit("created");
    navigateTo("/dashboard");
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to create outlet";
  } finally {
    loading.value = false;
  }
}
</script>
