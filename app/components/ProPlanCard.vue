<template>
  <AppCard class="!bg-accent-50">
    <AppBadge color="blue">Pro plan</AppBadge>
    <p class="mt-2 text-base font-semibold text-slate-800">{{ title }}</p>
    <p class="mt-1 text-sm text-slate-600">
      Pro is {{ planRupees(pro.monthly) }} a month with {{ PLAN_TRIAL_DAYS }} days free. It also has automatic fee reminders
      ({{ pro.reminders.toLocaleString('en-IN') }} a month), your own website and Google review reply drafts.
    </p>
    <AppButton class="mt-3" size="sm" @click="navigateTo('/dashboard/billing')">See plans</AppButton>
  </AppCard>
</template>

<script setup lang="ts">
/** Shown on a Pro feature's page when the business isn't on Pro. */
defineProps<{ title: string }>();
const pro = getPlanDef("pro");
</script>
