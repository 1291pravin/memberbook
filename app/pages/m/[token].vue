<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8">
    <div class="mx-auto w-full max-w-sm space-y-4">
      <div v-if="error" class="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 class="text-lg font-semibold text-slate-800">This link doesn't work</h1>
        <p class="mt-2 text-sm text-slate-600">Please ask for a new link.</p>
      </div>

      <template v-else-if="page">
        <!-- Header -->
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div class="bg-primary-600 px-5 py-5 text-white">
            <p class="text-sm opacity-90">{{ page.orgName }}</p>
            <h1 class="text-2xl font-bold leading-tight">Hi {{ page.firstName }} 👋</h1>
          </div>

          <!-- Plan -->
          <div class="p-5">
            <template v-if="page.plan">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-600">Your plan</p>
                  <p class="mt-0.5 text-lg font-semibold text-slate-800">{{ page.plan.name }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="statusClass">{{ statusLabel }}</span>
              </div>
              <p class="mt-2 text-sm text-slate-700">
                <template v-if="page.plan.active">Valid till <strong>{{ longDate(page.plan.endDate) }}</strong> · {{ page.plan.daysLeft }} day{{ page.plan.daysLeft === 1 ? '' : 's' }} left</template>
                <template v-else-if="page.plan.startDate > today">Starts on <strong>{{ longDate(page.plan.startDate) }}</strong></template>
                <template v-else>Ended on <strong>{{ longDate(page.plan.endDate) }}</strong></template>
              </p>
              <p v-if="page.plan.paused" class="mt-1 text-sm text-slate-700">Paused till {{ longDate(page.plan.pauseEnd!) }}. Your end date has moved later to make up for it.</p>
            </template>
            <p v-else class="text-sm text-slate-700">No plan yet. Ask at the front desk.</p>
          </div>
        </div>

        <!-- Due -->
        <div v-for="(d, i) in page.due" :key="i" class="rounded-2xl border bg-white p-5 shadow-sm" :class="d.overdue ? 'border-amber-300' : 'border-slate-200'">
          <p class="text-sm text-slate-700">{{ d.kind === 'renewal' ? `Renewal of your ${d.planName} plan` : `Pending for your ${d.planName} plan` }}</p>
          <p class="mt-1 text-3xl font-bold tracking-tight text-slate-800">{{ formatCurrency(d.amount) }}</p>
          <p class="mt-0.5 text-sm" :class="d.overdue ? 'text-amber-800' : 'text-slate-600'">{{ dueText(d) }}</p>
          <a v-if="d.payUrl" :href="d.payUrl" class="mt-4 flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-700">
            Pay now
          </a>
          <p v-else class="mt-3 text-sm text-slate-700">Please pay at the front desk on your next visit.</p>
        </div>
        <div v-if="!page.due.length && page.plan?.active" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700" aria-hidden="true">✓</span>
          <p class="text-sm text-slate-700">All paid up. Nothing is due right now.</p>
        </div>

        <!-- Instalments -->
        <div v-if="page.instalments.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-700">Instalments</h2>
          <ul class="mt-2 space-y-1 text-sm text-slate-700">
            <li v-for="(it, i) in page.instalments" :key="i" class="flex justify-between"><span>{{ longDate(it.dueDate) }}</span><span class="font-medium">{{ formatCurrency(it.amount) }}</span></li>
          </ul>
        </div>

        <!-- Visits -->
        <div v-if="page.visits.visitsThisMonth > 0 || page.visits.streak > 0" class="grid grid-cols-2 gap-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-2xl font-bold text-slate-800">🔥 {{ page.visits.streak }}</p>
            <p class="text-xs text-slate-600">day streak</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-2xl font-bold text-slate-800">{{ page.visits.visitsThisMonth }}</p>
            <p class="text-xs text-slate-600">{{ page.visits.visitsThisMonth === 1 ? "visit" : "visits" }} this month</p>
          </div>
        </div>

        <!-- Receipts -->
        <div v-if="page.receipts.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-700">Receipts</h2>
          <ul class="mt-2 divide-y divide-slate-100">
            <li v-for="r in page.receipts" :key="r.url">
              <a :href="r.url" target="_blank" rel="noopener" class="flex items-center justify-between py-2.5 text-sm">
                <span class="text-slate-700">{{ longDate(r.date) }} <span class="text-slate-600">· no. {{ r.receiptNo }}</span></span>
                <span class="font-medium text-primary-700">{{ formatCurrency(r.amount) }} · PDF</span>
              </a>
            </li>
          </ul>
        </div>

        <a v-if="page.orgPhone" :href="`https://wa.me/${waNumber(page.orgPhone)}`" class="block text-center text-sm font-medium text-primary-700">
          Questions? Message {{ page.orgName }} on WhatsApp
        </a>
        <p class="pt-2 text-center text-xs text-slate-600">
          Bookmark this page to check your plan any time.<br>
          <a href="https://memberbook.in/?utm_source=member-page&utm_medium=referral" class="underline">Made with MemberBook</a>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const token = String(route.params.token);
const { formatCurrency } = useFormatCurrency();

interface MemberPage {
  orgName: string;
  orgType: string;
  orgPhone: string | null;
  memberName: string;
  firstName: string;
  plan: { name: string; startDate: string; endDate: string; active: boolean; paused: boolean; pauseEnd: string | null; daysLeft: number } | null;
  instalments: { dueDate: string; amount: number }[];
  due: { kind: "due" | "renewal"; planName: string; amount: number; dueDate: string; overdue: boolean; payUrl: string | null }[];
  receipts: { amount: number; date: string; receiptNo: number | null; url: string }[];
  visits: { streak: number; visitsThisMonth: number };
}

const { data: page, error } = await useFetch<MemberPage>(`/api/m/${token}`);
const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);

useHead(() => ({
  title: page.value ? `${page.value.firstName} at ${page.value.orgName}` : "Member page",
  titleTemplate: null,
  meta: [
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: page.value ? `Your ${page.value.orgName} membership` : "Member page" },
    { property: "og:description", content: "Your plan, fees, receipts and visits." },
    { property: "og:site_name", content: page.value?.orgName || "Member page" },
  ],
}));

const statusLabel = computed(() => {
  const p = page.value?.plan;
  if (!p) return "";
  if (p.paused) return "Paused";
  if (p.active) return "Active";
  return p.startDate > today ? "Upcoming" : "Expired";
});
const statusClass = computed(() => ({
  Active: "bg-success-100 text-success-700",
  Paused: "bg-info-100 text-info-700",
  Upcoming: "bg-slate-100 text-slate-700",
  Expired: "bg-danger-100 text-danger-700",
} as Record<string, string>)[statusLabel.value] ?? "");

function longDate(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function addDays(d: string, n: number) {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

function dueText(d: MemberPage["due"][number]) {
  if (d.kind === "renewal") {
    const next = addDays(d.dueDate, 1);
    return d.overdue ? `Was due on ${longDate(next)}` : `Due on ${longDate(next)}`;
  }
  return d.dueDate > today ? `Due on ${longDate(d.dueDate)}` : "Due now";
}

function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}
</script>
