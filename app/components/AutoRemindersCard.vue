<template>
  <!-- Off, quiet (Home): one line, the video only opens when tapped -->
  <section
    v-if="state === 'off' && quiet"
    class="flex items-start gap-3 rounded-[28px] border border-slate-200 bg-white px-4 py-3 sm:px-5"
  >
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#128C4B]">
      <AppActionIcon name="whatsapp" class="!h-5 !w-5" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="font-semibold text-slate-800">Automatic fee reminders</p>
      <p class="text-sm text-slate-600">
        Every morning on WhatsApp, with a UPI pay link.<template v-if="needsPlan">{{ " " }}{{ priceLine }}</template>
      </p>
      <div class="-ml-2.5 mt-1 flex flex-wrap items-center gap-1">
        <AppAction v-if="isOwner" icon="check" tone="primary" @click="$emit('turn-on')">{{ trialDays ? "Try free" : "Turn on" }}</AppAction>
        <AppAction icon="play" tone="slate" @click="videoOpen = true">How it works</AppAction>
      </div>
    </div>
    <AppModal :open="videoOpen" title="Automatic fee reminders" size="sm" @close="videoOpen = false">
      <video
        v-if="videoOpen"
        class="block aspect-square w-full rounded-2xl"
        autoplay
        controls
        playsinline
        poster="/brand/auto-reminders-poster.webp"
        aria-label="How automatic fee reminders work: a WhatsApp reminder with a pay link goes out, the member pays by UPI, and the fee shows as collected"
      >
        <source src="/brand/auto-reminders.mp4" type="video/mp4">
      </video>
      <AppButton v-if="isOwner" class="mt-4 w-full" @click="videoOpen = false; $emit('turn-on')">Turn on automatic reminders</AppButton>
    </AppModal>
  </section>

  <!-- Off: sell it, with the short explainer video -->
  <section
    v-else-if="state === 'off'"
    class="overflow-hidden rounded-[28px] border border-primary-200 bg-primary-50"
  >
    <div class="grid gap-0" :class="videoShown ? 'md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]' : ''">
      <div v-if="videoShown" class="bg-primary-900 md:h-full">
        <video
          class="mx-auto block aspect-square w-full max-w-sm md:h-full md:max-w-none md:object-cover"
          autoplay
          :muted="!compact"
          :loop="!compact"
          :controls="compact"
          playsinline
          preload="metadata"
          poster="/brand/auto-reminders-poster.webp"
          aria-label="How automatic fee reminders work: a WhatsApp reminder with a pay link goes out, the member pays by UPI, and the fee shows as collected"
        >
          <source src="/brand/auto-reminders.mp4" type="video/mp4">
        </video>
      </div>
      <div class="p-5 sm:p-6">
        <p class="text-sm font-semibold text-primary-700">Automatic fee reminders</p>
        <h2 class="mt-1 text-2xl font-extrabold leading-tight tracking-tight text-slate-800">
          Stop chasing fees. <span class="serif-accent text-primary-600">We'll send the reminders.</span>
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-slate-700">
          <li v-for="point in points" :key="point" class="flex gap-2">
            <svg class="mt-0.5 h-4 w-4 shrink-0 text-primary-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span>{{ point }}</span>
          </li>
        </ul>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <AppButton v-if="isOwner" @click="$emit('turn-on')">{{ trialDays ? `Try it free for ${trialDays} days` : "Turn on automatic reminders" }}</AppButton>
          <p v-else class="text-sm font-medium text-slate-700">Ask the owner to turn this on.</p>
          <p v-if="needsPlan" class="text-sm text-slate-600">{{ priceLine }} Up to {{ included }} reminders a month.</p>
        </div>
        <button
          v-if="!videoShown"
          type="button"
          class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline"
          @click="videoOpen = true"
        >
          <AppActionIcon name="play" />
          See how it works (18 seconds)
        </button>
      </div>
    </div>
  </section>

  <!-- Switched on, waiting for the ₹199 payment -->
  <section
    v-else-if="state === 'pay'"
    class="flex flex-col gap-3 rounded-[28px] border border-accent-200 bg-accent-50 p-5 sm:flex-row sm:items-center"
  >
    <div class="flex-1">
      <p class="font-semibold text-slate-800">
        <template v-if="data?.reminderTrialEnded">Your free trial has ended. Pay {{ formatCurrency(billAmount) }} to keep reminders going</template>
        <template v-else>Pay {{ formatCurrency(billAmount) }} to start automatic reminders</template>
      </p>
      <p v-if="resultsLine" class="mt-0.5 text-sm font-medium text-slate-800">{{ resultsLine }}</p>
      <p class="mt-0.5 text-sm text-slate-700">
        Reminders start the morning after we confirm your payment. Until then, tap Remind to send from your own phone.
      </p>
    </div>
    <AppButton v-if="isOwner" class="shrink-0" @click="$emit('pay')">Pay {{ formatCurrency(billAmount) }}</AppButton>
    <p v-else class="text-sm text-slate-700">Ask the owner to pay.</p>
  </section>

  <!-- Free trial running -->
  <section
    v-else-if="state === 'trial'"
    class="flex flex-col gap-3 rounded-[28px] border border-primary-200 bg-primary-50 px-5 py-4 sm:flex-row sm:items-center"
  >
    <span class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-[#128C4B] sm:flex">
      <AppActionIcon name="whatsapp" class="!h-5 !w-5" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="font-semibold text-slate-800">Automatic reminders are on, free until {{ trialEndText }}</p>
      <p class="mt-0.5 text-sm text-slate-700">
        <template v-if="resultsLine">{{ resultsLine }} </template>
        <template v-else>We send due reminders every morning. </template>
        <template v-if="billStatus === 'claimed'">Thanks, we're checking your payment.</template>
        <template v-else>Then {{ formatCurrency(price) }} a month to keep them going.</template>
      </p>
    </div>
    <AppAction v-if="isOwner && billStatus === 'due'" icon="check" tone="primary" class="shrink-0" @click="$emit('pay')">Pay {{ formatCurrency(billAmount) }} now</AppAction>
  </section>

  <!-- Paid, we're checking -->
  <section v-else-if="state === 'checking'" class="rounded-[28px] border border-primary-200 bg-primary-50 p-5">
    <p class="font-semibold text-slate-800">Thanks, we're checking your payment</p>
    <p class="mt-0.5 text-sm text-slate-700">Automatic reminders start the morning after we confirm it, usually within a day.</p>
  </section>

  <!-- On (Home only: Fees due already says how reminders go out) -->
  <NuxtLink
    v-else-if="state === 'on' && showOn"
    to="/dashboard/collections"
    class="flex items-center gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4"
  >
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-[#128C4B]">
      <AppActionIcon name="whatsapp" class="!h-5 !w-5" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-semibold text-slate-800">Automatic reminders are on</span>
      <span class="block text-sm text-slate-700">
        We send due reminders every morning.<template v-if="data?.reminderUsage">{{ " " }}{{ data.reminderUsage.used }} of {{ data.reminderUsage.limit }} used this month.</template>
      </span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
// Automatic WhatsApp fee reminders, the main paid feature: shown on Home and in
// Fees due. Off = explainer video + "Turn on"; then pay; then a small "on" note.
export interface AutoRemindersData {
  settings: { upiId: string | null; autoRemindersEnabled: boolean };
  sendsViaCloud: boolean;
  sendsFrom: "own" | "memberbook" | null;
  needsAddOn: boolean;
  canTurnOnReminders?: boolean;
  reminderUsage: { used: number; limit: number } | null;
  reminderBlocked: "limit" | "unpaid" | null;
  reminderPlan?: { price: number; included: number; trialDays?: number };
  reminderBill?: { amount: number; status: string } | null;
  reminderTrialUntil?: string | null;
  reminderTrialEnded?: boolean;
  reminderTrialAvailable?: boolean;
  trialResults?: { sent: number; paidCount: number; paidAmount: number } | null;
}

const props = defineProps<{
  data: AutoRemindersData | null | undefined;
  isOwner: boolean;
  /** Home: also show a small note once reminders are on. */
  showOn?: boolean;
  /** Fees due: keep it short, the video plays only when asked. */
  compact?: boolean;
  /** Home: a single quiet line instead of the full card. */
  quiet?: boolean;
}>();
defineEmits<{ "turn-on": []; pay: [] }>();

const { formatCurrency } = useFormatCurrency();
const videoOpen = ref(false);
const videoShown = computed(() => !props.compact || videoOpen.value);
const t = useTerminology();

const price = computed(() => props.data?.reminderPlan?.price ?? 19900);
const included = computed(() => props.data?.reminderPlan?.included ?? 500);
const needsPlan = computed(() => Boolean(props.data?.needsAddOn));
const billAmount = computed(() => props.data?.reminderBill?.amount ?? price.value);
const billStatus = computed(() => props.data?.reminderBill?.status ?? null);

const trialDays = computed(() => (props.data?.reminderTrialAvailable && props.data.reminderPlan?.trialDays) || 0);
const priceLine = computed(() => props.data?.reminderTrialAvailable && props.data.reminderPlan?.trialDays
  ? `Free for ${props.data.reminderPlan.trialDays} days, then ${formatCurrency(price.value)} a month.`
  : `${formatCurrency(price.value)} a month.`);

const trialEndText = computed(() => {
  const d = props.data?.reminderTrialUntil;
  if (!d) return "";
  return new Date(`${d}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
});

// "12 reminders sent. 5 members paid ₹4,500 after one." Only once something was sent.
const resultsLine = computed(() => {
  const r = props.data?.trialResults;
  if (!r || r.sent === 0) return "";
  const sent = `${r.sent} ${r.sent === 1 ? "reminder" : "reminders"} sent so far.`;
  if (r.paidCount === 0) return sent;
  const who = r.paidCount === 1 ? t.value.memberLower : t.value.membersLower;
  return `${sent} ${r.paidCount} ${who} paid ${formatCurrency(r.paidAmount)} after one.`;
});

const state = computed<"hidden" | "off" | "pay" | "checking" | "trial" | "on">(() => {
  const d = props.data;
  if (!d || !d.canTurnOnReminders) return "hidden";
  if (d.reminderBlocked === "unpaid") return d.reminderBill?.status === "claimed" ? "checking" : "pay";
  if (d.sendsViaCloud && d.reminderTrialUntil) return "trial";
  if (d.sendsViaCloud) return "on";
  if (!d.settings.autoRemindersEnabled) return "off";
  return "hidden";
});

const points = computed(() => [
  `Every morning we WhatsApp each ${t.value.memberLower} whose fee is due, with your business name`,
  "Each reminder has a Pay now link. The money goes straight to your UPI ID",
  "Up to 3 reminders per fee, 3 days apart. No calls, no awkward chasing",
]);
</script>
