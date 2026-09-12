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
        <AppInput
          id="owner-whatsapp"
          v-model="form.ownerWhatsapp"
          type="tel"
          label="Owner WhatsApp number (optional)"
          placeholder="+91 98765 43210"
        />
        <p class="text-sm text-slate-600">
          Include your country code. Indian 10-digit numbers use +91 automatically.
          You can leave this blank.
        </p>
        <label class="flex items-start gap-3 text-sm text-slate-700">
          <input v-model="form.setupHelpConsent" type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-primary-600">
          <span>You can contact me on WhatsApp to help set up MemberBook.</span>
        </label>
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

const form = reactive({ name: "", type: "", ownerWhatsapp: "", setupHelpConsent: false });
const error = ref("");
const loading = ref(false);
const { trackFunnelStep } = useAnalytics();

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
    const res = await $fetch<{ org: { id: number, type: string } }>("/api/orgs", {
      method: "POST",
      body: { ...form },
    });
    trackFunnelStep("organization_created", {
      org_id: res.org.id,
      business_type: res.org.type,
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
