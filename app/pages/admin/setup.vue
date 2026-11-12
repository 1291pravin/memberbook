<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Set up a business</h1>
      <p class="mt-1 max-w-2xl text-sm text-slate-600">
        For owners who sent us their register. Create the business here, open it to add plans and members,
        then send the owner their link. When they open it and sign in, the business becomes theirs.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <AppCard title="New business">
        <form class="space-y-4" @submit.prevent="create">
          <AppInput v-model="form.name" label="Business name" placeholder="e.g. Iron Temple Gym" required />
          <AppSelect v-model="form.type" label="Type" :options="typeOptions" required />
          <AppInput
            v-model="form.ownerWhatsapp"
            label="Owner's WhatsApp number"
            type="tel"
            placeholder="98765 43210"
          />
          <AppInput
            v-model="form.upiId"
            label="Owner's UPI ID (optional)"
            placeholder="name@okhdfcbank"
          />
          <div v-if="createError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ createError }}
          </div>
          <AppButton type="submit" class="w-full" :loading="creating">
            Create business
          </AppButton>
        </form>
      </AppCard>

      <AppCard title="Businesses we set up">
        <div v-if="pending" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load the list.
        </div>
        <ul v-else-if="data?.businesses.length" class="divide-y divide-slate-100">
          <li
            v-for="biz in data.businesses"
            :key="biz.id"
            class="py-4"
            :class="{ 'rounded-lg bg-primary-50 px-3': biz.id === highlightId }"
          >
            <div class="flex flex-col gap-3 2xl:flex-row 2xl:items-start 2xl:justify-between">
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-slate-800">
                  {{ biz.name }}
                  <span class="ml-1 text-xs font-normal capitalize text-slate-600">{{ biz.type }}</span>
                </p>
                <p class="mt-0.5 text-sm text-slate-600">
                  {{ biz.plans }} {{ biz.plans === 1 ? "plan" : "plans" }} ·
                  {{ biz.members }} {{ biz.members === 1 ? "member" : "members" }} ·
                  <span :class="biz.upiSet ? 'text-slate-600' : 'font-medium text-amber-700'">
                    {{ biz.upiSet ? "UPI set" : "No UPI ID" }}
                  </span>
                  <template v-if="biz.ownerWhatsapp"> · {{ biz.ownerWhatsapp }}</template>
                </p>
                <p class="mt-1 text-sm">
                  <AppBadge v-if="!biz.heldBySetup" color="green">
                    Owner took over {{ formatDate(biz.claimedAt) }}
                  </AppBadge>
                  <AppBadge v-else-if="biz.inviteUrl" color="yellow">
                    Waiting for owner · link valid till {{ formatDate(biz.inviteExpiresAt) }}
                  </AppBadge>
                  <AppBadge v-else color="red">
                    Link expired, make a new one
                  </AppBadge>
                  <span v-if="!biz.heldBySetup && biz.ownerName" class="ml-2 text-slate-600">{{ biz.ownerName }}</span>
                </p>
              </div>
              <div class="flex shrink-0 flex-wrap gap-2">
                <AppButton size="sm" :loading="openingId === biz.id" @click="open(biz)">
                  Open
                </AppButton>
                <label class="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {{ addingDataId === biz.id ? "Sending..." : "Add data" }}
                  <input
                    type="file"
                    multiple
                    class="sr-only"
                    accept="image/*,.pdf,.csv,.xls,.xlsx,.ods,.txt"
                    :disabled="addingDataId === biz.id"
                    @change="addData(biz, $event)"
                  >
                </label>
                <template v-if="biz.heldBySetup">
                  <a
                    v-if="biz.inviteUrl && biz.ownerWhatsapp"
                    :href="whatsAppLink(biz)"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Send link on WhatsApp
                  </a>
                  <AppButton v-if="biz.inviteUrl" size="sm" variant="secondary" @click="copy(biz)">
                    {{ copiedId === biz.id ? "Copied" : "Copy link" }}
                  </AppButton>
                  <AppButton size="sm" variant="ghost" :loading="linkingId === biz.id" @click="newLink(biz)">
                    New link
                  </AppButton>
                </template>
              </div>
            </div>
          </li>
        </ul>
        <AppEmptyState
          v-else
          title="Nothing set up yet"
          description="When an owner sends their register, create their business on the left."
        />
      </AppCard>
    </div>

    <AppCard title="Data uploads">
      <p class="mb-3 text-xs text-slate-600">
        Everything owners send (or we add for them). The AI loading routine picks up waiting uploads every hour,
        loads plans and members, and the owner sees the result on their "Send us your data" page.
      </p>
      <div v-if="uploadsPending" class="h-16 animate-pulse rounded-lg bg-slate-100" />
      <ul v-else-if="uploads?.length" class="divide-y divide-slate-100">
        <li v-for="u in uploads" :key="u.id" class="py-3">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-800">
                #{{ u.id }} · {{ u.orgName }}
                <span class="ml-1 text-xs font-normal text-slate-600">from {{ u.source }}, {{ formatDateTime(u.createdAt) }}</span>
              </p>
              <p class="mt-0.5 text-sm text-slate-600">
                <template v-for="(f, i) in u.files" :key="i">
                  <a :href="`/api/admin/uploads/${u.id}/files/${i}`" class="text-primary-700 hover:underline">{{ f.name }}</a><span v-if="i < u.files.length - 1">, </span>
                </template>
                <span v-if="u.hasText">{{ u.files.length ? " + " : "" }}pasted text</span>
              </p>
              <p v-if="u.note" class="mt-0.5 text-sm text-slate-600">Note: {{ u.note }}</p>
              <p v-if="u.result" class="mt-1 text-sm text-slate-800">
                {{ u.result.membersLoaded }} members, {{ u.result.plansCreated }} new plans, {{ u.result.dueNow }} due now,
                {{ u.result.skipped.length }} skipped
              </p>
              <p v-if="u.message" class="mt-1 text-sm text-red-700">{{ u.message }}</p>
            </div>
            <AppBadge :color="uploadColor(u.status)">{{ u.status }}</AppBadge>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-slate-600">No uploads yet.</p>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

