<template>
  <div class="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-slate-600">{{ label }}</p>
        <p class="text-2xl font-bold text-slate-800 mt-1 tracking-tight">{{ value }}</p>
      </div>
      <div
        v-if="$slots.icon"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        :class="iconBgClass"
      >
        <slot name="icon" />
      </div>
    </div>
    <p v-if="subtitle" class="text-xs text-slate-500 mt-2">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string | number
  subtitle?: string
  iconColor?: "primary" | "success" | "warning" | "danger" | "info"
}>(), {
  iconColor: "primary",
});

const iconBgClass = computed(() => {
  const map = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-100 text-success-700",
    warning: "bg-warning-100 text-warning-700",
    danger: "bg-danger-100 text-danger-700",
    info: "bg-info-100 text-info-700",
  };
  return map[props.iconColor];
});
</script>
