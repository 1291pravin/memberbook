<template>
  <a
    v-if="link"
    :href="link"
    target="_blank"
    rel="noopener"
    aria-label="Chat with MemberBook support on WhatsApp"
    title="Need help? Chat with us on WhatsApp"
    class="fixed right-4 bottom-24 lg:bottom-6 z-30 flex items-center gap-2 rounded-full bg-[#25D366] pl-3 pr-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
  >
    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.05 4.91A10 10 0 0 0 2.05 14.83l-1.4 5.16 5.28-1.39A10 10 0 1 0 19.05 4.9zm-7.04 15.37a8 8 0 0 1-4.06-1.11l-.29-.17-3.13.82.83-3.05-.19-.31a8 8 0 1 1 6.84 3.82zm4.39-6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.92-1.18-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" /></svg>
    <span class="hidden sm:inline">Help</span>
  </a>
</template>

<script setup lang="ts">
const { currentOrg } = useOrg();
const { whatsappLink, helpMessage } = useSupport();

const link = computed(() => whatsappLink(helpMessage(currentOrg.value?.name)));
</script>
