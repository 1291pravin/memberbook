<template>
  <span class="inline-flex items-center gap-1">
    <a
      :href="`/api/orgs/${orgId}/payments/${paymentId}/receipt`"
      target="_blank"
      rel="noopener"
      class="rounded-lg px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
    >Receipt</a>
    <button
      type="button"
      class="rounded-lg px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
      :disabled="sharing"
      :title="'Send the receipt link on WhatsApp from your phone'"
      @click="share"
    >
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
