<template>
  <div class="flex min-h-[80vh] items-center justify-center px-4 py-10">
    <div class="w-full max-w-xl">
      <SignupSteps :current="2" />
      <div class="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8">
        <h1 class="text-center text-3xl font-extrabold tracking-tight text-slate-800">What do you run?</h1>
        <p class="mt-2 text-center text-slate-600">Pick one. You can change it later.</p>

        <div v-if="error" class="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
          {{ error }}
        </div>

        <form class="mt-6 space-y-6" @submit.prevent="handleCreate">
          <fieldset>
            <legend class="sr-only">Business type</legend>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label
                v-for="b in businessTypes"
                :key="b.value"
                class="flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 p-4 text-center transition-colors"
                :class="form.type === b.value ? 'border-primary-600 bg-primary-50' : 'border-slate-200 hover:border-slate-300'"
              >
                <input v-model="form.type" type="radio" name="type" :value="b.value" class="sr-only" required>
                <span class="flex h-12 w-12 items-center justify-center rounded-full" :class="form.type === b.value ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path :d="b.icon" /></svg>
                </span>
                <span class="text-sm font-bold text-slate-800">{{ b.label }}</span>
              </label>
            </div>
          </fieldset>

          <AppInput
            id="business-name"
            v-model="form.name"
            label="Business name"
            :placeholder="namePlaceholder"
            required
          />

          <div>
            <AppInput
              id="owner-whatsapp"
              v-model="form.ownerWhatsapp"
              type="tel"
              label="Your WhatsApp number"
              placeholder="98765 43210"
            />
            <p class="mt-1.5 text-sm text-slate-600">We'll message you here when your setup is ready, and if we have a question about your list.</p>
          </div>

          <AppButton type="submit" size="lg" class="w-full" :loading="loading" :disabled="!form.type">
            Continue
          </AppButton>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "auth" });

useSeoMeta({ robots: "noindex, nofollow" });

const { fetch: refreshSession } = useUserSession();

const form = reactive({ name: "", type: "", ownerWhatsapp: "" });
const error = ref("");
const loading = ref(false);
const { trackFunnelStep } = useAnalytics();

// New Google sign-ups land here with ?signup=google (email sign-ups are tracked on /register).
const route = useRoute();
onMounted(() => {
  if (route.query.signup === "google") {
    trackFunnelStep("registration_success", { method: "google" });
    navigateTo({ query: {} }, { replace: true });
  }
});

const businessTypes = [
  { value: "gym", label: "Gym or fitness", icon: "M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" },
  { value: "library", label: "Library or study room", icon: "M4 19.5V5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zm0 0A2 2 0 006 22h13" },
  { value: "tuition", label: "Coaching or tuition", icon: "M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" },
  { value: "clinic", label: "Clinic or physio", icon: "M12 4v16M4 12h16" },
  { value: "studio", label: "Yoga, dance or classes", icon: "M12 5a2 2 0 100-4 2 2 0 000 4zM12 7v6M8 21l4-8 4 8M6 10l6-3 6 3" },
  { value: "other", label: "Something else", icon: "M5 12h.01M12 12h.01M19 12h.01" },
];

const namePlaceholder = computed(() => ({
  gym: "e.g. FitZone Gym",
  library: "e.g. Saraswati Study Library",
  tuition: "e.g. Bright Minds Classes",
  clinic: "e.g. Care Physio Clinic",
  studio: "e.g. Nritya Dance Studio",
}[form.type] ?? "Your business name"));

async function handleCreate() {
  error.value = "";
  loading.value = true;
  try {
    const res = await $fetch<{ org: { id: number, type: string } }>("/api/orgs", {
      method: "POST",
      // The service is done for you over WhatsApp, so a number they give is consent to be contacted.
      body: { ...form, setupHelpConsent: Boolean(form.ownerWhatsapp.trim()) },
    });
    trackFunnelStep("organization_created", {
      org_id: res.org.id,
      business_type: res.org.type,
    });
    await refreshSession();
    navigateTo("/onboarding/wizard/upload");
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to create workspace";
  } finally {
    loading.value = false;
  }
}
</script>
