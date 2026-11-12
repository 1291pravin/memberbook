<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Add-ons</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-600">
        Website drafts to check, the work queue for the hourly delivery routine, bills to verify, and per-business
        switches for add-ons that aren't open to everyone yet.
      </p>
    </div>

    <p v-if="overview && !overview.billingUpiSet" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      No billing UPI ID yet. Set <code>NUXT_BILLING_UPI_ID</code> (and <code>NUXT_BILLING_PAYEE_NAME</code>) in Cloudflare so bills show a QR code.
      Until then owners see "we'll send payment details on WhatsApp".
    </p>
    <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <!-- Needs review -->
    <AppCard :title="`Website drafts to check (${toReview.length})`">
      <p v-if="!toReview.length" class="text-sm text-slate-600">Nothing to check.</p>
      <div v-for="r in toReview" :key="r.id" class="border-t border-slate-100 py-4 first:border-0 first:pt-0" :class="{ 'rounded-lg bg-primary-50 px-3': highlight === r.id }">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="font-semibold text-slate-800">
            {{ r.orgName }} <span class="text-xs font-normal text-slate-600">#{{ r.id }} · {{ label(r.type) }}</span>
          </p>
          <NuxtLink :to="`/admin/businesses/${r.orgId}`" class="text-sm text-primary-700 hover:underline">Business</NuxtLink>
        </div>
        <p v-if="r.input.change" class="mt-1 text-sm text-slate-700"><span class="font-medium">Owner asked:</span> {{ r.input.change }}</p>
        <p v-if="r.result?.summary" class="mt-1 text-sm text-slate-600"><span class="font-medium">Routine says:</span> {{ r.result.summary }}</p>
        <div class="mt-3 grid gap-3 lg:grid-cols-[390px_1fr]">
          <iframe :src="`/api/admin/service-requests/${r.id}/preview`" title="Draft preview" class="h-[620px] w-full max-w-[390px] rounded-xl border border-slate-200 bg-white" sandbox="" />
          <div class="space-y-3">
            <a :href="`/api/admin/service-requests/${r.id}/preview`" target="_blank" rel="noopener" class="text-sm font-medium text-primary-700 hover:underline">Open full size</a>
            <AppInput v-model="ownerMessages[r.id]" label="Note to the owner (optional)" placeholder="Shown with the preview" />
            <AppButton :loading="busy === `a${r.id}`" @click="review(r.id, 'approve')">Approve, owner can publish</AppButton>
            <div>
              <label :for="`note-${r.id}`" class="mb-1 block text-sm font-medium text-slate-700">Or send back with what to fix</label>
              <textarea :id="`note-${r.id}`" v-model="notes[r.id]" rows="3" class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800" placeholder="Hero photo is dark; prices missing for the yearly plan" />
              <AppButton class="mt-2" size="sm" variant="secondary" :loading="busy === `r${r.id}`" @click="review(r.id, 'reject')">Send back to the routine</AppButton>
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Queue -->
    <AppCard title="Work queue">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="py-2 pr-3">#</th><th class="py-2 pr-3">Business</th><th class="py-2 pr-3">Type</th><th class="py-2 pr-3">Status</th><th class="py-2 pr-3">Asked</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requests ?? []" :key="r.id" class="border-b border-slate-100 align-top">
              <td class="py-2 pr-3 text-slate-600">{{ r.id }}</td>
              <td class="py-2 pr-3 text-slate-800">{{ r.orgName }}</td>
              <td class="py-2 pr-3 text-slate-700">{{ label(r.type) }}</td>
              <td class="py-2 pr-3">
                <AppBadge :color="statusColor(r.status)">{{ r.status.replace('_', ' ') }}</AppBadge>
                <p v-if="r.message" class="mt-1 max-w-xs text-xs text-slate-600">{{ r.message }}</p>
              </td>
              <td class="py-2 pr-3 text-slate-600">{{ ago(r.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!requests?.length" class="py-3 text-sm text-slate-600">No requests yet.</p>
      </div>
    </AppCard>

    <!-- Bills -->
    <AppCard id="bills" :title="`Bills (${overview?.bills.length ?? 0} open)`">
      <ul v-if="overview?.bills.length" class="divide-y divide-slate-100">
        <li v-for="b in overview.bills" :key="b.id" class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-semibold text-slate-800">{{ b.orgName }} · {{ formatRupees(b.amount) }} <span class="font-normal text-slate-600">for {{ b.period }}</span></p>
            <p class="text-sm text-slate-600">
              {{ b.items.map(i => i.name).join(', ') }}
              <template v-if="b.status === 'claimed'"> · <span class="font-medium text-amber-800">says paid, UPI ref {{ b.upiRef }}</span></template>
            </p>
          </div>
          <div class="flex gap-2">
            <AppButton size="sm" :disabled="b.status !== 'claimed'" @click="billAction(b.id, 'verify')">Mark paid</AppButton>
            <AppButton size="sm" variant="ghost" @click="billAction(b.id, 'waive')">Waive</AppButton>
            <AppButton v-if="b.status === 'claimed'" size="sm" variant="ghost" @click="billAction(b.id, 'reopen')">Not received</AppButton>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-slate-600">No open bills.</p>
    </AppCard>

    <!-- Who has what -->
    <AppCard title="Who has what">
      <div class="grid gap-4 md:grid-cols-2">
        <div v-for="a in overview?.catalog ?? []" :key="a.key" class="rounded-xl border border-slate-200 p-3">
          <p class="font-semibold text-slate-800">
            {{ a.name }}
            <AppBadge :color="a.ready ? 'green' : 'gray'" class="ml-1">{{ a.ready ? 'open to all' : 'flagged' }}</AppBadge>
          </p>
          <p v-if="a.waitingOn" class="text-xs text-slate-600">Waiting on: {{ a.waitingOn }}</p>
          <p class="mt-2 text-sm text-slate-700">
            On: {{ rowsFor(a.key, 'active').map(r => r.orgName).join(', ') || 'nobody' }}
          </p>
          <p class="text-sm text-slate-700">
            Want it: {{ rowsFor(a.key, 'notify').map(r => r.orgName).join(', ') || 'nobody yet' }}
          </p>
        </div>
      </div>
      <div v-if="overview?.websites.length" class="mt-4">
        <p class="text-sm font-semibold text-slate-800">Live websites</p>
        <ul class="mt-1 text-sm">
          <li v-for="w in overview.websites" :key="w.orgId">
            {{ w.orgName }}: <a :href="w.url" target="_blank" rel="noopener" class="text-primary-700 hover:underline">{{ w.url }}</a> <span class="text-slate-600">({{ w.status }})</span>
          </li>
        </ul>
      </div>
    </AppCard>

    <!-- Switches -->
    <AppCard title="Switches for one business">
      <p class="text-sm text-slate-600">
        "Let them use it" is the feature flag: it lets this business switch on an add-on that is still flagged. Use it on
        a test business first. Start and Stop switch the add-on on or off for them.
      </p>
      <div class="mt-3 max-w-md">
        <AppSelect v-model="switchOrgId" label="Business" :options="orgOptions" placeholder="Pick a business" />
      </div>
      <div v-if="switchStates.length" class="mt-4 divide-y divide-slate-100">
        <div v-for="s in switchStates" :key="s.key" class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="font-medium text-slate-800">{{ nameOf(s.key) }}</p>
            <p class="text-xs text-slate-600">
              {{ s.status }}<template v-if="s.trialEndsOn"> · free till {{ s.trialEndsOn }}</template>
              · {{ s.available ? 'can use' : 'not open to them' }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton v-if="!isReady(s.key)" size="sm" variant="secondary" @click="switchAction(s.key, s.adminEnabled ? 'disable' : 'enable')">
              {{ s.adminEnabled ? 'Stop letting them use it' : 'Let them use it' }}
            </AppButton>
            <AppButton v-if="s.available && s.status !== 'active'" size="sm" @click="switchAction(s.key, 'start')">Start</AppButton>
            <AppButton v-if="s.status === 'active'" size="sm" variant="ghost" @click="switchAction(s.key, 'stop')">Stop</AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useHead({ title: "Add-ons - MemberBook Admin" });

interface Req {
  id: number;
  orgId: number;
  orgName: string;
  type: string;
  status: string;
  input: { change?: string };
  result: { summary?: string } | null;
  message: string | null;
  createdAt: string;
}
interface Overview {
  catalog: { key: string; name: string; price: number; ready: boolean; waitingOn: string | null }[];
  addOns: { orgId: number; orgName: string; addOn: string; status: string; adminEnabled: boolean }[];
  bills: { id: number; orgName: string; period: string; amount: number; items: { name: string }[]; status: string; upiRef: string | null }[];
  websites: { orgId: number; orgName: string; url: string; status: string }[];
  billingUpiSet: boolean;
}
interface SwitchState { key: string; status: string; available: boolean; adminEnabled: boolean; trialEndsOn: string | null }

const { formatRupees, ago } = useAdmin();
const requestFetch = useRequestFetch();
const highlight = Number(useRoute().query.request) || null;

const { data: requests, refresh: refreshRequests } = await useAsyncData<Req[]>("admin-service-requests", () => requestFetch<Req[]>("/api/admin/service-requests"));
const { data: overview, refresh: refreshOverview } = await useAsyncData<Overview>("admin-add-ons", () => requestFetch<Overview>("/api/admin/add-ons"));
const { data: businesses } = await useAsyncData("admin-add-on-orgs", () => requestFetch<{ businesses: { id: number; name: string }[] }>("/api/admin/businesses?all=1"));

const toReview = computed(() => (requests.value ?? []).filter(r => r.status === "needs_review"));
const orgOptions = computed(() => (businesses.value?.businesses ?? []).map(b => ({ value: String(b.id), label: `${b.name} (#${b.id})` })));

const busy = ref("");
const error = ref("");
const notes = reactive<Record<number, string>>({});
const ownerMessages = reactive<Record<number, string>>({});

function errMsg(e: unknown) {
  return (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Something went wrong";
}

async function review(id: number, action: "approve" | "reject") {
  busy.value = `${action === "approve" ? "a" : "r"}${id}`;
  error.value = "";
  try {
    await $fetch(`/api/admin/service-requests/${id}/review`, { method: "POST", body: { action, note: notes[id], message: ownerMessages[id] } });
    await refreshRequests();
  }
  catch (e) {
    error.value = errMsg(e);
  }
  finally {
    busy.value = "";
  }
}

async function billAction(id: number, action: "verify" | "waive" | "reopen") {
  if (action === "waive" && !window.confirm("Waive this bill?")) return;
  try {
    await $fetch(`/api/admin/add-on-bills/${id}`, { method: "POST", body: { action } });
    await refreshOverview();
  }
  catch (e) {
    error.value = errMsg(e);
  }
}

const switchOrgId = ref("");
const switchStates = ref<SwitchState[]>([]);
watch(switchOrgId, async (id) => {
  switchStates.value = id ? await $fetch<SwitchState[]>(`/api/admin/orgs/${id}/add-ons`) : [];
});
async function switchAction(key: string, action: string) {
  error.value = "";
  try {
    await $fetch(`/api/admin/orgs/${switchOrgId.value}/add-ons`, { method: "POST", body: { addOn: key, action } });
    switchStates.value = await $fetch<SwitchState[]>(`/api/admin/orgs/${switchOrgId.value}/add-ons`);
    await refreshOverview();
  }
  catch (e) {
    error.value = errMsg(e);
  }
}

function rowsFor(key: string, status: string) {
  return (overview.value?.addOns ?? []).filter(r => r.addOn === key && r.status === status);
}
function nameOf(key: string) {
  return overview.value?.catalog.find(c => c.key === key)?.name ?? key;
}
function isReady(key: string) {
  return Boolean(overview.value?.catalog.find(c => c.key === key)?.ready);
}
function label(type: string) {
  return ({ website_build: "New website", website_change: "Website change", review_reply: "Review reply", review_summary: "Review summary" } as Record<string, string>)[type] ?? type;
}
function statusColor(status: string) {
  return (({ new: "blue", working: "yellow", needs_review: "red", ready: "green", done: "green", failed: "red" }) as Record<string, "blue" | "yellow" | "red" | "green">)[status] ?? "gray";
}
</script>
