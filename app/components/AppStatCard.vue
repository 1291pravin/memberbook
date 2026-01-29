<template>
  <AppCard>
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500">{{ label }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ value }}</p>
      </div>
      <div v-if="$slots.icon" class="text-gray-400">
        <slot name="icon" />
      </div>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>();
</script>