interface SetupBusiness {
  id: number;
  name: string;
  type: string;
  ownerWhatsapp: string | null;
  upiSet: boolean;
  createdAt: string;
  members: number;
  plans: number;
  heldBySetup: boolean;
  ownerEmail: string | null;
  ownerName: string | null;
  claimedAt: string | null;
  inviteStatus: string | null;
  inviteUrl: string | null;
  inviteExpiresAt: string | null;
}

const typeOptions = [
  { value: "gym", label: "Gym" },
  { value: "library", label: "Library" },
  { value: "tuition", label: "Coaching / tuition" },
  { value: "other", label: "Other" },
];

const form = reactive({ name: "", type: "gym", ownerWhatsapp: "", upiId: "" });
const creating = ref(false);
const createError = ref("");
const highlightId = ref<number | null>(null);
const openingId = ref<number | null>(null);
const linkingId = ref<number | null>(null);
const copiedId = ref<number | null>(null);

interface UploadRow {
  id: number;
  orgName: string;
  source: string;
  status: string;
  files: { name: string }[];
  hasText: boolean;
  note: string | null;
  result: { membersLoaded: number; plansCreated: number; dueNow: number; skipped: unknown[] } | null;
  message: string | null;
  createdAt: string;
}

const { data: uploads, pending: uploadsPending, refresh: refreshUploads } = await useFetch<UploadRow[]>(
  "/api/admin/uploads",
  { key: "admin-uploads" },
);
const addingDataId = ref<number | null>(null);

async function addData(biz: SetupBusiness, e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  addingDataId.value = biz.id;
  try {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    await $fetch(`/api/admin/setups/${biz.id}/upload`, { method: "POST", body: form });
    await refreshUploads();
  }
  catch (err: unknown) {
    const e2 = err as { data?: { statusMessage?: string } };
    window.alert(e2.data?.statusMessage || "Upload failed");
  }
  finally {
    addingDataId.value = null;
  }
}

function uploadColor(status: string) {
  return ({ pending: "yellow", processing: "blue", done: "green", failed: "red" } as const)[status as "pending"] ?? "gray";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

const { data, pending, error, refresh } = await useFetch<{ setupEmail: string; businesses: SetupBusiness[] }>(
  "/api/admin/setups",
  { key: "admin-setups" },
);

async function create() {
  createError.value = "";
  creating.value = true;
  try {
    const result = await $fetch<{ orgId: number; inviteUrl: string }>("/api/admin/setups", {
      method: "POST",
      body: { ...form },
    });
    Object.assign(form, { name: "", type: "gym", ownerWhatsapp: "", upiId: "" });
    highlightId.value = result.orgId;
    await refresh();
  }
  catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    createError.value = err.data?.statusMessage || "Could not create the business";
  }
  finally {
    creating.value = false;
  }
}

async function open(biz: SetupBusiness) {
  const email = biz.heldBySetup ? data.value?.setupEmail : biz.ownerEmail;
  if (!email) return;
  openingId.value = biz.id;
  try {
    const result = await $fetch<{ redirectTo: string }>("/api/admin/autologin", {
      method: "POST",
      body: { email, orgId: biz.id },
    });
    await navigateTo(result.redirectTo || "/dashboard");
  }
  finally {
    openingId.value = null;
  }
}

async function newLink(biz: SetupBusiness) {
  linkingId.value = biz.id;
  try {
    await $fetch(`/api/admin/setups/${biz.id}/link`, { method: "POST" });
    highlightId.value = biz.id;
    await refresh();
  }
  finally {
    linkingId.value = null;
  }
}

async function copy(biz: SetupBusiness) {
  if (!biz.inviteUrl) return;
  try {
    await navigator.clipboard.writeText(biz.inviteUrl);
    copiedId.value = biz.id;
    setTimeout(() => {
      if (copiedId.value === biz.id) copiedId.value = null;
    }, 2000);
  }
  catch {
    window.prompt("Copy this link", biz.inviteUrl);
  }
}

function whatsAppLink(biz: SetupBusiness) {
  const digits = (biz.ownerWhatsapp || "").replace(/\D/g, "");
  const text = `Hi! Your ${biz.name} account on MemberBook is ready, with your members and plans already added.\n\n`
    + `Open this link and sign in with Google (or create a password) to take it over:\n${biz.inviteUrl}\n\n`
    + `The link works for 30 days. Reply here if you need any help.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
</script>
