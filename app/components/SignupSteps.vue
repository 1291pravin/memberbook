<template>
  <ol class="mb-8 flex items-center justify-center gap-2 text-sm font-semibold" aria-label="Sign-up steps">
    <li v-for="(label, i) in steps" :key="label" class="flex items-center gap-2">
      <span
        class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold"
        :class="i + 1 < current ? 'bg-primary-600 text-white' : i + 1 === current ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'"
        :aria-current="i + 1 === current ? 'step' : undefined"
      >{{ i + 1 < current ? '✓' : i + 1 }}</span>
      <span :class="i + 1 === current ? 'text-slate-800' : 'text-slate-600'" class="hidden sm:inline">{{ label }}</span>
      <span v-if="i < steps.length - 1" class="h-px w-6 bg-slate-300 sm:w-10" aria-hidden="true" />
    </li>
  </ol>
</template>

<script setup lang="ts">
// Three steps, and that's the whole sign-up: account, business, send your list.
defineProps<{ current: 1 | 2 | 3 }>();
const steps = ["Your account", "Your business", "Your list"];
</script>
