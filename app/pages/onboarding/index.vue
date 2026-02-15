<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-slate-800 text-center mb-2">Set up your workspace</h1>
      <p class="text-center text-sm text-slate-600 mb-8">Tell us about your business</p>

      <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {{ error }}
      </div>

      <form class="space-y-4" @submit.prevent="handleCreate">
        <AppInput
          v-model="form.name"
          label="Business Name"
          placeholder="e.g. FitZone Gym"
          required
        />
        <AppSelect
          v-model="form.type"
          label="Business Type"
          :options="businessTypes"
          placeholder="Select type"
          required
        />
        <AppButton type="submit" class="w-full" :loading="loading">
          Create Workspace
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "auth" });

// Prevent indexing of onboarding page
useSeoMeta({
  robots: "noindex, nofollow",
});

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
    await $fetch("/api/orgs", {
      method: "POST",
      body: { name: form.name, type: form.type },
    });
    await refreshSession();
    navigateTo("/onboarding/wizard/staff");
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to create workspace";
  } finally {
    loading.value = false;
  }
}
</script>
