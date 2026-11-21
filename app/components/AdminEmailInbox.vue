<template>
  <div class="space-y-4">
    <div
      v-if="list && !list.resendConfigured"
      class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
    >
      Replies are off until the Resend API key (NUXT_RESEND_API_KEY) is set.
    </div>

    <div class="grid gap-4 md:grid-cols-[320px_1fr]">
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white" :class="selected ? 'hidden md:block' : ''">
        <div v-if="pending && !list" class="space-y-2 p-3">
          <div v-for="i in 4" :key="i" class="h-14 animate-pulse rounded bg-slate-100" />
        </div>
        <AppEmptyState
          v-else-if="!list?.threads.length"
          title="No emails yet"
          description="Emails to support@memberbook.in will show up here."
        />
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="t in list.threads" :key="t.id">
            <button
              type="button"
              class="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-slate-50"
              :class="selected === t.id ? 'bg-primary-50' : ''"
              @click="open(t.id)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate font-semibold text-slate-800">{{ t.name || t.address }}</p>
                  <span class="shrink-0 text-xs text-slate-600">{{ formatShort(t.lastAt) }}</span>
                </div>
                <p class="truncate text-xs text-slate-600">{{ t.subject || "(no subject)" }}</p>
                <p class="mt-0.5 truncate text-sm text-slate-600">
                  <span v-if="t.lastDirection === 'out'" class="text-slate-500">You: </span>
                  <span v-else-if="t.lastDirection === 'ai'" class="text-slate-500">AI: </span>{{ t.lastBody }}
                </p>
                <p v-if="t.handedOver" class="mt-1 text-xs font-semibold text-amber-800">Needs you</p>
              </div>
              <span
                v-if="t.unread"
                class="mt-1 inline-flex min-w-5 shrink-0 justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white"
              >{{ t.unread }}</span>
            </button>
          </li>
        </ul>
      </div>

      <div class="flex min-h-[60vh] flex-col rounded-lg border border-slate-200 bg-white" :class="selected ? '' : 'hidden md:flex'">
        <template v-if="selected && thread">
          <div class="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <button type="button" class="text-sm font-medium text-primary-600 md:hidden" @click="selected = null">
              Back
            </button>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-slate-800">{{ thread.name || thread.address }}</p>
              <p class="truncate text-xs text-slate-600">{{ thread.address }}</p>
            </div>
            <button
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

          <div v-if="thread.ai.mode === 'human'" class="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <span class="font-semibold">You're handling this thread.</span>
            <template v-if="thread.ai.handoffReason"> Reason: {{ thread.ai.handoffReason }}.</template>
            The AI won't reply until you press "Let AI reply".
          </div>
          <div v-else-if="thread.ai.pausedUntil && thread.ai.autoReply && new Date(thread.ai.pausedUntil).getTime() > Date.now()" class="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            You replied here, so the AI waits until {{ formatClock(thread.ai.pausedUntil) }}.
          </div>
          <details v-if="thread.ai.notes" class="border-b border-slate-200 px-4 py-2 text-sm">
            <summary class="cursor-pointer font-medium text-slate-700">AI notes</summary>
            <p class="mt-1 whitespace-pre-wrap text-slate-600">{{ thread.ai.notes }}</p>
          </details>

          <div ref="scroller" class="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            <template v-for="m in thread.messages" :key="m.id">
              <div v-if="m.direction === 'note'" class="flex justify-center">
                <p class="max-w-[90%] whitespace-pre-wrap rounded-full bg-slate-200 px-3 py-1 text-center text-xs text-slate-700">
                  {{ m.body }} &middot; {{ formatTime(m.createdAt) }}
                </p>
              </div>
              <div v-else class="flex" :class="m.direction === 'out' ? 'justify-end' : 'justify-start'">
                <div
                  class="max-w-[85%] break-words rounded-lg px-3 py-2 text-sm shadow-sm"
                  :class="m.direction === 'out' ? 'bg-primary-50 text-slate-800' : 'bg-white text-slate-800'"
                >
                  <p v-if="m.subject" class="mb-1 text-xs font-semibold text-slate-700">{{ m.subject }}</p>
                  <p class="whitespace-pre-wrap">{{ m.body }}</p>
                  <p v-if="m.attachments.length" class="mt-1 text-xs text-slate-600">
                    Attached (not saved, see Gmail): {{ m.attachments.map(a => a.name).join(", ") }}
                  </p>
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
            <p class="mb-2 text-xs text-slate-600">Sends from support@memberbook.in in the same email thread, with the MemberBook signature.</p>
            <p v-if="sendError" class="mb-2 text-xs text-red-700">{{ sendError }}</p>
            <div class="flex items-end gap-2">
              <textarea
                v-model="draft"
                rows="3"
                maxlength="10000"
                placeholder="Write a reply"
                :disabled="!thread.canSend || sending"
                class="block w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-100"
              />
              <AppButton type="submit" :loading="sending" :disabled="!draft.trim() || !thread.canSend">
                Send
              </AppButton>
            </div>
          </form>
        </template>
        <div v-else class="flex flex-1 items-center justify-center p-6 text-sm text-slate-600">
          Pick an email.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ThreadRow { id: number; address: string; name: string | null; subject: string | null; lastBody: string; lastDirection: string; lastAt: string; unread: number; handedOver: boolean }
