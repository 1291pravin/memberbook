<template>
  <AppCard class="!bg-accent-50">
    <p class="text-base font-semibold text-slate-800">{{ title }}</p>
    <p class="mt-1 text-sm text-slate-600">It's part of the Free plan.</p>
    <AppButton v-if="isOwner" class="mt-3" size="sm" :loading="busy" @click="switchOn">Switch it on</AppButton>
    <p v-else class="mt-2 text-sm text-slate-600">Ask the owner to switch this on.</p>
    <p v-if="error" class="mt-2 text-sm text-red-700">{{ error }}</p>
  </AppCard>
</template>

<script setup lang="ts">
/** A free feature that needs one tap to set up (business page, posters, check-in). */
const props = defineProps<{ feature: string; title: string }>();
const emit = defineEmits<{ done: [] }>();
const { orgId, currentOrg } = useOrg();
const { api } = useApi();
const isOwner = computed(() => currentOrg.value?.role === "owner");
const busy = ref(false);
const error = ref("");

async function switchOn() {
  busy.value = true;
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/switch`, { method: "POST", body: JSON.stringify({ addOn: props.feature, action: "start" }) });
    emit("done");
  }
  catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Could not switch it on. Please try again.";
  }
  finally {
    busy.value = false;
  }
}
</script>
