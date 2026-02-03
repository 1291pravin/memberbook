<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
    :class="colorClasses"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  color?: "green" | "red" | "yellow" | "blue" | "gray"
}>(), {
  color: "gray",
});

const colorClasses = computed(() => {
  const map = {
    green: "bg-success-100 text-success-700",
    red: "bg-danger-100 text-danger-700",
    yellow: "bg-warning-100 text-warning-700",
    blue: "bg-info-100 text-info-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return map[props.color];
});
</script>
