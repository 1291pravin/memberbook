<script setup lang="ts">
// The add-ons menu became the Plan page (Free, Autopilot, Pro).
definePageMeta({ layout: "dashboard", middleware: "org-required" });
await navigateTo("/dashboard/billing", { replace: true });
</script>

<template>
  <div />
</template>
