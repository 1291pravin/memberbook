<template>
  <div class="p-4 lg:p-6 space-y-6 max-w-3xl">
    <header>
      <h1 class="text-xl font-bold text-slate-800">Help &amp; support</h1>
      <p class="mt-1 text-sm text-slate-600">
        Stuck on something? We usually reply fastest on WhatsApp.
        <span v-if="hours">Support hours: <strong class="font-semibold text-slate-700">{{ hours }}</strong>.</span>
      </p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <!-- WhatsApp -->
      <AppCard v-if="whatsappNumber">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E]">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.05 4.91A10 10 0 0 0 2.05 14.83l-1.4 5.16 5.28-1.39A10 10 0 1 0 19.05 4.9zm-7.04 15.37a8 8 0 0 1-4.06-1.11l-.29-.17-3.13.82.83-3.05-.19-.31a8 8 0 1 1 6.84 3.82zm4.39-6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.92-1.18-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" /></svg>
          </div>
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-slate-800">WhatsApp</h2>
            <p class="mt-0.5 text-sm text-slate-600">{{ whatsappDisplay }}</p>
            <a
              :href="whatsappLink(helpMessage(currentOrg?.name))"
              target="_blank"
              rel="noopener"
              class="mt-3 inline-flex items-center rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </AppCard>

      <!-- Email -->
      <AppCard v-if="email">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-slate-800">Email</h2>
            <p class="mt-0.5 truncate text-sm text-slate-600">{{ email }}</p>
            <a
              :href="emailLink(`Help needed: ${currentOrg?.name ?? 'MemberBook'}`)"
              class="mt-3 inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Send an email
            </a>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Help form -->
    <AppCard title="Send us a message">
      <div v-if="sent" class="rounded-lg bg-green-50 p-4 text-sm text-green-800">
        <p class="font-semibold">Thanks, we got your message.</p>
        <p class="mt-1">
          We'll get back to you<span v-if="hours"> during support hours ({{ hours }})</span>.
          <template v-if="whatsappNumber">
            Need it sooner?
            <a :href="whatsappLink(sentWhatsAppMessage)" target="_blank" rel="noopener" class="font-semibold underline">Send it on WhatsApp</a>.
          </template>
        </p>
        <button type="button" class="mt-3 text-sm font-medium text-green-900 underline" @click="resetForm">
          Send another message
        </button>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <p class="text-sm text-slate-600">
          We'll reply to <strong class="font-semibold text-slate-700">{{ user?.email }}</strong>. Add your phone number if you'd like a call back.
        </p>
        <AppInput
          id="support-phone"
          v-model="form.phone"
          label="Phone (optional)"
          type="tel"
          placeholder="+91 98765 43210"
        />
        <div>
          <label for="support-message" class="block text-sm font-medium text-slate-700 mb-1">What do you need help with?</label>
          <textarea
            id="support-message"
            v-model="form.message"
            rows="5"
            maxlength="5000"
            required
            class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="For example: how do I add a new plan, or a payment is showing twice"
          />
        </div>
        <p v-if="error" class="text-sm text-danger-600">{{ error }}</p>
        <AppButton type="submit" :loading="sending">Send message</AppButton>
      </form>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Help & support - MemberBook" });

const { user } = useUserSession();
const { currentOrg, orgId } = useOrg();
const { whatsappNumber, whatsappDisplay, email, hours, whatsappLink, helpMessage, emailLink } = useSupport();

const form = reactive({ phone: "", message: "" });
const sending = ref(false);
const sent = ref(false);
const sentWhatsAppMessage = ref("");
const error = ref("");

async function submit() {
  error.value = "";
  if (!form.message.trim()) {
    error.value = "Please tell us what you need help with.";
    return;
  }
  sending.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/support`, {
      method: "POST",
      body: { phone: form.phone, message: form.message },
    });
    sentWhatsAppMessage.value = helpMessage(currentOrg.value?.name) + form.message.trim();
    sent.value = true;
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string };
    error.value = err?.data?.statusMessage || err?.statusMessage || "Could not send your message. Please try WhatsApp instead.";
  }
  finally {
    sending.value = false;
  }
}

function resetForm() {
  form.phone = "";
  form.message = "";
  sent.value = false;
}
</script>
