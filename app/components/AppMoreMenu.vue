<template>
  <div class="relative shrink-0">
    <button
      type="button"
      class="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
      :aria-label="label"
      :aria-expanded="open"
      :disabled="loading"
      @click="open = !open"
    >
      <svg v-if="loading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
    </button>
    <template v-if="open">
      <div class="fixed inset-0 z-40" @click="open = false" />
      <div class="absolute right-0 z-50 mt-1 min-w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-lg" role="menu">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2.5 text-left text-sm"
          :class="item.danger ? 'text-danger-700 hover:bg-danger-50' : 'text-slate-700 hover:bg-slate-50'"
          @click="pick(item.key)"
        >
          <svg v-if="item.danger" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
          {{ item.label }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// Compact "⋯" menu for secondary and destructive actions (Delete lives here, not as a big red button).
export interface MoreMenuItem { key: string; label: string; danger?: boolean }
withDefaults(defineProps<{ items: MoreMenuItem[]; label?: string; loading?: boolean }>(), { label: "More actions" });
const emit = defineEmits<{ select: [key: string] }>();
const open = ref(false);

function pick(key: string) {
  open.value = false;
  emit("select", key);
}
</script>
