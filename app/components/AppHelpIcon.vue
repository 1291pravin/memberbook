<template>
  <span class="relative inline-flex items-center ml-1 group">
    <button
      type="button"
      class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors text-[10px] font-bold leading-none cursor-help"
      @mouseenter="show = true"
      @mouseleave="show = false"
      @click.prevent="show = !show"
    >
      ?
    </button>
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="absolute z-50 w-56 px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg shadow-lg"
        :class="positionClass"
      >
        <slot />
      </div>
    </Transition>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  position?: 'top' | 'bottom' | 'left' | 'right'
}>();

const show = ref(false);

const positionClass = computed(() => {
  // Default to bottom positioning
  return 'left-0 top-full mt-1';
});
</script>
