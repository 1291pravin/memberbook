<template>
  <div>
    <template v-if="bill.status === 'claimed'">
      <p class="text-base font-semibold text-slate-800">Thanks, we're checking your payment</p>
      <p class="mt-1 text-sm text-slate-700">
        UPI reference {{ bill.upiRef }}. Automatic reminders start the morning after we confirm it, usually within a day.
      </p>
    </template>

    <template v-else>
      <p class="text-sm text-slate-700">
        Pay {{ formatCurrency(bill.amount) }} for the first 30 days. That covers up to {{ included }} WhatsApp reminders.
        Reminders start the morning after we confirm your payment.
      </p>

      <div v-if="bill.upiLink" class="mt-4 space-y-3">
        <div class="flex justify-center rounded-2xl border border-slate-200 bg-white p-3" v-html="qrSvg(bill.upiLink)" />
        <a
          :href="bill.upiLink"
          class="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Pay {{ formatCurrency(bill.amount) }} with any UPI app
        </a>
        <p class="text-center text-xs text-slate-600">Or pay {{ bill.payTo }} ({{ bill.payeeName }})</p>
      </div>
      <p v-else class="mt-3 text-sm text-slate-700">We'll send you payment details on WhatsApp.</p>

      <form class="mt-4 space-y-2" @submit.prevent="claim">
        <AppInput v-model="upiRef" label="Paid? Enter the UPI reference number" placeholder="12-digit number from your UPI app" />
        <p v-if="error" class="text-sm text-danger-700" role="alert">{{ error }}</p>
        <AppButton type="submit" class="w-full" :loading="claiming">I have paid</AppButton>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
// The ₹199 payment for automatic WhatsApp reminders: QR, UPI button and the
// "I have paid" form. Used in Fees due (settings and the pay banner).
import { renderSVG } from "uqr";

export interface ReminderBill {
  id: number;
  amount: number;
  status: string;
  upiRef: string | null;
  upiLink: string | null;
  payTo: string | null;
  payeeName: string;
}

const props = defineProps<{ bill: ReminderBill; included: number }>();
const emit = defineEmits<{ claimed: [] }>();

const { orgId } = useOrg();
const { formatCurrency } = useFormatCurrency();

const upiRef = ref("");
const claiming = ref(false);
const error = ref("");

async function claim() {
  claiming.value = true;
  error.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/add-ons/bills/${props.bill.id}/claim`, { method: "POST", body: { upiRef: upiRef.value } });
    emit("claimed");
  }
  catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Could not save. Please try again.";
  }
  finally {
    claiming.value = false;
  }
}

function qrSvg(text: string) {
  return renderSVG(text, { border: 1 }).replace("<svg ", "<svg width=\"176\" height=\"176\" role=\"img\" aria-label=\"UPI QR code\" ");
}
</script>
