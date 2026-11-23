<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div>
      <NuxtLink to="/dashboard/add-ons" class="text-sm font-medium text-primary-700 hover:underline">← Add-ons</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">More Google reviews</h1>
      <p class="mt-1 text-sm text-slate-600">
        More Google reviews bring more walk-ins. Put the poster at your front desk so {{ t.membersLower }} can review you in
        30 seconds, and we write replies to your reviews so every one gets an answer.
      </p>
    </div>

    <AppCard v-if="notActive" class="!bg-accent-50">
      <p class="text-base font-semibold text-slate-800">Switch on More Google reviews first. The first month is free.</p>
      <AppButton class="mt-3" size="sm" @click="navigateTo('/dashboard/add-ons')">Go to add-ons</AppButton>
    </AppCard>

    <template v-else>
      <!-- Review poster -->
      <AppCard v-if="(settings && !settings.googleReviewUrl) || editingLink" title="Make your review poster">
        <ol class="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Open <span class="font-semibold">Google Maps</span> and search your business name.</li>
          <li>On your business, tap <span class="font-semibold">Share</span> (or <span class="font-semibold">Ask for reviews</span> if you manage the profile).</li>
          <li>Tap <span class="font-semibold">Copy link</span> and paste it here.</li>
        </ol>
        <form class="mt-4 space-y-3" @submit.prevent="saveLink">
          <AppInput v-model="linkInput" label="Your Google link" placeholder="https://g.page/r/..." :disabled="!isOwner" />
          <p v-if="!isOwner" class="text-sm text-slate-600">Ask the owner to add the link.</p>
          <p v-if="linkError" class="text-sm text-red-700">{{ linkError }}</p>
          <div class="flex flex-wrap items-center gap-3">
            <AppButton type="submit" :loading="savingLink" :disabled="!isOwner">Make my poster</AppButton>
            <button v-if="editingLink" type="button" class="text-sm font-semibold text-slate-700 hover:underline" @click="editingLink = false">Cancel</button>
          </div>
        </form>
      </AppCard>

      <AppCard v-else-if="settings?.shortUrl" title="Your review poster">
        <div class="grid gap-5 sm:grid-cols-[minmax(0,13rem)_1fr]">
          <a :href="settings.posterUrl ?? undefined" target="_blank" rel="noopener" class="mx-auto block w-44 sm:w-full" aria-label="Open the poster">
            <ReviewPoster :name="currentOrg?.name ?? ''" :type="currentOrg?.type" :short-url="settings.shortUrl" />
          </a>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-primary-50 p-3">
                <p class="text-2xl font-extrabold text-primary-800">{{ settings.scans.last30 }}</p>
                <p class="text-xs font-medium text-slate-700">opened your review page in the last 30 days</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-3">
                <p class="text-2xl font-extrabold text-slate-800">{{ settings.scans.total }}</p>
                <p class="text-xs font-medium text-slate-700">all time</p>
              </div>
            </div>
            <p v-if="settings.scans.last30" class="text-sm text-slate-600">
              {{ settings.scans.poster30 }} from the poster, {{ settings.scans.whatsapp30 }} from WhatsApp.
            </p>
            <p v-else class="text-sm text-slate-600">
              Print it on A4 and put it at the front desk. Every scan shows up here.
            </p>
            <div class="flex flex-wrap gap-2">
              <a :href="settings.posterUrl ?? undefined" target="_blank" rel="noopener" class="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
                Open poster to print
              </a>
              <a :href="printShopLink" target="_blank" rel="noopener" class="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Send to print shop
              </a>
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <AppAction icon="eye" tone="slate" :href="settings.googleReviewUrl ?? undefined" external>Check the Google link</AppAction>
              <AppAction v-if="isOwner" icon="edit" tone="slate" @click="startEdit">Change link</AppAction>
            </div>
            <p class="text-xs text-slate-600">
              Changing the link later doesn't need a new poster: the QR goes through MemberBook.
            </p>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="settings?.whatsappUrl" :title="`Ask your ${t.membersLower} on WhatsApp`">
        <p class="text-sm text-slate-600">
          Send this to your {{ t.membersLower }}' WhatsApp group or broadcast list. Best after a good day, like a result or
          a festival offer.
        </p>
        <div class="mt-3 rounded-xl bg-slate-50 p-3 text-sm whitespace-pre-line text-slate-800">{{ askMessage }}</div>
        <a
          :href="`https://wa.me/?text=${encodeURIComponent(askMessage)}`"
          target="_blank"
          rel="noopener"
          class="mt-3 inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >Send on WhatsApp</a>
        <p class="mt-3 text-xs text-slate-600">
          Ask everyone, not only happy {{ t.membersLower }}, and don't offer discounts for reviews. Google removes reviews
          that break its rules.
        </p>
      </AppCard>

      <AppCard title="Replies to your reviews">
        <div class="mb-4 flex gap-2">
          <button type="button" class="rounded-full px-3 py-1.5 text-sm font-semibold" :class="mode === 'review_reply' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'" @click="mode = 'review_reply'">Reply to a review</button>
          <button type="button" class="rounded-full px-3 py-1.5 text-sm font-semibold" :class="mode === 'review_summary' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'" @click="mode = 'review_summary'">Monthly summary</button>
        </div>
        <form class="space-y-4" @submit.prevent="send">
          <div v-if="mode === 'review_reply'" class="grid gap-4 sm:grid-cols-2">
            <AppInput v-model="reviewer" label="Reviewer's name (optional)" placeholder="Amit S." />
            <AppSelect v-model="rating" label="Stars" :options="ratingOptions" />
          </div>
          <div>
            <label for="review-text" class="mb-1 block text-sm font-medium text-slate-700">
              {{ mode === 'review_reply' ? 'The review' : 'Paste your reviews (copy them from Google Maps)' }}
            </label>
            <textarea
              id="review-text"
              v-model="text"
              :rows="mode === 'review_reply' ? 4 : 10"
              class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              :placeholder="mode === 'review_reply' ? 'Great gym, trainers are helpful but AC doesn\'t work in the evening.' : 'Paste as many reviews as you like, one after another.'"
            />
          </div>
          <AppInput v-if="mode === 'review_reply'" v-model="tone" label="Anything to mention in the reply? (optional)" placeholder="AC was fixed last week" />
          <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
          <AppButton type="submit" :loading="sending">{{ mode === 'review_reply' ? 'Write my reply' : 'Summarise my reviews' }}</AppButton>
          <p class="text-xs text-slate-600">Usually ready within a few hours. We'll show it here.</p>
        </form>
      </AppCard>

      <AppCard v-if="requests?.length" title="Your replies and summaries">
        <ul class="divide-y divide-slate-100">
          <li v-for="r in requests" :key="r.id" class="py-4">
            <div class="flex items-start justify-between gap-3">
              <p class="text-sm font-semibold text-slate-800">
                {{ r.type === 'review_reply' ? `Reply to ${r.input.reviewer || 'a review'}` : 'Review summary' }}
                <span v-if="r.input.rating" class="font-normal text-slate-600">· {{ r.input.rating }}★</span>
              </p>
              <AppBadge :color="r.status === 'done' ? 'green' : r.status === 'failed' ? 'red' : 'yellow'">
                {{ r.status === 'done' ? 'Ready' : r.status === 'failed' ? 'Couldn\'t do it' : 'Writing' }}
              </AppBadge>
            </div>
            <p class="mt-1 line-clamp-2 text-sm text-slate-600">"{{ r.input.text }}"</p>
            <div v-if="r.status === 'done' && r.result?.text" class="mt-2 rounded-xl bg-slate-50 p-3">
              <p class="whitespace-pre-line text-sm text-slate-800">{{ r.result.text }}</p>
              <button v-if="r.type === 'review_reply'" type="button" class="mt-2 text-sm font-semibold text-primary-700 hover:underline" @click="copy(r.id, String(r.result.text))">
                {{ copiedId === r.id ? 'Copied. Paste it under the review on Google.' : 'Copy reply' }}
              </button>
            </div>
            <p v-else-if="r.status === 'failed'" class="mt-2 text-sm text-red-700">{{ r.message }}</p>
          </li>
        </ul>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "More Google reviews - MemberBook" });

