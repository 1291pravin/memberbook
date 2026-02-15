<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div class="fixed inset-0 bg-black/40" @click="$emit('close')" />
        <div class="relative w-full bg-white rounded-xl shadow-xl my-8" :class="sizeClass">
          <div class="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl z-10">
            <h2 class="text-lg font-semibold text-slate-900">{{ title }}</h2>
            <button class="text-slate-600 hover:text-slate-600" @click="$emit('close')">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  size?: "sm" | "md" | "lg"
}>(), {
  size: "md",
});

defineEmits<{
  close: []
}>();

const sizeClass = computed(() => {
  const map = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };
  return map[props.size];
});
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
