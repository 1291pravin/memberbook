<template>
  <AppModal :open="open" :title="t.importMembers" size="lg" @close="handleClose">
    <MemberImportPanel
      ref="panel"
      @cancel="handleClose"
      @imported="emit('imported')"
      @done="handleClose"
    />
  </AppModal>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [];
}>();

const t = useTerminology();
const panel = ref<{ reset: () => void } | null>(null);

function handleClose() {
  panel.value?.reset();
  emit("close");
}
</script>
