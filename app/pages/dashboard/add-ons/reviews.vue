<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div>
      <NuxtLink to="/dashboard/billing" class="text-sm font-medium text-primary-700 hover:underline">← MemberBook plan</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">Google review replies</h1>
      <p class="mt-1 text-sm text-slate-600">
        Replying to every review, good or bad, makes new people trust you. Paste a review and we draft a reply for you to
        check and post. Once a month, paste all your new reviews and we tell you what members love and what to fix.
      </p>
    </div>

    <ProPlanCard v-if="notActive" title="Google review reply drafts come with the Pro plan" />

    <template v-else>
      <AppCard class="!bg-primary-50">
        <p class="text-sm text-slate-700">
          Want more reviews too? Make a free QR poster for your front desk.
          <NuxtLink to="/dashboard/add-ons/review-poster" class="font-semibold text-primary-700 hover:underline">Make the poster</NuxtLink>
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
useHead({ title: "Google review replies - MemberBook" });

interface ReviewRequest {
  id: number;
  type: string;
  status: string;
  input: { text?: string; reviewer?: string; rating?: number };
  result: { text?: string } | null;
  message: string | null;
}

const { orgId } = useOrg();
const { api } = useApi();

const { data: planData } = await useFetch<{ features: Record<string, boolean> }>(() => `/api/orgs/${orgId.value}/plan`, { key: `plan-${orgId.value}` });
const notActive = computed(() => !planData.value?.features.reviews);
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
