<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Inbox</h1>
      <p class="mt-1 text-sm text-slate-600">
        {{ tab === "email"
          ? "Emails to support@memberbook.in. Replies go out from support@ in the same email thread."
          : "Messages to MemberBook's WhatsApp number. You can reply for 24 hours after their last message." }}
      </p>
    </div>

    <div class="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        role="tab"
        :aria-selected="tab === t.key"
        class="rounded-md px-3 py-1.5 font-medium"
        :class="tab === t.key ? 'bg-primary-600 text-white' : 'text-slate-700 hover:bg-slate-50'"
        @click="setTab(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- On a phone an open chat comes first (e.g. opened from an alert); these cards wait on the list view. -->
    <div v-if="list" class="flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm" :class="chatOpen ? 'hidden lg:flex' : 'flex'">
      <span class="inline-flex items-center gap-2 font-semibold text-slate-800">
        <span class="h-2.5 w-2.5 rounded-full" :class="list.autoReply ? 'bg-green-600' : 'bg-slate-400'" aria-hidden="true" />
        AI replies {{ list.autoReply ? "on" : "off" }}
      </span>
      <span class="text-slate-600">
        {{ list.autoReply
          ? "The AI answers new WhatsApp messages and emails. Money questions and complaints come to you by email."
          : "Nobody answers automatically. You get an email for every message." }}
      </span>
      <button
        type="button"
        class="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
        :disabled="togglingAi"
        @click="toggleAutoReply"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
        {{ list.autoReply ? "Turn off" : "Turn on" }}
      </button>
    </div>

    <AdminPushAlerts :class="chatOpen ? 'hidden lg:block' : ''" />

    <AdminEmailInbox v-if="tab === 'email'" :initial-id="initialEmailId" />

    <template v-else>
    <div
      v-if="list && !list.canSend"
      class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
    >
      Replies are off until the WhatsApp number is connected (access token and phone number ID).
    </div>

    <div v-else-if="number" class="rounded-lg border border-slate-200 bg-white p-3 text-sm" :class="chatOpen ? 'hidden lg:block' : ''">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p class="font-semibold text-slate-800">
          {{ number.verifiedName || "WhatsApp number" }} {{ number.displayPhoneNumber }}
        </p>
        <AppBadge :color="numberReady ? 'green' : 'yellow'">
          {{ number.ok ? (number.status || "unknown") : "error" }}
        </AppBadge>
        <span v-if="number.nameStatus" class="text-slate-600">Display name: {{ number.nameStatus.toLowerCase().replace(/_/g, " ") }}</span>
        <span v-if="number.webhooksSubscribed === false" class="text-amber-800">Incoming messages not linked yet</span>
      </div>
      <p v-if="!number.ok" class="mt-1 text-red-700">{{ number.error }}</p>
      <form
        v-if="number.ok && number.status !== 'CONNECTED'"
        class="mt-3 flex flex-wrap items-end gap-2"
        @submit.prevent="registerNumber"
      >
        <div>
          <label for="wa-pin" class="block text-xs font-medium text-slate-700">Choose a 6-digit PIN for the number</label>
          <input
            id="wa-pin"
            v-model="pin"
            inputmode="numeric"
            maxlength="6"
            pattern="\d{6}"
            class="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500"
            placeholder="123456"
          >
        </div>
        <AppButton type="submit" :loading="registering" :disabled="!/^\d{6}$/.test(pin)">
          Connect number
        </AppButton>
        <p v-if="registerError" class="w-full text-xs text-red-700">{{ registerError }}</p>
      </form>
      <div v-if="number.ok && number.status === 'CONNECTED'" class="mt-3 flex flex-wrap items-center gap-2">
        <AppButton v-if="number.webhooksSubscribed !== true" :loading="linking" @click="linkWebhooks">
          Link incoming messages
        </AppButton>
        <AppButton variant="secondary" :loading="savingProfile" @click="saveProfile">
          Update WhatsApp profile
        </AppButton>
        <p v-if="actionMessage" class="w-full text-xs" :class="actionError ? 'text-red-700' : 'text-green-700'">{{ actionMessage }}</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-[320px_1fr]">
      <!-- Conversations -->
      <div
        class="overflow-hidden rounded-lg border border-slate-200 bg-white"
        :class="selected ? 'hidden md:block' : ''"
      >
        <div v-if="listPending && !list" class="space-y-2 p-3">
          <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded bg-slate-100" />
        </div>
        <AppEmptyState
          v-else-if="!list?.conversations.length"
          title="No messages yet"
          description="Messages to the WhatsApp number will show up here."
        />
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="c in list.conversations" :key="c.phone">
            <button
              type="button"
              class="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-slate-50"
              :class="selected === c.phone ? 'bg-primary-50' : ''"
              @click="open(c.phone)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate font-semibold text-slate-800">{{ c.name || `+${c.phone}` }}</p>
                  <span class="shrink-0 text-xs text-slate-600">{{ formatShort(c.lastAt) }}</span>
                </div>
                <p v-if="c.name" class="text-xs text-slate-600">+{{ c.phone }}</p>
                <p class="mt-0.5 truncate text-sm text-slate-600">
                  <span v-if="c.lastDirection === 'out'" class="text-slate-500">You: </span>
                  <span v-else-if="c.lastDirection === 'ai'" class="text-slate-500">AI: </span>{{ c.lastBody }}
                </p>
                <p v-if="c.handedOver" class="mt-1 text-xs font-semibold text-amber-800">Needs you</p>
              </div>
              <span
                v-if="c.unread"
                class="mt-1 inline-flex min-w-5 shrink-0 justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white"
              >{{ c.unread }}</span>
            </button>
          </li>
        </ul>
      </div>

      <!-- Thread -->
      <div
        class="flex min-h-[60vh] flex-col rounded-lg border border-slate-200 bg-white"
        :class="selected ? '' : 'hidden md:flex'"
      >
        <template v-if="selected && thread">
          <div class="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <button type="button" class="text-sm font-medium text-primary-600 md:hidden" @click="selected = null">
              Back
            </button>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-slate-800">{{ threadName || `+${thread.phone}` }}</p>
              <a :href="`tel:+${thread.phone}`" class="text-xs text-slate-600 underline">+{{ thread.phone }}</a>
            </div>
            <button
              v-if="thread.ai"
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50"
              :disabled="changingMode"
              @click="setMode(thread.ai.mode === 'human' ? 'auto' : 'human')"
            >
              <svg v-if="thread.ai.mode === 'human'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
              {{ thread.ai.mode === "human" ? "Let AI reply" : "I'll reply" }}
            </button>
          </div>

          <div v-if="thread.ai && thread.ai.mode === 'human'" class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <span class="font-semibold">You're handling this chat.</span>
            <template v-if="thread.ai.handoffReason"> Reason: {{ thread.ai.handoffReason }}.</template>
            The AI won't reply until you press "Let AI reply".
          </div>
          <div v-else-if="thread.ai?.pausedUntil && thread.ai.autoReply" class="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            You replied here, so the AI waits until {{ formatClock(thread.ai.pausedUntil) }}.
          </div>
          <details v-if="thread.ai?.notes" class="border-b border-slate-200 px-4 py-2 text-sm">
            <summary class="cursor-pointer font-medium text-slate-700">AI notes</summary>
            <p class="mt-1 whitespace-pre-wrap text-slate-600">{{ thread.ai.notes }}</p>
          </details>

          <div ref="scroller" class="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-4">
            <template v-for="m in thread.messages" :key="m.id">
            <div v-if="m.direction === 'note'" class="flex justify-center">
              <p class="max-w-[90%] whitespace-pre-wrap rounded-full bg-slate-200 px-3 py-1 text-center text-xs text-slate-700">
                {{ m.body }} &middot; {{ formatTime(m.createdAt) }}
              </p>
            </div>
            <div
              v-else
              class="flex"
              :class="m.direction === 'out' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm shadow-sm"
                :class="m.direction === 'out' ? 'bg-primary-50 text-slate-800' : 'bg-white text-slate-800'"
              >
                <template v-if="m.file?.saved">
                  <a v-if="m.file.type.startsWith('image/')" :href="`/api/admin/inbox/media/${m.id}`" target="_blank" rel="noopener" class="mb-1 block">
                    <img :src="`/api/admin/inbox/media/${m.id}`" :alt="m.file.name" class="max-h-72 rounded" loading="lazy">
                  </a>
                  <a :href="`/api/admin/inbox/media/${m.id}?download=1`" class="mb-1 block text-xs font-medium text-primary-700 underline">Download {{ m.file.name }}</a>
                </template>
                <p v-else-if="m.file" class="mb-1 text-xs text-red-700">Couldn't save this file. Ask them to send it again.</p>
                {{ m.body }}
                <p class="mt-1 text-right text-[11px] text-slate-600">
                  <span v-if="m.direction === 'out' && m.sentBy === 'ai'" class="mr-1 rounded bg-primary-100 px-1 font-semibold text-primary-800">AI</span>
                  <span v-else-if="m.direction === 'out' && m.sentBy === 'system'" class="mr-1 rounded bg-slate-200 px-1 font-semibold text-slate-700">Auto</span>
                  {{ formatTime(m.createdAt) }}
                  <template v-if="m.direction === 'out'"> &middot; {{ m.status }}</template>
                </p>
                <p v-if="m.error" class="mt-1 text-xs text-red-700">{{ m.error }}</p>
              </div>
            </div>
            </template>
          </div>

          <form class="border-t border-slate-200 p-3" @submit.prevent="send">
            <p v-if="!thread.windowOpen" class="mb-2 text-xs text-amber-800">
              More than 24 hours since their last message, so WhatsApp won't deliver a free-text reply. Call them, or wait for them to write again.
            </p>
            <p v-if="sendError" class="mb-2 text-xs text-red-700">{{ sendError }}</p>
            <div class="flex items-end gap-2">
              <textarea
                v-model="draft"
                rows="2"
                maxlength="4096"
                placeholder="Type a reply"
                :disabled="!thread.canSend || !thread.windowOpen || sending"
                class="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100"
                @keydown.enter.exact.prevent="send"
              />
              <AppButton type="submit" :loading="sending" :disabled="!draft.trim() || !thread.canSend || !thread.windowOpen">
                Send
              </AppButton>
            </div>
          </form>
        </template>
        <div v-else class="flex flex-1 items-center justify-center p-6 text-sm text-slate-600">
          Pick a conversation.
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

