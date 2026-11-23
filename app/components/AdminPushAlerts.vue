<template>
  <div class="rounded-lg border border-slate-200 bg-white p-3 text-sm">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span class="inline-flex items-center gap-2 font-semibold text-slate-800">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        Phone alerts{{ state === "on" ? " on" : state === "loading" ? "" : " off" }}
      </span>
      <span class="text-slate-600">{{ hint }}</span>

      <div class="ml-auto flex flex-wrap items-center gap-1">
        <button
          v-if="installEvent"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-primary-700 hover:bg-primary-50"
          @click="install"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" /></svg>
          Add to home screen
        </button>
        <button
          v-if="state === 'off'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
          :disabled="busy"
          @click="enable"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
          Turn on
        </button>
        <template v-if="state === 'on'">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
            :disabled="busy"
            @click="sendTest"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
            Send test
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            :disabled="busy"
            @click="disable"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
            Turn off
          </button>
        </template>
      </div>
    </div>
    <p v-if="message" class="mt-2" :class="messageIsError ? 'text-red-700' : 'text-green-700'" role="status">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
type State = "loading" | "on" | "off" | "needs-install" | "unsupported" | "blocked";

const state = ref<State>("loading");
const busy = ref(false);
const message = ref("");
const messageIsError = ref(false);
const isIOS = ref(false);
const standalone = ref(false);

interface InstallPrompt extends Event { prompt: () => Promise<void> }
const installEvent = shallowRef<InstallPrompt | null>(null);

const hint = computed(() => {
  switch (state.value) {
    case "on": return "This phone gets an alert for every new WhatsApp message and email. Tap one to open the chat.";
    case "off": return "Get an alert on this phone for every new WhatsApp message and email.";
    case "needs-install": return "On iPhone, tap Share, then Add to Home Screen. Open MB Inbox from your home screen and turn alerts on there.";
    case "blocked": return "Alerts are blocked for memberbook.in. Allow notifications in your browser or phone settings, then reload.";
    case "unsupported": return "This browser can't show alerts. Use Chrome on Android, or Safari on iPhone from the home screen.";
    default: return "Checking this phone…";
  }
});

function show(text: string, isError = false) {
  message.value = text;
  messageIsError.value = isError;
}

function keyBytes(base64url: string) {
  const s = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

function deviceLabel() {
  const ua = navigator.userAgent;
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${os} ${browser}${standalone.value ? " (home screen)" : ""}`;
}

async function registration() {
  return await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" });
}

async function refreshState() {
  const supported = "serviceWorker" in navigator && Boolean(window.PushManager) && "Notification" in window;
  if (!supported) {
    state.value = isIOS.value && !standalone.value ? "needs-install" : "unsupported";
    return;
  }
  if (Notification.permission === "denied") {
    state.value = "blocked";
    return;
  }
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  state.value = sub ? "on" : "off";
}

async function enable() {
  busy.value = true;
  show("");
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      state.value = permission === "denied" ? "blocked" : "off";
      if (permission !== "denied") show("Alerts were not allowed. Tap Turn on again and choose Allow.", true);
      return;
    }
    const { publicKey } = await $fetch<{ publicKey: string }>("/api/admin/push/key");
    const reg = await registration();
    await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
    await $fetch("/api/admin/push/subscribe", { method: "POST", body: { ...sub.toJSON(), device: deviceLabel() } });
    state.value = "on";
    show("Alerts are on for this phone. Tap Send test to check.");
  }
  catch (err) {
    console.error(err);
    show("Couldn't turn on alerts on this phone. Try again, or reload the page.", true);
  }
  finally {
    busy.value = false;
  }
}

async function disable() {
  busy.value = true;
  show("");
  try {
    const reg = await registration();
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await $fetch("/api/admin/push/unsubscribe", { method: "POST", body: { endpoint: sub.endpoint } }).catch(() => {});
      await sub.unsubscribe();
    }
    state.value = "off";
    show("Alerts are off for this phone.");
  }
  finally {
    busy.value = false;
  }
}

async function sendTest() {
  busy.value = true;
  show("");
  try {
    const res = await $fetch<{ sent: number; failed: number; removed: number }>("/api/admin/push/test", { method: "POST" });
    if (res.sent) show(`Test alert sent to ${res.sent} ${res.sent === 1 ? "phone" : "phones"}. It should arrive in a few seconds.`);
    else show("The test alert didn't go through. Turn alerts off and on again.", true);
  }
  catch {
    show("Couldn't send the test alert.", true);
  }
  finally {
    busy.value = false;
  }
}

async function install() {
  const ev = installEvent.value;
  installEvent.value = null;
  await ev?.prompt().catch(() => {});
}

function onInstallPrompt(e: Event) {
  e.preventDefault();
  installEvent.value = e as InstallPrompt;
}

onMounted(() => {
  isIOS.value = /iPhone|iPad|iPod/.test(navigator.userAgent);
  standalone.value = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  window.addEventListener("beforeinstallprompt", onInstallPrompt);
  refreshState().catch(() => {
    state.value = "unsupported";
  });
});
onBeforeUnmount(() => window.removeEventListener("beforeinstallprompt", onInstallPrompt));
</script>