interface EmailMsg { id: number; direction: string; subject: string | null; body: string; attachments: { name: string }[]; status: string; error: string | null; sentBy: string | null; createdAt: string }
interface EmailThread {
  id: number;
  address: string;
  name: string | null;
  subject: string | null;
  canSend: boolean;
  ai: { autoReply: boolean; mode: string; handoffReason: string | null; notes: string | null; pausedUntil: string | null };
  messages: EmailMsg[];
}

const props = defineProps<{ initialId?: number | null }>();

const { data: list, pending, refresh } = await useFetch<{ resendConfigured: boolean; threads: ThreadRow[] }>("/api/admin/inbox/email", { key: "admin-inbox-email" });

const selected = ref<number | null>(null);
const thread = ref<EmailThread | null>(null);
const draft = ref("");
const sending = ref(false);
const sendError = ref("");
const changingMode = ref(false);
const scroller = ref<HTMLElement | null>(null);

async function loadThread(id: number) {
  thread.value = await $fetch<EmailThread>(`/api/admin/inbox/email/${id}`);
  await nextTick();
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight;
}

async function open(id: number) {
  selected.value = id;
  sendError.value = "";
  draft.value = "";
  await loadThread(id);
  refresh();
}

function errorText(err: unknown, fallback: string) {
  const e = err as { data?: { statusMessage?: string }; statusMessage?: string };
  return e?.data?.statusMessage || e?.statusMessage || fallback;
}

async function send() {
  if (!selected.value || !draft.value.trim() || sending.value) return;
  sending.value = true;
  sendError.value = "";
  try {
    await $fetch(`/api/admin/inbox/email/${selected.value}`, { method: "POST", body: { text: draft.value } });
    draft.value = "";
  }
  catch (err) {
    sendError.value = errorText(err, "Could not send.");
  }
  finally {
    sending.value = false;
    await loadThread(selected.value);
    refresh();
  }
}

async function setMode(mode: "auto" | "human") {
  if (!selected.value) return;
  changingMode.value = true;
  try {
    await $fetch(`/api/admin/inbox/email/${selected.value}/mode`, { method: "POST", body: { mode } });
  }
  finally {
    changingMode.value = false;
    await loadThread(selected.value);
    refresh();
  }
}

let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  if (props.initialId) open(props.initialId);
  timer = setInterval(() => {
    refresh();
    if (selected.value && !sending.value) loadThread(selected.value);
  }, 20000);
});
onBeforeUnmount(() => clearInterval(timer));

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
function formatShort(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return Date.now() - d.getTime() < 86400000
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
