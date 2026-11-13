<template>
  <div class="p-4 space-y-4 max-w-3xl">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-800">Collections</h1>
        <p class="text-sm text-slate-600 mt-0.5">Who owes you money. Remind them on WhatsApp with a UPI pay link, or mark them paid.</p>
      </div>
      <AppButton v-if="isOwner" size="sm" variant="secondary" class="shrink-0 whitespace-nowrap !px-3" @click="openSettings()">
        <svg class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.3 4.3c.4-1.7 2.9-1.7 3.4 0a1.7 1.7 0 002.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 001 2.5c1.8.4 1.8 2.9 0 3.4a1.7 1.7 0 00-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 00-2.6 1c-.4 1.8-2.9 1.8-3.4 0a1.7 1.7 0 00-2.5-1c-1.6.9-3.3-.9-2.4-2.4a1.7 1.7 0 00-1.1-2.6c-1.7-.4-1.7-2.9 0-3.4a1.7 1.7 0 001.1-2.5c-.9-1.6.8-3.3 2.4-2.4a1.7 1.7 0 002.5-1.1z" /><circle cx="12" cy="12" r="3" /></svg>
        <span class="sm:hidden">Settings</span><span class="hidden sm:inline">Payment settings</span>
      </AppButton>
    </div>

    <!-- UPI ID missing -->
    <div
      v-if="data && !data.settings.upiId"
      class="rounded-xl border border-accent-200 bg-accent-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div class="flex-1">
        <p class="text-sm font-semibold text-slate-800">Add your UPI ID to get paid faster</p>
        <p class="text-sm text-slate-700 mt-0.5">
          Every reminder will include a pay link. {{ t.members }} tap it, their UPI app opens with the amount filled in, and the money goes straight to your account.
        </p>
      </div>
      <AppButton v-if="isOwner" size="sm" @click="openSettings()">Add UPI ID</AppButton>
      <p v-else class="text-sm text-slate-700">Ask the owner to add it.</p>
    </div>

    <!-- Automatic reminders: turn on / pay / checking -->
    <AutoRemindersCard
      :data="data"
      :is-owner="isOwner"
      compact
      @turn-on="openSettings(true)"
      @pay="showPay = true"
    />

    <div
      v-if="data?.reminderBlocked === 'limit'"
      class="rounded-xl border border-accent-200 bg-accent-50 p-4"
    >
      <p class="text-sm font-semibold text-slate-800">Automatic reminders are paused</p>
      <p class="text-sm text-slate-700 mt-0.5">
        You have used all {{ data.reminderUsage?.limit }} WhatsApp reminders for this month. They start again on the 1st.
        Until then, tap <span class="font-medium">Remind</span> to send from your own phone.
      </p>
    </div>
    <p v-if="data" class="text-xs text-slate-600">
      <template v-if="data.sendsViaCloud && data.sendsFrom === 'own'">
        Reminders go out automatically every morning from your WhatsApp number{{ data.sendsFromNumber ? ` (${data.sendsFromNumber})` : '' }}.
      </template>
      <template v-else-if="data.sendsViaCloud">
        Reminders go out automatically every morning from MemberBook's WhatsApp number, with your business name in each message.
      </template>
      <template v-else-if="!data.reminderBlocked">
        Tap <span class="font-medium text-slate-700">Remind</span> and WhatsApp opens with the message ready. Just press send.
      </template>
      <template v-if="data.reminderUsage && data.settings.autoRemindersEnabled && !data.reminderBlocked">
        {{ data.reminderUsage.used }} of {{ data.reminderUsage.limit }} reminders used this month.
      </template>
    </p>

    <!-- Totals -->
    <div v-if="data" class="grid grid-cols-2 gap-3">
      <AppStatCard
        label="Overdue"
        :value="formatCurrency(data.summary.overdueAmount)"
        :subtitle="`${data.summary.overdueCount} ${data.summary.overdueCount === 1 ? t.memberLower : t.membersLower}`"
      />
      <AppStatCard
        :label="`Due in next ${data.settings.reminderDaysBefore} days`"
        :value="formatCurrency(data.summary.upcomingAmount)"
        :subtitle="`${data.summary.upcomingCount} ${data.summary.upcomingCount === 1 ? t.memberLower : t.membersLower}`"
      />
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === tab.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'"
        @click="activeTab = tab.value"
      >
        {{ tab.label }} <span class="text-slate-500">({{ tab.count }})</span>
      </button>
    </div>

    <p v-if="actionError" class="text-sm text-danger-700" role="alert">{{ actionError }}</p>

    <div v-if="status === 'pending' && !data" class="text-sm text-slate-600">Loading…</div>

    <AppEmptyState
      v-else-if="visibleItems.length === 0"
      :title="activeTab === 'overdue' ? 'Nobody is overdue' : 'No renewals coming up'"
      :description="activeTab === 'overdue'
        ? 'Everyone has paid. Nice work!'
        : `No memberships end in the next ${data?.settings.reminderDaysBefore ?? 3} days.`"
    />

    <div v-else class="space-y-2">
      <AppCard v-for="item in visibleItems" :key="item.key" class="!p-4 sm:!p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <NuxtLink :to="`/dashboard/members/${item.memberId}`" class="font-medium text-slate-800 text-sm hover:text-primary-600">
              {{ item.memberName }}
            </NuxtLink>
            <p class="text-xs text-slate-600 mt-0.5">{{ item.planName }} &middot; {{ describe(item) }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-1.5">
              <AppBadge v-if="item.claimedAt" color="yellow">Says paid {{ shortDate(item.claimedAt) }}</AppBadge>
              <span v-if="item.remindersSent > 0" class="text-xs text-slate-600">
                Reminded {{ item.remindersSent }}&times; &middot; last {{ shortDate(item.lastRemindedAt!) }}
              </span>
              <span v-else class="text-xs text-slate-600">Not reminded yet</span>
            </div>
          </div>
          <p class="text-base font-semibold text-slate-800 whitespace-nowrap">{{ formatCurrency(item.amount) }}</p>
        </div>

        <div class="-ml-2.5 mt-2 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
          <template v-if="item.memberPhone">
            <AppAction
              v-if="data?.sendsViaCloud"
              :icon="sentKeys.has(item.key) ? 'check' : 'send'"
              tone="whatsapp"
              :loading="sendingKey === item.key"
              @click="sendViaCloud(item)"
            >
              {{ sentKeys.has(item.key) ? "Sent" : "Send reminder" }}
            </AppAction>
            <AppAction
              v-else
              icon="whatsapp"
              tone="whatsapp"
              :href="getWhatsAppLink(item.memberPhone, item.message)"
              external
              @click="logTapToSend(item)"
            >
              Remind
            </AppAction>
            <AppAction icon="phone" :href="`tel:${item.memberPhone}`">Call</AppAction>
          </template>
          <span v-else class="px-2.5 text-xs text-slate-600">No phone number</span>

          <AppAction icon="check" @click="openMarkPaid(item)">Mark paid</AppAction>
        </div>
      </AppCard>
    </div>

    <!-- Mark paid -->
    <AppModal :open="!!payingItem" title="Mark as paid" size="sm" @close="payingItem = null">
      <form v-if="payingItem" class="space-y-4" @submit.prevent="confirmMarkPaid">
        <div>
          <p class="text-sm text-slate-800 font-medium">{{ payingItem.memberName }}</p>
          <p class="text-sm text-slate-600">
            {{ payingItem.kind === 'renewal' ? `Renew ${payingItem.planName}` : `${payingItem.planName} balance` }}
            &middot; {{ formatCurrency(payingItem.amount) }}
          </p>
        </div>
        <AppSelect v-model="payForm.method" label="Paid by" :options="methodOptions" />
        <AppInput v-model="payForm.date" type="date" label="Payment date" required />
        <div v-if="payingItem.kind === 'renewal'">
          <AppInput v-model="payForm.startDate" type="date" label="New period starts" required />
          <p class="text-xs text-slate-600 mt-1">Defaults to the day after the current period ends.</p>
        </div>
        <p v-if="payError" class="text-sm text-danger-700" role="alert">{{ payError }}</p>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="payingItem = null">Cancel</AppButton>
          <AppButton type="submit" :loading="markingPaid">Mark paid</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Payment settings (owner) -->
    <AppModal :open="showSettings" title="Payment settings" @close="showSettings = false">
      <form class="space-y-4" @submit.prevent="saveSettings">
        <div>
          <AppInput v-model="settingsForm.upiId" label="Your UPI ID" placeholder="e.g. 9876543210@ybl or yourgym@okaxis" />
          <p class="text-xs text-slate-600 mt-1">
            Payments go straight to this UPI ID. MemberBook never holds your money.
            A business UPI ID (PhonePe Business, Paytm for Business, Google Pay for Business) works best, because some apps limit payments to personal UPI IDs from links.
          </p>
        </div>
        <div>
          <AppInput v-model="settingsForm.upiPayeeName" label="Name shown in the UPI app" :placeholder="currentOrg?.name || 'Your business name'" />
        </div>
        <div>
          <AppInput v-model="settingsForm.reminderDaysBefore" type="number" label="Remind this many days before a renewal" />
        </div>

        <div class="rounded-lg border border-slate-200 p-3">
          <label class="flex items-start gap-3" :class="data?.canTurnOnReminders ? 'cursor-pointer' : 'opacity-60'">
            <input
              v-model="settingsForm.autoRemindersEnabled"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600"
              :disabled="!data?.canTurnOnReminders"
              @change="onRemindersTicked"
            >
            <span>
              <span class="block text-sm font-medium text-slate-700">Send reminders automatically</span>
              <span class="block text-xs text-slate-600 mt-0.5">
                <template v-if="data?.cloudAvailable && data?.sendsFrom === 'own'">
                  Every morning, MemberBook sends due reminders from your own WhatsApp number. Up to 3 reminders per payment, 3 days apart.
                </template>
                <template v-else-if="data?.cloudAvailable">
                  Every morning, MemberBook sends due reminders from its WhatsApp number with your business name. Up to 3 reminders per payment, 3 days apart.
                </template>
                <template v-else-if="data?.needsAddOn">
                  Every morning, MemberBook sends due reminders from its WhatsApp number with your business name and a UPI pay link. Up to 3 reminders per payment, 3 days apart.
                  <span class="mt-1 block font-medium text-slate-700">
                    {{ formatCurrency(data.reminderPlan.price) }} a month for up to {{ data.reminderPlan.included }} reminders, paid upfront.
                    <template v-if="settingsForm.autoRemindersEnabled">Save, then pay by UPI on the next screen.</template>
                  </span>
                </template>
                <template v-else>
                  Coming soon: MemberBook will send reminders for you every morning, so you don't have to.
                </template>
              </span>
            </span>
          </label>
        </div>

        <div class="rounded-lg border border-slate-200 p-3">
          <label class="flex items-start gap-3" :class="canThankYou ? 'cursor-pointer' : 'opacity-60'">
            <input
              v-model="settingsForm.thankYouReceipts"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600"
              :disabled="!canThankYou"
            >
            <span>
              <span class="block text-sm font-medium text-slate-700">Send a thank-you with the receipt</span>
              <span class="block text-xs text-slate-600 mt-0.5">
                When you record a payment, we send the {{ t.memberLower }} a WhatsApp thank-you with their PDF receipt.
                Each one counts toward your {{ data?.reminderUsage?.limit ?? 500 }} messages a month.
                <template v-if="!canThankYou">Included with automatic reminders. Tick that first.</template>
                <template v-else-if="data?.needsAddOn || data?.reminderBlocked === 'unpaid'">Included in the {{ formatCurrency(data?.reminderPlan.price ?? 19900) }} plan. Starts with reminders once your payment is confirmed.</template>
              </span>
            </span>
          </label>
        </div>

        <p v-if="settingsError" class="text-sm text-danger-700" role="alert">{{ settingsError }}</p>
        <div class="flex justify-end gap-2">
          <AppButton variant="ghost" @click="showSettings = false">Cancel</AppButton>
          <AppButton type="submit" :loading="savingSettings">Save</AppButton>
        </div>
      </form>
    </AppModal>
    <!-- Pay ₹199 to start automatic reminders -->
    <AppModal :open="showPay && !!data?.reminderBill" title="Start automatic reminders" size="sm" @close="showPay = false">
      <ReminderPayBox
        v-if="data?.reminderBill"
        :bill="data.reminderBill"
        :included="data.reminderPlan.included"
        @claimed="onClaimed"
      />
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { ReminderBill } from "~/components/ReminderPayBox.vue";

definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Collections - MemberBook" });

const { orgId, currentOrg } = useOrg();
const t = useTerminology();
const { formatCurrency } = useFormatCurrency();
const { getWhatsAppLink } = useWhatsApp();

interface CollectionItem {
  key: string;
  kind: "due" | "renewal";
  memberId: number;
  memberName: string;
  memberPhone: string | null;
  subscriptionId: number;
  planName: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  overdue: boolean;
  remindersSent: number;
  lastRemindedAt: string | null;
  claimedAt: string | null;
  payToken: string | null;
  message: string;
}

interface CollectionsResponse {
  settings: { upiId: string | null; upiPayeeName: string | null; autoRemindersEnabled: boolean; reminderDaysBefore: number; thankYouReceipts: boolean };
  cloudAvailable: boolean;
  sendsViaCloud: boolean;
  sendsFrom: "own" | "memberbook" | null;
  sendsFromNumber: string | null;
  needsAddOn: boolean;
  reminderUsage: { used: number; limit: number } | null;
  reminderBlocked: "limit" | "unpaid" | null;
  reminderPaidUntil: string | null;
  canTurnOnReminders: boolean;
  reminderPlan: { price: number; included: number };
  reminderBill: ReminderBill | null;
  summary: { overdueCount: number; overdueAmount: number; upcomingCount: number; upcomingAmount: number };
  items: CollectionItem[];
}

const { data, status, refresh } = await useFetch<CollectionsResponse>(`/api/orgs/${orgId.value}/collections`);

const isOwner = computed(() => currentOrg.value?.role === "owner");
const activeTab = ref<"overdue" | "upcoming">("overdue");
const items = computed(() => data.value?.items ?? []);
const tabs = computed(() => [
  { value: "overdue" as const, label: "Overdue", count: items.value.filter(i => i.overdue).length },
  { value: "upcoming" as const, label: "Due soon", count: items.value.filter(i => !i.overdue).length },
]);
const visibleItems = computed(() => items.value.filter(i => (activeTab.value === "overdue") === i.overdue));

// Open on "Due soon" when nothing is overdue.
watch(data, (d) => {
  if (d && d.summary.overdueCount === 0 && d.summary.upcomingCount > 0) activeTab.value = "upcoming";
}, { immediate: true });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate(value: string): string {
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function describe(item: CollectionItem): string {
  if (item.kind === "due") {
    return item.daysLate > 0 ? `Balance unpaid since ${shortDate(item.dueDate)}` : "Balance due today";
  }
  if (item.daysLate > 0) return `Ended ${plural(item.daysLate, "day")} ago (${shortDate(item.dueDate)})`;
  if (item.daysLate === 0) return "Ends today";
  return `Ends in ${plural(-item.daysLate, "day")} (${shortDate(item.dueDate)})`;
}

const actionError = ref("");
function errorMessage(err: unknown, fallback: string): string {
  const e = err as { data?: { statusMessage?: string; message?: string }; statusMessage?: string };
  return e?.data?.statusMessage || e?.data?.message || e?.statusMessage || fallback;
}

// Tap-to-send: the link opens WhatsApp; record the reminder in the background.
function logTapToSend(item: CollectionItem) {
  $fetch(`/api/orgs/${orgId.value}/collections/remind`, {
    method: "POST",
    body: { subscriptionId: item.subscriptionId, kind: item.kind, channel: "link" },
  }).then(() => {
    item.remindersSent += 1;
    item.lastRemindedAt = new Date().toISOString();
  }).catch(() => {});
}

const sendingKey = ref<string | null>(null);
const sentKeys = ref(new Set<string>());
async function sendViaCloud(item: CollectionItem) {
  actionError.value = "";
  sendingKey.value = item.key;
  try {
    await $fetch(`/api/orgs/${orgId.value}/collections/remind`, {
      method: "POST",
      body: { subscriptionId: item.subscriptionId, kind: item.kind },
    });
    sentKeys.value.add(item.key);
    item.remindersSent += 1;
    item.lastRemindedAt = new Date().toISOString();
  }
  catch (err) {
    actionError.value = errorMessage(err, "Could not send the reminder.");
  }
  finally {
    sendingKey.value = null;
  }
}

// Mark paid
const methodOptions = [
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
];
const payingItem = ref<CollectionItem | null>(null);
const payForm = reactive({ method: "upi", date: "", startDate: "" });
const payError = ref("");
const markingPaid = ref(false);

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

function openMarkPaid(item: CollectionItem) {
  payError.value = "";
  payForm.method = "upi";
  payForm.date = todayLocal();
  payForm.startDate = item.kind === "renewal" ? addDays(item.dueDate, 1) : "";
  payingItem.value = item;
}

async function confirmMarkPaid() {
  if (!payingItem.value) return;
  payError.value = "";
  markingPaid.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/collections/mark-paid`, {
      method: "POST",
      body: {
        subscriptionId: payingItem.value.subscriptionId,
        kind: payingItem.value.kind,
        method: payForm.method,
        date: payForm.date,
        ...(payingItem.value.kind === "renewal" ? { startDate: payForm.startDate } : {}),
      },
    });
    payingItem.value = null;
    await refresh();
  }
  catch (err) {
    payError.value = errorMessage(err, "Could not mark this as paid.");
  }
  finally {
    markingPaid.value = false;
  }
}

// Settings
const showSettings = ref(false);
const settingsForm = reactive({ upiId: "", upiPayeeName: "", reminderDaysBefore: "3", autoRemindersEnabled: false, thankYouReceipts: false });
const settingsError = ref("");
const savingSettings = ref(false);

// The receipt thank-you comes with automatic reminders from MemberBook's number
// (part of the ₹199 plan): it unlocks, and ticks itself, when reminders are ticked.
const canThankYou = computed(() =>
  settingsForm.autoRemindersEnabled && (data.value?.sendsFrom === "memberbook" || !!data.value?.needsAddOn),
);
// Called when the owner ticks reminders (checkbox or a "Turn on" button), not when the form loads.
function onRemindersTicked() {
  if (settingsForm.autoRemindersEnabled && canThankYou.value) settingsForm.thankYouReceipts = true;
}

function openSettings(turnOnReminders = false) {
  const s = data.value?.settings;
  settingsForm.upiId = s?.upiId ?? "";
  settingsForm.upiPayeeName = s?.upiPayeeName ?? "";
  settingsForm.reminderDaysBefore = String(s?.reminderDaysBefore ?? 3);
  settingsForm.autoRemindersEnabled = (s?.autoRemindersEnabled ?? false) || (turnOnReminders && !!data.value?.canTurnOnReminders);
  settingsForm.thankYouReceipts = s?.thankYouReceipts ?? false;
  if (turnOnReminders && !s?.autoRemindersEnabled) onRemindersTicked();
  settingsError.value = "";
  showSettings.value = true;
}

async function saveSettings() {
  settingsError.value = "";
  savingSettings.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/collections/settings`, {
      method: "PUT",
      body: {
        upiId: settingsForm.upiId,
        upiPayeeName: settingsForm.upiPayeeName,
        reminderDaysBefore: Number(settingsForm.reminderDaysBefore),
        ...(data.value?.canTurnOnReminders ? { autoRemindersEnabled: settingsForm.autoRemindersEnabled } : {}),
        ...(canThankYou.value || !settingsForm.autoRemindersEnabled ? { thankYouReceipts: canThankYou.value && settingsForm.thankYouReceipts } : {}),
      },
    });
    showSettings.value = false;
    await refresh();
    // Just switched on the paid plan: go straight to paying for it.
    if (settingsForm.autoRemindersEnabled && data.value?.reminderBill?.status === "due") showPay.value = true;
  }
  catch (err) {
    settingsError.value = errorMessage(err, "Could not save your settings.");
  }
  finally {
    savingSettings.value = false;
  }
}

// Pay for automatic reminders
const showPay = ref(false);
async function onClaimed() {
  showPay.value = false;
  await refresh();
}

// Links from Home: ?turnOn=1 opens settings with reminders ticked, ?pay=1 opens the payment.
const route = useRoute();
onMounted(() => {
  if (!isOwner.value) return;
  if (route.query.pay && data.value?.reminderBill?.status === "due") showPay.value = true;
  else if (route.query.turnOn) openSettings(true);
  if (route.query.pay || route.query.turnOn) navigateTo({ query: {} }, { replace: true });
});
</script>