interface ReviewRequest {
  id: number;
  type: string;
  status: string;
  input: { text?: string; reviewer?: string; rating?: number };
  result: { text?: string } | null;
  message: string | null;
}

const { orgId, currentOrg } = useOrg();
const { api } = useApi();

const { data: addOns } = await useFetch<{ addOns: { key: string; status: string }[] }>(() => `/api/orgs/${orgId.value}/add-ons`, { key: `add-ons-${orgId.value}` });
const notActive = computed(() => addOns.value?.addOns.find(a => a.key === "reviews")?.status !== "active");
const { data: requests, refresh } = await useFetch<ReviewRequest[]>(() => `/api/orgs/${orgId.value}/add-ons/requests`, { key: `review-requests-${orgId.value}` });

const mode = ref<"review_reply" | "review_summary">("review_reply");
const text = ref("");
const reviewer = ref("");
const rating = ref("");
const tone = ref("");
const ratingOptions = [
  { value: "", label: "Not sure" },
  ...[5, 4, 3, 2, 1].map(n => ({ value: String(n), label: `${n} ${n === 1 ? "star" : "stars"}` })),
];

const sending = ref(false);
const error = ref("");
async function send() {
  sending.value = true;
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/requests`, {
      method: "POST",
      body: JSON.stringify({ type: mode.value, text: text.value, reviewer: reviewer.value, rating: Number(rating.value) || undefined, tone: tone.value }),
    });
    text.value = "";
    reviewer.value = "";
    rating.value = "";
    tone.value = "";
    await refresh();
  }
  catch (e: unknown) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Could not send. Please try again.";
  }
  finally {
    sending.value = false;
  }
}

let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    if (requests.value?.some(r => r.status === "new" || r.status === "working")) refresh();
  }, 60000);
});
onBeforeUnmount(() => clearInterval(timer));

interface ReviewSettings {
  active: boolean;
  googleReviewUrl?: string | null;
  shortUrl?: string | null;
  whatsappUrl?: string | null;
  posterUrl?: string | null;
  scans: { total: number; last30: number; poster30: number; whatsapp30: number };
}

const t = useTerminology();
const isOwner = computed(() => currentOrg.value?.role === "owner");
const { data: settings, refresh: refreshSettings } = await useFetch<ReviewSettings>(() => `/api/orgs/${orgId.value}/add-ons/reviews`, { key: `review-settings-${orgId.value}` });

const editingLink = ref(false);
const linkInput = ref("");
const linkError = ref("");
const savingLink = ref(false);
function startEdit() {
  linkInput.value = settings.value?.googleReviewUrl || "";
  linkError.value = "";
  editingLink.value = true;
}
async function saveLink() {
  savingLink.value = true;
  linkError.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/reviews`, { method: "PUT", body: JSON.stringify({ googleReviewUrl: linkInput.value }) });
    await refreshSettings();
    editingLink.value = false;
  }
  catch (e: unknown) {
    linkError.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Could not save. Please try again.";
  }
  finally {
    savingLink.value = false;
  }
}

const printShopLink = computed(() => {
  const text = `Hi, please print this poster in colour on A4 (laminated if possible): ${settings.value?.posterUrl}\nOpen the link and tap "Print or save PDF". Thank you!`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
});

const askMessage = computed(() =>
  `Hi! Thank you for being part of ${currentOrg.value?.name ?? "our family"}. Could you share how you find it on Google? It takes 30 seconds and really helps us.\n${settings.value?.whatsappUrl ?? ""}`,
);

const copiedId = ref<number | null>(null);
async function copy(id: number, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    copiedId.value = id;
  }
  catch {
    // clipboard blocked; the text is on screen to copy by hand
  }
}
</script>
