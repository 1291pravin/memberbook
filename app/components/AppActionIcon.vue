<template>
  <svg v-if="name === 'whatsapp'" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
    <path fill="currentColor" d="M16.4 14.28c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.92-1.18-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
  </svg>
  <svg v-else class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" :d="paths[name]" /></svg>
</template>

<script setup lang="ts">
// Small stroke icons for AppAction. Keep the set short and generic.
export type ActionIconName =
  | "whatsapp" | "phone" | "send" | "receipt" | "edit" | "plus" | "rupee" | "check"
  | "refresh" | "seat" | "login" | "logout" | "pause" | "play" | "eye" | "settings" | "download" | "upload";

defineProps<{ name: ActionIconName }>();

const paths: Record<Exclude<ActionIconName, "whatsapp">, string> = {
  phone: "M3 5a2 2 0 012-2h2.3a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.2l-1.6.8a11 11 0 005.7 5.7l.8-1.6a1 1 0 011.2-.5l3.3 1.1a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  receipt: "M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5M9 13h6M9 17h6",
  edit: "M16.86 4.49l2.65 2.65M4 20l4.24-.85L19.5 7.89a1.87 1.87 0 000-2.65l-.74-.74a1.87 1.87 0 00-2.65 0L4.85 15.76 4 20z",
  plus: "M12 5v14M5 12h14",
  rupee: "M6 4h12M6 9h12M14 20L6 13h3a4 4 0 000-8",
  check: "M5 13l4 4L19 7",
  refresh: "M4 4v6h6M20 20v-6h-6M5.6 15A7 7 0 0018.4 15M18.4 9A7 7 0 005.6 9",
  seat: "M6 3v9a2 2 0 002 2h8a2 2 0 002-2V3M4 14h16M7 14v7M17 14v7",
  login: "M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  pause: "M10 9v6M14 9v6M12 21a9 9 0 100-18 9 9 0 000 18z",
  play: "M10 8l6 4-6 4V8zM12 21a9 9 0 100-18 9 9 0 000 18z",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  download: "M12 4v11m0 0l-4-4m4 4l4-4M5 20h14",
  upload: "M12 15V4m0 0L8 8m4-4l4 4M5 20h14",
};
</script>
