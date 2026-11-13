<template>
  <div class="relative">
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
      :aria-label="`More actions for ${label}`"
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
      <div class="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-lg" role="menu">
        <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50" @click="pick('edit')">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.86 4.49l2.65 2.65M4 20l4.24-.85L19.5 7.89a1.87 1.87 0 000-2.65l-.74-.74a1.87 1.87 0 00-2.65 0L4.85 15.76 4 20z" /></svg>
          Edit payment
        </button>
        <button type="button" role="menuitem" class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger-700 hover:bg-danger-50" @click="pick('delete')">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
          Delete
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// Owner-only "⋯" menu for a payment: Edit and Delete, kept out of the way on small screens.
defineProps<{ label: string; loading?: boolean }>();
const emit = defineEmits<{ edit: []; delete: [] }>();
const open = ref(false);

function pick(action: "edit" | "delete") {
  open.value = false;
  if (action === "edit") emit("edit");
  else emit("delete");
}
</script>
