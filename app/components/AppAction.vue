<template>
  <component
    :is="tag"
    v-bind="linkAttrs"
    :type="tag === 'button' ? 'button' : undefined"
    :disabled="tag === 'button' ? (disabled || loading) : undefined"
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
    :class="toneClass"
  >
    <svg v-if="loading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <AppActionIcon v-else-if="icon" :name="icon" />
    <slot />
  </component>
</template>

<script setup lang="ts">
// Simple text action with a small icon (the Payments "Receipt / Send" style).
// Use for row and card actions instead of filled buttons. Renders a button, a link or a NuxtLink.
import type { ActionIconName } from "./AppActionIcon.vue";

const props = withDefaults(defineProps<{
  icon?: ActionIconName
  to?: string
  href?: string
  external?: boolean
  tone?: "primary" | "whatsapp" | "slate" | "danger"
  loading?: boolean
  disabled?: boolean
}>(), { tone: "primary" });

const NuxtLinkComp = resolveComponent("NuxtLink");
const tag = computed(() => (props.to ? NuxtLinkComp : props.href ? "a" : "button"));
const linkAttrs = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) return props.external ? { href: props.href, target: "_blank", rel: "noopener" } : { href: props.href };
  return {};
});
const toneClass = computed(() => ({
  primary: "text-primary-700 hover:bg-primary-50",
  whatsapp: "text-[#128C4B] hover:bg-green-50",
  slate: "text-slate-700 hover:bg-slate-100",
  danger: "text-danger-700 hover:bg-danger-50",
}[props.tone]));
</script>
