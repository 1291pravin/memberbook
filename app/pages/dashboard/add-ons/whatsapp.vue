<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div>
      <NuxtLink to="/dashboard/add-ons" class="text-sm font-medium text-primary-700 hover:underline">← Add-ons</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">Reminders from your own WhatsApp</h1>
      <p class="mt-1 text-sm text-slate-600">
        Connect your WhatsApp Business number once. After that, fee reminders go out from your number, so
        {{ t.membersLower }} see your name and can reply to you directly.
      </p>
    </div>

    <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <AppCard v-if="data && !data.active" class="!bg-accent-50">
      <p class="text-base font-semibold text-slate-800">Switch on "Reminders from your own WhatsApp" first.</p>
      <AppButton class="mt-3" size="sm" @click="navigateTo('/dashboard/add-ons')">Go to add-ons</AppButton>
    </AppCard>

    <template v-else-if="data">
      <!-- Connected -->
      <AppCard v-if="account && account.status !== 'disconnected'">
        <div class="flex items-start gap-3">
          <span class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full" :class="account.ready ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path v-if="account.ready" d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
              <path v-else d="M12 8v4m0 4h.01" stroke-linecap="round" />
            </svg>
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-base font-semibold text-slate-800">
              {{ account.verifiedName || currentOrg?.name }} · {{ account.displayPhoneNumber || 'your number' }}
            </p>
            <p class="mt-0.5 text-sm text-slate-600">{{ statusText }}</p>
            <p v-if="account.status === 'error'" class="mt-2 text-sm text-red-700">
              MemberBook can't reach this number any more. Connect it again below.
            </p>
          </div>
        </div>

        <div v-if="account.ready && !data.autoRemindersEnabled" class="mt-4 rounded-xl bg-primary-50 p-3 text-sm text-slate-700">
          Last step: switch on <span class="font-semibold">Send reminders automatically</span> on the
          <NuxtLink to="/dashboard/collections" class="font-medium text-primary-700 hover:underline">Fees due</NuxtLink> page
          <template v-if="!data.hasUpiId">, after adding your UPI ID</template>.
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <AppButton v-if="!account.ready && account.status === 'connected'" size="sm" variant="secondary" :loading="busy === 'refresh'" @click="refreshStatus">
            Check again
          </AppButton>
          <AppButton v-if="account.status === 'error' && isOwner" size="sm" :loading="busy === 'connect'" @click="connect(account.businessApp)">
            Connect again
          </AppButton>
          <AppButton v-if="isOwner" size="sm" variant="ghost" :loading="busy === 'disconnect'" @click="disconnect">
            Stop using my number
          </AppButton>
        </div>
      </AppCard>

      <!-- Not connected yet -->
      <template v-else>
        <AppCard v-if="!data.signup.ready">
          <p class="text-base font-semibold text-slate-800">Almost ready</p>
          <p class="mt-1 text-sm text-slate-600">We're finishing the setup with Meta. We'll message you as soon as you can connect your number.</p>
        </AppCard>

        <template v-else-if="isOwner">
          <AppCard>
            <p class="text-base font-semibold text-slate-800">Already use the WhatsApp Business app?</p>
            <p class="mt-1 text-sm text-slate-600">
              Keep using it on your phone as usual. MemberBook sends reminders from the same number, and the
              chats show up in your app.
            </p>
            <AppButton class="mt-4" :loading="busy === 'connect' && mode === 'app'" :disabled="!sdkReady" @click="connect(true)">
              Connect my WhatsApp Business app
            </AppButton>
          </AppCard>

          <AppCard>
            <p class="text-base font-semibold text-slate-800">Or use a different number</p>
            <p class="mt-1 text-sm text-slate-600">
              A number that isn't on WhatsApp yet, like a spare SIM. You'll get a code by SMS or call to confirm it.
              This number can then only be used through MemberBook, not the WhatsApp app.
            </p>
            <AppButton class="mt-4" variant="secondary" :loading="busy === 'connect' && mode === 'new'" :disabled="!sdkReady" @click="connect(false)">
              Connect a new number
            </AppButton>
          </AppCard>

          <div class="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
            <p class="font-semibold text-slate-700">What happens</p>
            <ol class="mt-2 list-decimal space-y-1 pl-5">
              <li>A Facebook window opens. Log in with the Facebook account that runs your business.</li>
              <li>Pick or create your business, then pick your WhatsApp number.</li>
              <li>We set up your reminder message. WhatsApp checks it, usually within a few minutes.</li>
            </ol>
            <p class="mt-2">Your number and chats stay yours. You can disconnect any time.</p>
          </div>
        </template>

        <AppCard v-else>
          <p class="text-sm text-slate-700">Ask the owner to connect the business's WhatsApp number.</p>
        </AppCard>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Your own WhatsApp - MemberBook" });

interface OwnAccount {
  status: "connected" | "disconnected" | "error";
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  businessApp: boolean;
  templateStatus: string | null;
  lastError: string | null;
  connectedAt: string | null;
  ready: boolean;
}
interface OwnWhatsAppData {
  active: boolean;
  signup: { appId: string; configId: string; ready: boolean };
  account: OwnAccount | null;
  autoRemindersEnabled: boolean;
  hasUpiId: boolean;
}

interface FbLoginResponse { authResponse?: { code?: string } | null; status?: string }
interface FbSdk {
  init: (o: Record<string, unknown>) => void;
  login: (cb: (r: FbLoginResponse) => void, o: Record<string, unknown>) => void;
}
declare global {
  interface Window { FB?: FbSdk; fbAsyncInit?: () => void }
}

