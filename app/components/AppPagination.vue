<template>
  <div v-if="total > 0" class="flex flex-col items-center gap-2 pt-2 pb-4">
    <p class="text-xs text-slate-500">
      Showing {{ rangeStart }}-{{ rangeEnd }} of {{ total }}
    </p>

    <div v-if="totalPages > 1" class="flex items-center gap-1">
      <!-- Prev button -->
      <button
        :disabled="page <= 1"
        class="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        @click="$emit('update:page', page - 1)"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Desktop: page numbers -->
      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '...'" class="px-1 text-sm text-slate-400">...</span>
        <button
          v-else
          :class="[
            'inline-flex items-center justify-center rounded-lg min-w-[32px] px-2 py-1.5 text-sm font-medium transition-colors',
            p === page
              ? 'bg-primary-600 text-white'
              : 'text-slate-600 hover:bg-slate-100',
          ]"
          class="hidden sm:inline-flex"
          @click="$emit('update:page', p)"
        >
          {{ p }}
        </button>
      </template>

      <!-- Mobile: compact display -->
      <span class="sm:hidden text-sm text-slate-600 px-2">
        {{ page }} / {{ totalPages }}
      </span>

      <!-- Next button -->
      <button
        :disabled="page >= totalPages"
        class="inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        @click="$emit('update:page', page + 1)"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}>();

defineEmits<{
  "update:page": [page: number];
}>();

const rangeStart = computed(() => Math.min((props.page - 1) * props.limit + 1, props.total));
const rangeEnd = computed(() => Math.min(props.page * props.limit, props.total));

const visiblePages = computed(() => {
  const pages: (number | "...")[] = [];
  const total = props.totalPages;
  const current = props.page;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
});
</script>
