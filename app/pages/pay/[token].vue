<template>
  <div class="min-h-screen bg-slate-50 flex items-start justify-center px-4 py-10">
    <div class="w-full max-w-sm">
      <div v-if="error" class="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm">
        <h1 class="text-lg font-semibold text-slate-800">This link doesn't work</h1>
        <p class="text-sm text-slate-600 mt-2">It may have expired. Please ask for a new payment link.</p>
      </div>

      <div v-else-if="pay" class="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div class="bg-primary-600 px-6 py-5 text-white">
          <p class="text-sm opacity-90">Pay to</p>
          <h1 class="text-xl font-bold leading-tight">{{ pay.orgName }}</h1>
        </div>

        <div class="p-6 space-y-5">
          <!-- Already paid -->
          <div v-if="pay.paid" class="text-center space-y-2">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-success-700">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-base font-semibold text-slate-800">All paid. Thank you, {{ pay.memberFirstName }}!</p>
            <p class="text-sm text-slate-600">Nothing is due on this link.</p>
          </div>

          <template v-else>
            <div>
              <p class="text-sm text-slate-600">Hi {{ pay.memberFirstName }},</p>
              <p class="text-sm text-slate-700 mt-1">
                {{ pay.kind === 'renewal' ? `Renewal of your ${pay.planName} plan` : `Pending amount for your ${pay.planName} plan` }}
              </p>
              <p class="text-4xl font-bold text-slate-800 mt-3 tracking-tight">{{ formatCurrency(pay.amount) }}</p>
            </div>

            <template v-if="pay.upiLink">
              <!-- iPhone has no UPI app picker, so offer the common apps directly. -->
              <div v-if="isIos" class="space-y-2">
                <a
                  v-for="app in iosApps"
                  :key="app.name"
                  :href="app.href"
                  class="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-700"
                >
                  Pay with {{ app.name }}
                </a>
              </div>
              <template v-else>
                <a
                  :href="pay.upiLink"
                  class="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-700"
                >
                  Pay with any UPI app
                </a>
                <p class="text-xs text-slate-600 text-center -mt-2">
                  {{ autoOpened ? "Your UPI app should open now. If it didn't, tap the button." : "Google Pay, PhonePe, Paytm, BHIM or your bank app" }}
                </p>
              </template>

              <div class="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p class="text-xs text-slate-600">Button not working? Pay {{ formatCurrency(pay.amount) }} to this UPI ID:</p>
                <div class="flex items-center justify-between gap-2 mt-1">
                  <p class="text-sm font-mono font-medium text-slate-800 break-all">{{ pay.upiId }}</p>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    @click="copyUpi"
                  >
                    {{ copied ? "Copied" : "Copy" }}
                  </button>
                </div>
                <p class="text-xs text-slate-600 mt-1">Name: {{ pay.payeeName }}</p>
              </div>
            </template>
            <p v-else class="text-sm text-slate-700">Please pay at the front desk on your next visit.</p>

            <div class="border-t border-slate-100 pt-4">
              <p v-if="claimed" class="text-sm text-success-700 text-center">
                Thanks! We've let {{ pay.orgName }} know. They'll confirm your payment soon.
              </p>
              <button
                v-else
                type="button"
                class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                :disabled="claiming"
                @click="claim"
              >
                {{ claiming ? "Please wait…" : "I have paid" }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <p class="text-xs text-slate-600 text-center mt-6">
        Money goes directly to {{ pay?.orgName || "the business" }}.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const token = String(route.params.token);
const { formatCurrency } = useFormatCurrency();

interface PayInfo {
  orgName: string;
  memberFirstName: string;
  planName: string;
  kind: "due" | "renewal";
  amount: number;
  paid: boolean;
  claimed: boolean;
  upiId: string | null;
  payeeName: string;
  upiLink: string | null;
}

const { data: pay, error } = await useFetch<PayInfo>(`/api/pay/${token}`);

// The link preview in WhatsApp shows the business, not us.
useHead(() => ({
  title: pay.value ? `Pay ${pay.value.orgName}` : "Payment link",
  titleTemplate: null,
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: pay.value ? `Pay ${pay.value.orgName}` : "Payment link" },
    { property: "og:description", content: pay.value && !pay.value.paid ? `${formatCurrency(pay.value.amount)} for your ${pay.value.planName} plan. Tap to pay by UPI.` : "Payment link" },
    { property: "og:site_name", content: pay.value?.orgName || "Payment" },
    { name: "description", content: pay.value ? `Pay ${pay.value.orgName} by UPI` : "Payment link" },
  ],
}));

// Open the member's UPI app straight away, once per visit. Android shows its
// app picker; iPhone can't, so it gets one button per app instead.
const isIos = ref(false);
const autoOpened = ref(false);
const iosApps = computed(() => {
  const q = pay.value?.upiLink?.split("?")[1] ?? "";
  return [
    { name: "Google Pay", href: `gpay://upi/pay?${q}` },
    { name: "PhonePe", href: `phonepe://pay?${q}` },
    { name: "Paytm", href: `paytmmp://pay?${q}` },
  ];
});
onMounted(() => {
  const ua = navigator.userAgent || "";
  isIos.value = /iPhone|iPad|iPod/i.test(ua);
  const p = pay.value;
  if (!p?.upiLink || p.paid || claimed.value || !/Android/i.test(ua)) return;
  const key = `upi-opened-${token}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }
  catch {
    // Storage blocked: still open once.
  }
  autoOpened.value = true;
  window.location.href = p.upiLink;
});

const claimed = ref(false);
watch(pay, (p) => { if (p?.claimed) claimed.value = true; }, { immediate: true });
const claiming = ref(false);
async function claim() {
  claiming.value = true;
  try {
    await $fetch(`/api/pay/${token}/claim`, { method: "POST" });
    claimed.value = true;
  }
  catch {
    // Not worth an error screen; let them try again.
  }
  finally {
    claiming.value = false;
  }
}

const copied = ref(false);
async function copyUpi() {
  if (!pay.value?.upiId) return;
  try {
    await navigator.clipboard.writeText(pay.value.upiId);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  }
  catch {
    // Clipboard blocked; the ID is visible to copy by hand.
  }
}
</script>
