<template>
  <div class="rounded-3xl border border-slate-200 bg-white p-5" :class="$attrs.class">
    <h3 v-if="title" class="text-sm font-medium text-slate-700 mb-2">{{ title }}</h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>();
</script>
