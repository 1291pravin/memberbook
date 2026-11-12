<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="#0F766E" />
    <circle cx="24" cy="25" r="5.5" fill="#FFFFFF" />
    <circle cx="40" cy="25" r="5.5" fill="#FF7A59" />
    <path d="M15 46a9 9 0 0 1 18 0M31 46a9 9 0 0 1 18 0" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" />
  </svg>
</template>

<script setup lang="ts">
// Memberbook mark (Circle brand): two people side by side whose shoulders draw an "m".
withDefaults(defineProps<{ size?: number }>(), { size: 30 });
</script>