interface Conversation {
  phone: string;
  name: string | null;
  lastBody: string;
  lastDirection: string;
  lastAt: string;
  lastInAt: string | null;
  unread: number;
  handedOver: boolean;
}
interface Message {
  id: number;
  direction: string;
  contactName: string | null;
  type: string;
  body: string;
  status: string;
  error: string | null;
  file: { name: string; type: string; saved: boolean } | null;
  sentBy: string | null;
  createdAt: string;
}
interface Thread {
  phone: string;
  canSend: boolean;
  windowOpen: boolean;
  ai?: { autoReply: boolean; mode: string; handoffReason: string | null; notes: string | null; orgId: number | null; pausedUntil: string | null };
  messages: Message[];
}

const { data: list, pending: listPending, refresh: refreshList } = await useFetch<{ canSend: boolean; autoReply: boolean; conversations: Conversation[] }>(
  "/api/admin/inbox",
  { key: "admin-inbox" },
);

interface NumberStatus {
  ok: boolean;
  error?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  nameStatus?: string;
  status?: string;
  webhooksSubscribed?: boolean | null;
}
const { data: number, refresh: refreshNumber } = await useFetch<NumberStatus>("/api/admin/whatsapp/status", { key: "admin-wa-number", lazy: true, server: false });
const numberReady = computed(() => number.value?.ok && number.value.status === "CONNECTED" && number.value.webhooksSubscribed === true);
const pin = ref("");
const registering = ref(false);
const registerError = ref("");

