<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800 mb-1">Choose an outlet</h1>
        <p class="text-sm text-slate-600">Pick which branch you want to manage</p>
      </div>

      <div v-if="loading" class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="n in 2"
          :key="n"
          class="h-20 rounded-xl border border-slate-200 bg-white animate-pulse"
        />
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="org in orgs"
          :key="org.orgId"
          class="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition-all hover:border-primary-400 hover:shadow-md disabled:opacity-50"
          :disabled="switching"
          @click="selectOutlet(org.orgId)"
        >
          <div class="min-w-0">
            <p class="truncate font-semibold text-slate-800">{{ org.name }}</p>
            <p class="text-xs capitalize text-slate-600">{{ org.type }}</p>
          </div>
          <span
            class="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
            :class="org.role === 'owner' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'"
          >{{ org.role === 'owner' ? 'Owner' : 'Staff' }}</span>
        </button>

        <button
          class="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-600 transition-all hover:border-primary-400 hover:text-primary-600"
          @click="addModalOpen = true"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add outlet
        </button>
      </div>

      <p v-if="error" class="mt-4 text-center text-sm text-danger-600">{{ error }}</p>
    </div>

    <AddOutletModal :open="addModalOpen" @close="addModalOpen = false" @created="addModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "auth" });

useSeoMeta({ robots: "noindex, nofollow" });

const { fetch: refreshSession } = useUserSession();

const orgs = ref<{ orgId: number; name: string; slug: string; type: string; role: string }[]>([]);
const loading = ref(true);
const switching = ref(false);
const error = ref("");
const addModalOpen = ref(false);

async function loadOutlets() {
  loading.value = true;
  try {
    const res = await $fetch("/api/orgs");
    orgs.value = res.orgs;
    // One outlet only — skip the picker.
    if (orgs.value.length === 1) {
      await selectOutlet(orgs.value[0]!.orgId);
    }
    else if (orgs.value.length === 0) {
      navigateTo("/onboarding");
    }
  }
  catch {
    error.value = "Failed to load outlets";
  }
  finally {
    loading.value = false;
  }
}

async function selectOutlet(orgId: number) {
  switching.value = true;
  error.value = "";
  try {
    await $fetch("/api/orgs/switch", { method: "POST", body: { orgId } });
    await refreshSession();
    navigateTo("/dashboard");
  }
  catch {
    error.value = "Failed to open outlet";
    switching.value = false;
  }
}

onMounted(loadOutlets);
</script>
