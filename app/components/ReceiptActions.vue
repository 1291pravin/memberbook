<template>
  <span class="inline-flex items-center gap-1">
    <a
      :href="`/api/orgs/${orgId}/payments/${paymentId}/receipt`"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50"
    >
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 13h6M9 17h6" /></svg>
      Receipt
    </a>
    <button
      type="button"
      class="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
      :disabled="sharing"
      :title="'Send the receipt link on WhatsApp from your phone'"
      @click="share"
    >
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
      {{ sharing ? "..." : "Send" }}
    </button>
  </span>
</template>
<script setup lang="ts">
// Download a payment's PDF receipt, or send its link on WhatsApp from the owner's phone (free).
const props = defineProps<{ paymentId: number }>();
const { orgId } = useOrg();
const { getWhatsAppLink } = useWhatsApp();
const sharing = ref(false);

async function share() {
  sharing.value = true;
  try {
    const r = await $fetch<{ url: string; message: string; memberPhone: string | null }>(
      `/api/orgs/${orgId.value}/payments/${props.paymentId}/receipt`,
      { query: { format: "link" } },
    );
    const link = r.memberPhone
      ? getWhatsAppLink(r.memberPhone, r.message)
      : `https://wa.me/?text=${encodeURIComponent(r.message)}`;
    if (!window.open(link, "_blank", "noopener")) window.location.href = link;
  }
  catch {
    alert("Could not make the receipt. Please try again.");
  }
  finally {
    sharing.value = false;
  }
}
</script>