const { orgId, currentOrg } = useOrg();
const { api } = useApi();
const t = useTerminology();
const isOwner = computed(() => currentOrg.value?.role === "owner");

const { data, refresh } = await useFetch<OwnWhatsAppData>(() => `/api/orgs/${orgId.value}/add-ons/whatsapp`, {
  key: `own-whatsapp-${orgId.value}`,
});
const account = computed(() => data.value?.account ?? null);

const statusText = computed(() => {
  const a = account.value;
  if (!a) return "";
  if (a.status === "error") return "Connection lost";
  if (a.ready) return data.value?.autoRemindersEnabled ? "Connected. Reminders go out from this number every morning." : "Connected.";
  switch (a.templateStatus) {
    case "PENDING":
    case "IN_APPEAL":
      return "Connected. WhatsApp is checking your reminder message. This usually takes a few minutes.";
    case "REJECTED":
    case "DISABLED":
    case "PAUSED":
      return "Connected, but WhatsApp didn't approve the reminder message yet. We're on it.";
    default:
      return "Connected. Setting up your reminder message.";
  }
});

const busy = ref<"connect" | "refresh" | "disconnect" | null>(null);
const mode = ref<"app" | "new" | null>(null);
const error = ref("");

function errMsg(e: unknown, fallback: string) {
  return (e as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback;
}

// ------------------------------------------------ Meta's JS SDK + signup popup

const sdkReady = ref(false);
let signupInfo: { wabaId?: string; phoneNumberId?: string } = {};

function onSignupMessage(event: MessageEvent) {
  if (!/^https:\/\/([a-z0-9-]+\.)?facebook\.com$/.test(event.origin)) return;
  let msg: { type?: string; event?: string; data?: { waba_id?: string; phone_number_id?: string; current_step?: string } };
  try {
    msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  }
  catch {
    return;
  }
  if (msg?.type !== "WA_EMBEDDED_SIGNUP") return;
  if (msg.event?.startsWith("FINISH")) {
    signupInfo = { wabaId: msg.data?.waba_id, phoneNumberId: msg.data?.phone_number_id };
  }
  else if (msg.event === "CANCEL") {
    signupInfo = {};
  }
}

function loadSdk() {
  const signup = data.value?.signup;
  if (!signup?.ready || !import.meta.client) return;
  if (window.FB) {
    sdkReady.value = true;
    return;
  }
  window.fbAsyncInit = () => {
    window.FB!.init({ appId: signup.appId, autoLogAppEvents: true, xfbml: false, version: "v22.0" });
    sdkReady.value = true;
  };
  const s = document.createElement("script");
  s.src = "https://connect.facebook.net/en_US/sdk.js";
  s.async = true;
  s.defer = true;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

onMounted(() => {
  window.addEventListener("message", onSignupMessage);
  loadSdk();
});
onBeforeUnmount(() => window.removeEventListener("message", onSignupMessage));
watch(() => data.value?.signup.ready, loadSdk);

function connect(businessApp: boolean) {
  const FB = window.FB;
  const signup = data.value?.signup;
  if (!FB || !signup?.configId) return;
  error.value = "";
  signupInfo = {};
  mode.value = businessApp ? "app" : "new";
  busy.value = "connect";

  FB.login((response) => {
    const code = response.authResponse?.code;
    if (!code) {
      busy.value = null;
      error.value = "The Facebook window was closed before finishing. Tap the button to try again.";
      return;
    }
    // The popup's message with the chosen account usually arrives just before
    // the login callback; give it a moment if it hasn't.
    void finish(code, businessApp);
  }, {
    config_id: signup.configId,
    response_type: "code",
    override_default_response_type: true,
    extras: {
      setup: {},
      featureType: businessApp ? "whatsapp_business_app_onboarding" : "",
      sessionInfoVersion: "3",
    },
  });
}

async function finish(code: string, businessApp: boolean) {
  for (let i = 0; i < 20 && !signupInfo.phoneNumberId; i++) await new Promise(r => setTimeout(r, 250));
  try {
    if (!signupInfo.wabaId || !signupInfo.phoneNumberId) {
      throw { data: { statusMessage: "Facebook didn't tell us which number you picked. Please try again and finish all the steps." } };
    }
    await api(`/api/orgs/${orgId.value}/add-ons/whatsapp/connect`, {
      method: "POST",
      body: JSON.stringify({ code, wabaId: signupInfo.wabaId, phoneNumberId: signupInfo.phoneNumberId, businessApp }),
    });
    await refresh();
  }
  catch (e) {
    error.value = errMsg(e, "Could not connect your number. Please try again.");
  }
  finally {
    busy.value = null;
  }
}

async function refreshStatus() {
  busy.value = "refresh";
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/whatsapp/refresh`, { method: "POST" });
    await refresh();
  }
  catch (e) {
    error.value = errMsg(e, "Could not check right now. Please try again.");
  }
  finally {
    busy.value = null;
  }
}

async function disconnect() {
  if (!window.confirm("Stop sending reminders from your number? You can connect it again later.")) return;
  busy.value = "disconnect";
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/whatsapp/disconnect`, { method: "POST" });
    await refresh();
  }
  catch (e) {
    error.value = errMsg(e, "Could not disconnect. Please try again.");
  }
  finally {
    busy.value = null;
  }
}
</script>
