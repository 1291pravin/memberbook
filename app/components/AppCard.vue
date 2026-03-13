<template>
  <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md" :class="$attrs.class">
    <h3 v-if="title" class="text-sm font-medium text-slate-700 mb-2">{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>();
</script>