async function registerNumber() {
  registering.value = true;
  registerError.value = "";
  try {
    const res = await $fetch<{ error?: string }>("/api/admin/whatsapp/register", { method: "POST", body: { pin: pin.value } });
    if (res.error) registerError.value = res.error;
    pin.value = "";
  }
  catch (err) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string };
    registerError.value = e?.data?.statusMessage || e?.statusMessage || "Could not connect the number.";
  }
  finally {
    registering.value = false;
    refreshNumber();
  }
}

const route = useRoute();
const router = useRouter();
const tabs = [{ key: "whatsapp", label: "WhatsApp" }, { key: "email", label: "Email" }] as const;
const initialEmailId = Number(route.query.email) || null;
const tab = ref<"whatsapp" | "email">(route.query.email !== undefined || route.query.tab === "email" ? "email" : "whatsapp");
function setTab(key: "whatsapp" | "email") {
  tab.value = key;
  router.replace({ query: key === "email" ? { tab: "email" } : {} });
}
const linking = ref(false);
const savingProfile = ref(false);
const actionMessage = ref("");
const actionError = ref(false);

function errorText(err: unknown, fallback: string) {
  const e = err as { data?: { statusMessage?: string }; statusMessage?: string };
  return e?.data?.statusMessage || e?.statusMessage || fallback;
}

