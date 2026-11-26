<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div>
      <NuxtLink to="/dashboard/billing" class="text-sm font-medium text-primary-700 hover:underline">← MemberBook plan</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">Free business page</h1>
      <p class="mt-1 text-sm text-slate-600">
        A page for your business with your plans and prices, made from what's already in MemberBook.
        People who enquire on it show up in Enquiries.
      </p>
    </div>

    <FeatureSwitchOn v-if="data && !data.active" feature="business_page" title="Make your free business page" @done="refresh()" />

    <template v-else-if="data?.active">
      <AppCard title="Your page is live">
        <a :href="data.url" target="_blank" rel="noopener" class="break-all text-sm font-semibold text-primary-700 underline">{{ data.url }}</a>
        <div class="-ml-2.5 mt-3 flex flex-wrap gap-1">
          <AppAction icon="whatsapp" tone="whatsapp" :href="shareLink" external>Share on WhatsApp</AppAction>
          <AppAction :icon="copied ? 'check' : 'copy'" @click="copy">{{ copied ? 'Copied' : 'Copy link' }}</AppAction>
          <AppAction icon="eye" :href="data.url" external>Open page</AppAction>
        </div>
        <p class="mt-3 text-sm text-slate-600">Enquiries from this page so far: <strong class="text-slate-800">{{ data.enquiries }}</strong></p>
      </AppCard>

      <AppCard title="Make it better">
        <ul class="space-y-2 text-sm text-slate-700">
          <li>✓ Plans and prices come from your <NuxtLink to="/dashboard/plans" class="font-medium text-primary-700 underline">Plans</NuxtLink>.</li>
          <li v-if="!data.hasAddress || !data.hasPhone">• Add your {{ !data.hasPhone && !data.hasAddress ? 'WhatsApp number and address' : !data.hasPhone ? 'WhatsApp number' : 'address' }} in <NuxtLink to="/dashboard/settings" class="font-medium text-primary-700 underline">Settings</NuxtLink> so people can reach and find you.</li>
          <li>• Put the link in your Instagram bio and your Google Business Profile.</li>
        </ul>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Free business page - MemberBook" });

const { orgId, currentOrg } = useOrg();
const { data, refresh } = await useFetch<{ active: boolean; url?: string; hasPhone?: boolean; hasAddress?: boolean; enquiries?: number }>(
  () => `/api/orgs/${orgId.value}/add-ons/business-page`,
  { key: `business-page-${orgId.value}` },
);

const shareLink = computed(() => `https://wa.me/?text=${encodeURIComponent(`See ${currentOrg.value?.name ?? "our"} plans and fees, and enquire here: ${data.value?.url ?? ""}`)}`);
const copied = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(data.value?.url || "");
    copied.value = true;
  }
  catch { /* clipboard blocked */ }
}
</script>
