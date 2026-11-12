<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div class="print:hidden">
      <NuxtLink to="/dashboard/add-ons" class="text-sm font-medium text-primary-700 hover:underline">← Add-ons</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">Member self check-in</h1>
      <p class="mt-1 text-sm text-slate-600">
        Print the poster and put it at your door. {{ t.members }} scan it with their phone camera, type their number
        once, and they're checked in. They see their streak, which keeps them coming.
      </p>
    </div>

    <AppCard v-if="data && !data.active" class="!bg-accent-50 print:hidden">
      <p class="text-base font-semibold text-slate-800">Switch on self check-in first. It's free.</p>
      <AppButton class="mt-3" size="sm" @click="navigateTo('/dashboard/add-ons')">Go to add-ons</AppButton>
    </AppCard>

    <template v-else-if="data?.active">
      <!-- Poster -->
      <div class="rounded-3xl border border-slate-200 bg-white p-6 text-center print:border-0 print:p-0">
        <p class="text-sm font-semibold uppercase tracking-wide text-primary-700">{{ currentOrg?.name }}</p>
        <h2 class="mt-2 text-3xl font-extrabold text-slate-800">Scan to check in</h2>
        <p class="mt-1 text-slate-600">Open your phone camera and point it here</p>
        <div class="mx-auto mt-5 w-64 max-w-full" v-html="qr" />
        <p class="mt-4 break-all text-xs text-slate-600">{{ data.url }}</p>
      </div>

      <div class="flex flex-wrap gap-2 print:hidden">
        <AppButton @click="printPoster">Print poster</AppButton>
        <AppButton variant="secondary" @click="copy">{{ copied ? 'Copied' : 'Copy link' }}</AppButton>
        <AppButton v-if="isOwner" variant="ghost" @click="reset">Make a new link</AppButton>
      </div>

      <AppCard class="print:hidden" :title="`Checked themselves in today: ${data.selfCheckInsToday}`">
        <p class="text-sm text-slate-600">
          All check-ins, from the door and the desk, are on the
          <NuxtLink to="/dashboard/check-ins" class="font-medium text-primary-700 hover:underline">Check-ins page</NuxtLink>.
        </p>
      </AppCard>

      <AppCard class="print:hidden" title="Stopped coming">
        <p class="text-sm text-slate-600">
          {{ t.members }} with a running plan who haven't checked in for {{ data.stoppedComingDays }} days or more. A quick
          message now stops them from quitting.
        </p>
        <ul v-if="data.stoppedComing?.length" class="mt-3 divide-y divide-slate-100">
          <li v-for="m in data.stoppedComing" :key="m.memberId" class="flex items-center justify-between gap-3 py-3">
            <div class="min-w-0">
              <NuxtLink :to="`/dashboard/members/${m.memberId}`" class="font-semibold text-slate-800 hover:underline">{{ m.name }}</NuxtLink>
              <p class="text-sm text-slate-600">Last came {{ m.daysAway }} days ago · {{ m.visits }} {{ m.visits === 1 ? 'visit' : 'visits' }} before</p>
            </div>
            <a
              v-if="m.phone"
              :href="nudgeLink(m)"
              target="_blank"
              rel="noopener"
              class="shrink-0 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >Message</a>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-slate-600">Nobody yet. This list fills up once {{ t.membersLower }} start checking in.</p>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { renderSVG } from "uqr";

definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Member self check-in - MemberBook" });

interface CheckInData {
  active: boolean;
  url?: string;
  selfCheckInsToday?: number;
  stoppedComingDays?: number;
  stoppedComing?: { memberId: number; name: string; phone: string | null; daysAway: number; visits: number }[];
}

const { orgId, currentOrg } = useOrg();
const t = useTerminology();
const isOwner = computed(() => currentOrg.value?.role === "owner");
const { data, refresh } = await useFetch<CheckInData>(() => `/api/orgs/${orgId.value}/add-ons/check-in`, { key: `self-check-in-${orgId.value}` });

const qr = computed(() => data.value?.url
  ? renderSVG(data.value.url, { border: 1 }).replace("<svg ", "<svg width=\"100%\" role=\"img\" aria-label=\"Check-in QR code\" ")
  : "");

function nudgeLink(m: { name: string; phone: string | null }) {
  const digits = String(m.phone || "").replace(/\D/g, "").slice(-10);
  const text = `Hi ${m.name.split(" ")[0]}, we've missed you at ${currentOrg.value?.name ?? "the gym"}! Hope all is well. See you soon?`;
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

function printPoster() {
  window.print();
}

const copied = ref(false);
async function copy() {
  try {
    await navigator.clipboard.writeText(data.value?.url || "");
    copied.value = true;
  }
  catch {
    // clipboard blocked
  }
}

async function reset() {
  if (!window.confirm("Make a new link? The old poster will stop working, so print the new one.")) return;
  await $fetch(`/api/orgs/${orgId.value}/add-ons/check-in/reset`, { method: "POST" });
  await refresh();
}
</script>