async function linkWebhooks() {
  linking.value = true;
  actionMessage.value = "";
  try {
    await $fetch("/api/admin/whatsapp/subscribe", { method: "POST" });
    actionError.value = false;
    actionMessage.value = "Incoming messages are linked. Send a test message to the number.";
  }
  catch (err) {
    actionError.value = true;
    actionMessage.value = errorText(err, "Could not link incoming messages.");
  }
  finally {
    linking.value = false;
    refreshNumber();
  }
}

async function saveProfile() {
  savingProfile.value = true;
  actionMessage.value = "";
  try {
    const res = await $fetch<{ error?: string; photo?: boolean }>("/api/admin/whatsapp/profile", { method: "POST" });
    actionError.value = !!res.error;
    actionMessage.value = res.error || "WhatsApp profile updated (photo, about, description, email, website).";
  }
  catch (err) {
    actionError.value = true;
    actionMessage.value = errorText(err, "Could not update the profile.");
  }
  finally {
    savingProfile.value = false;
  }
}

const selected = ref<string | null>(null);
const chatOpen = computed(() => tab.value === "whatsapp" && Boolean(selected.value));
const thread = ref<Thread | null>(null);
const draft = ref("");
const sending = ref(false);
const sendError = ref("");
const scroller = ref<HTMLElement | null>(null);

const threadName = computed(() =>
  [...(thread.value?.messages ?? [])].reverse().find(m => m.contactName)?.contactName ?? null,
);

async function loadThread(phone: string) {
  thread.value = await $fetch<Thread>(`/api/admin/inbox/${phone}`);
  await nextTick();
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
}

async function open(phone: string) {
  selected.value = phone;
  sendError.value = "";
  draft.value = "";
  await loadThread(phone);
  refreshList();
}

async function send() {
  if (!selected.value || !draft.value.trim() || sending.value) return;
  sending.value = true;
  sendError.value = "";
  try {
    await $fetch(`/api/admin/inbox/${selected.value}`, { method: "POST", body: { text: draft.value } });
    draft.value = "";
  }
  catch (err) {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string };
    sendError.value = e?.data?.statusMessage || e?.statusMessage || "Could not send.";
  }
  finally {
    sending.value = false;
    await loadThread(selected.value);
    refreshList();
  }
}

const togglingAi = ref(false);
async function toggleAutoReply() {
  if (!list.value) return;
  togglingAi.value = true;
  try {
    await $fetch("/api/admin/inbox/settings", { method: "POST", body: { autoReply: !list.value.autoReply } });
  }
  finally {
    togglingAi.value = false;
    await refreshList();
    if (selected.value) loadThread(selected.value);
  }
}

const changingMode = ref(false);
async function setMode(mode: "auto" | "human") {
  if (!selected.value) return;
  changingMode.value = true;
  try {
    await $fetch(`/api/admin/inbox/${selected.value}/mode`, { method: "POST", body: { mode } });
  }
  finally {
    changingMode.value = false;
    await loadThread(selected.value);
    refreshList();
  }
}

// Poll for new messages while the page is open.
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  // /admin/inbox?phone=91... (from the Today page) opens that chat straight away.
  const phone = String(route.query.phone ?? "").replace(/\D/g, "");
  if (phone) open(phone);
  timer = setInterval(() => {
    refreshList();
    if (selected.value && !sending.value) loadThread(selected.value);
  }, 20000);
});
onBeforeUnmount(() => clearInterval(timer));

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
function formatShort(iso: string) {
  const d = new Date(iso);
  return Date.now() - d.getTime() < 24 * 60 * 60 * 1000
    ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : dateFmt.format(d);
}
function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}
function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}
</script>
