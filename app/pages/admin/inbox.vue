<template>
  <div class="space-y-4">
    <div>
      <p class="text-sm font-semibold text-primary-600">Admin</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">WhatsApp inbox</h1>
      <p class="mt-1 text-sm text-slate-600">
        Messages to MemberBook's WhatsApp number. You can reply for 24 hours after their last message.
      </p>
    </div>

    <div
      v-if="list && !list.canSend"
      class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
    >
      Replies are off until the WhatsApp number is connected (access token and phone number ID).
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
                  <span v-if="c.lastDirection === 'out'" class="text-slate-500">You: </span>{{ c.lastBody }}
                </p>
              </div>
              <span
                v-if="c.unread"
                class="mt-1 inline-flex min-w-5 shrink-0 justify-center rounded-full bg-green-600 px-1.5 text-xs font-semibold text-white"
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
            <div class="min-w-0">
              <p class="truncate font-semibold text-slate-800">{{ threadName || `+${thread.phone}` }}</p>
              <a :href="`tel:+${thread.phone}`" class="text-xs text-slate-600 underline">+{{ thread.phone }}</a>
            </div>
          </div>

          <div ref="scroller" class="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-4">
            <div
              v-for="m in thread.messages"
              :key="m.id"
              class="flex"
              :class="m.direction === 'out' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm shadow-sm"
                :class="m.direction === 'out' ? 'bg-green-100 text-slate-800' : 'bg-white text-slate-800'"
              >
                {{ m.body }}
                <p class="mt-1 text-right text-[11px] text-slate-600">
                  {{ formatTime(m.createdAt) }}
                  <template v-if="m.direction === 'out'"> &middot; {{ m.status }}</template>
                </p>
                <p v-if="m.error" class="mt-1 text-xs text-red-700">{{ m.error }}</p>
              </div>
            </div>
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
}
interface Message {
  id: number;
  direction: string;
  contactName: string | null;
  type: string;
  body: string;
  status: string;
  error: string | null;
  createdAt: string;
}
interface Thread {
  phone: string;
  canSend: boolean;
  windowOpen: boolean;
  messages: Message[];
}

const { data: list, pending: listPending, refresh: refreshList } = await useFetch<{ canSend: boolean; conversations: Conversation[] }>(
  "/api/admin/inbox",
  { key: "admin-inbox" },
);

const selected = ref<string | null>(null);
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

// Poll for new messages while the page is open.
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
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
function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}
</script>
