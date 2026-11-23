<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div>
      <NuxtLink to="/dashboard/add-ons" class="text-sm font-medium text-primary-700 hover:underline">← Add-ons</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">Google review poster</h1>
      <p class="mt-1 text-sm text-slate-600">
        More Google reviews bring more walk-ins. Put this poster at your front desk so {{ t.membersLower }} can review you
        in 30 seconds. It's free.
      </p>
    </div>

    <AppCard v-if="settings && !settings.active" class="!bg-accent-50">
      <p class="text-base font-semibold text-slate-800">Switch on the review poster first. It's free.</p>
      <AppButton class="mt-3" size="sm" @click="navigateTo('/dashboard/add-ons')">Go to add-ons</AppButton>
    </AppCard>

    <template v-else-if="settings">
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

      <AppCard v-if="settings.shortUrl" class="!bg-slate-50">
        <p class="text-sm text-slate-700">
          Got a bad review? We write a polite reply for you to post.
          <NuxtLink to="/dashboard/add-ons/reviews" class="font-semibold text-primary-700 hover:underline">Google review replies</NuxtLink>
        </p>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Google review poster - MemberBook" });

const { orgId, currentOrg } = useOrg();
const { api } = useApi();

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
</script>
