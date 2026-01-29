<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" :class="$attrs.class">
    <h3 v-if="title" class="text-sm font-medium text-gray-500 mb-2">{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>();
</script>
