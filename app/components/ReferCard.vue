<template>
  <section v-if="data" class="flex items-start gap-3 rounded-[28px] border border-slate-200 bg-white px-4 py-3 sm:px-5">
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700" aria-hidden="true">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8m16 0H4m16 0V8a1 1 0 00-1-1H5a1 1 0 00-1 1v4m8-5v14m0-14c-1.5-3-5-3-5-.5S10 7 12 7zm0 0c1.5-3 5-3 5-.5S14 7 12 7z" /></svg>
    </span>
    <div class="min-w-0 flex-1">
      <p class="font-semibold text-slate-800">Know another gym, library or coaching centre?</p>
      <p class="text-sm text-slate-600">
        Share MemberBook with them. When they add their {{ t.membersLower }}, you get {{ data.rewardDays }} days of automatic reminders free.
        <template v-if="data.referred > 0">{{ " " }}You've brought in {{ data.referred }} so far and earned {{ data.daysEarned }} free days.</template>
      </p>
      <div class="-ml-2.5 mt-1 flex flex-wrap items-center gap-1">
        <AppAction :href="shareLink" external icon="whatsapp" tone="whatsapp">Share on WhatsApp</AppAction>
        <AppAction icon="copy" tone="slate" @click="copy">{{ copied ? "Copied" : "Copy link" }}</AppAction>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Owner-to-owner referral: a WhatsApp share of their own referral link. The
// owner sends it from their phone; a free month of reminders per business that
// signs up and adds members (granted by the daily addons:billing task).
const { orgId } = useOrg();
const t = useTerminology();
const { data } = await useFetch<{ link: string; rewardDays: number; referred: number; daysEarned: number }>(
  () => `/api/orgs/${orgId.value}/referrals`,
  { lazy: true, server: false },
);

const shareText = computed(() => data.value
  ? `I use MemberBook for my fees and members. It's free, they add your register for you, and it sends fee reminders on WhatsApp. Try it: ${data.value.link}`
  : "");
const shareLink = computed(() => `https://wa.me/?text=${encodeURIComponent(shareText.value)}`);

const copied = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(shareText.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  }
  catch { /* clipboard blocked: nothing to do */ }
}
</script>
