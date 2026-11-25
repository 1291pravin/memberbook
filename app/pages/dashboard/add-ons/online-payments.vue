<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div>
      <NuxtLink to="/dashboard/add-ons" class="text-sm font-medium text-primary-700 hover:underline">← Add-ons</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">Payments that confirm themselves</h1>
      <p class="mt-1 text-sm text-slate-600">
        Connect your own Razorpay account. Members pay from the same reminder link by UPI, card or net banking,
        and MemberBook marks them paid and renews them on its own. The money goes to your Razorpay account. We take no cut.
      </p>
    </div>

    <AppCard v-if="!isOwner">
      <p class="text-sm text-slate-700">Only the owner can connect Razorpay.</p>
    </AppCard>

    <template v-else-if="data?.connected">
      <AppCard title="Razorpay is connected">
        <div class="flex items-start gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700" aria-hidden="true">✓</span>
          <div class="min-w-0 text-sm text-slate-700">
            <p>Key <span class="font-mono text-slate-800">{{ data.keyId }}</span></p>
            <p v-if="data.testMode" class="mt-1 font-medium text-amber-800">These are test keys, so no real money moves. Connect your live keys when you're ready.</p>
            <p class="mt-1">Every pay link now shows a "Pay now" button. Payments show up in Payments with the note "Paid online via Razorpay".</p>
          </div>
        </div>
      </AppCard>

      <AppCard title="Recommended: add a webhook">
        <p class="text-sm text-slate-700">
          This confirms payments even when a member closes the page before it finishes. In Razorpay, open
          <strong>Account &amp; Settings → Webhooks → Add new webhook</strong>, paste these two, tick the event
          <strong>payment_link.paid</strong>, and save.
        </p>
        <div class="mt-3 space-y-2">
          <div v-for="f in webhookFields" :key="f.label" class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs font-medium text-slate-600">{{ f.label }}</p>
            <div class="mt-1 flex items-center justify-between gap-2">
              <p class="break-all font-mono text-sm text-slate-800">{{ f.value }}</p>
              <button type="button" class="shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100" @click="copy(f.value, f.label)">
                {{ copied === f.label ? "Copied" : "Copy" }}
              </button>
            </div>
          </div>
        </div>
      </AppCard>

      <div class="flex flex-wrap gap-2">
        <AppButton variant="secondary" size="sm" @click="showForm = !showForm">Change keys</AppButton>
        <AppButton variant="ghost" size="sm" :loading="disconnecting" @click="disconnect">Disconnect</AppButton>
      </div>
    </template>

    <AppCard v-if="isOwner && (!data?.connected || showForm)" :title="data?.connected ? 'New keys' : 'Connect Razorpay'">
      <ol class="mb-4 list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Sign in to <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener" class="font-medium text-primary-700 underline">dashboard.razorpay.com</a> (or sign up free; Razorpay checks your KYC).</li>
        <li>Open <strong>Account &amp; Settings → API Keys</strong> and generate a key.</li>
        <li>Paste the Key ID and Key Secret here. We check them with Razorpay and store the secret encrypted.</li>
      </ol>
      <form class="space-y-3" @submit.prevent="connect">
        <AppInput v-model="form.keyId" label="Key ID" placeholder="rzp_live_..." />
        <AppInput v-model="form.keySecret" type="password" label="Key Secret" placeholder="Paste the secret" />
        <p v-if="formError" class="text-sm text-danger-700">{{ formError }}</p>
        <AppButton type="submit" :loading="saving">Connect</AppButton>
      </form>
      <p class="mt-3 text-xs text-slate-600">Razorpay charges its own small fee on each payment (see their pricing page). MemberBook charges nothing for this.</p>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Online payments - MemberBook" });

const { orgId, currentOrg } = useOrg();
const isOwner = computed(() => currentOrg.value?.role === "owner");

interface RazorpayStatus { connected: boolean; keyId: string | null; testMode: boolean; webhookUrl: string; webhookSecret: string | null }
const { data, refresh } = await useFetch<RazorpayStatus>(
  () => `/api/orgs/${orgId.value}/razorpay`,
  { key: `razorpay-${orgId.value}`, immediate: isOwner.value },
);

const webhookFields = computed(() => [
  { label: "Webhook URL", value: data.value?.webhookUrl ?? "" },
  { label: "Secret", value: data.value?.webhookSecret ?? "" },
]);

const form = reactive({ keyId: "", keySecret: "" });
const formError = ref("");
const saving = ref(false);
const showForm = ref(false);
async function connect() {
  formError.value = "";
  saving.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/razorpay`, { method: "PUT", body: { keyId: form.keyId, keySecret: form.keySecret } });
    form.keyId = "";
    form.keySecret = "";
    showForm.value = false;
    await refresh();
  }
  catch (e) {
    const err = e as { data?: { statusMessage?: string } };
    formError.value = err.data?.statusMessage || "Couldn't connect. Please check the keys.";
  }
  finally {
    saving.value = false;
  }
}

const disconnecting = ref(false);
async function disconnect() {
  disconnecting.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/razorpay`, { method: "DELETE" });
    await refresh();
  }
  finally {
    disconnecting.value = false;
  }
}

const copied = ref("");
async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    copied.value = label;
    setTimeout(() => (copied.value = ""), 2000);
  }
  catch { /* clipboard blocked; the text is visible */ }
}
</script>
