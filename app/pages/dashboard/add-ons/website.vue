<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 lg:p-6">
    <div>
      <NuxtLink to="/dashboard/add-ons" class="text-sm font-medium text-primary-700 hover:underline">← Add-ons</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-slate-800">Your website</h1>
      <p class="mt-1 text-sm text-slate-600">
        Tell us about your business and send a few photos. We make the website, check it, and show it to you before
        anyone else sees it.
      </p>
    </div>

    <div v-if="pending" class="h-64 animate-pulse rounded-3xl bg-slate-100" />

    <template v-else-if="site">
      <!-- Not switched on -->
      <AppCard v-if="!site.active" class="!bg-accent-50">
        <p class="text-base font-semibold text-slate-800">Switch on the website add-on to get started</p>
        <p class="mt-1 text-sm text-slate-600">First month free, then {{ formatCurrency(29900) }} a month. Switch off any time.</p>
        <AppButton v-if="isOwner" class="mt-3" size="sm" :loading="starting" @click="start">Start free month</AppButton>
      </AppCard>

      <!-- Status -->
      <AppCard v-else-if="stage !== 'details'">
        <div v-if="stage === 'making'" class="flex gap-3">
          <span class="mt-1 h-3 w-3 shrink-0 animate-pulse rounded-full bg-amber-500" />
          <div>
            <p class="text-base font-semibold text-slate-800">We're making your website</p>
            <p class="mt-1 text-sm text-slate-600">
              It usually takes a few hours. We check every website before you see it, so it can take up to a day.
              You can keep adding photos or details below until then.
            </p>
          </div>
        </div>

        <div v-else-if="stage === 'failed'" class="text-sm text-red-800">
          <p class="font-semibold">We need a little more from you</p>
          <p class="mt-1">{{ latest?.message }}</p>
        </div>

        <div v-else-if="stage === 'ready'">
          <p class="text-base font-semibold text-slate-800">{{ site.status === 'live' ? 'Your changes are ready' : 'Your website is ready' }}</p>
          <p class="mt-1 text-sm text-slate-600">Have a look. When you're happy, publish it and anyone can open it.</p>
          <p v-if="latest?.message" class="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{{ latest.message }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <AppButton v-if="isOwner" :loading="publishing" @click="publish">Publish website</AppButton>
            <AppButton variant="secondary" @click="showChange = true">Ask for a change</AppButton>
          </div>
        </div>

        <div v-else-if="stage === 'live'">
          <p class="text-base font-semibold text-slate-800">Your website is live</p>
          <a :href="site.url" target="_blank" rel="noopener" class="mt-1 block break-all text-sm font-medium text-primary-700 hover:underline">{{ site.url }}</a>
          <p class="mt-2 text-sm text-slate-600">
            Share it on WhatsApp, Instagram and your Google listing. Members can open it and tap
            <span class="font-medium">Add to Home screen</span> to keep it like an app.
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <AppButton size="sm" @click="copy(site.url)">{{ copied ? 'Copied' : 'Copy link' }}</AppButton>
            <AppButton size="sm" variant="secondary" @click="showChange = true">Ask for a change</AppButton>
            <AppButton v-if="isOwner" size="sm" variant="ghost" @click="unpublish">Take it offline</AppButton>
          </div>
        </div>

        <div v-else-if="stage === 'offline'">
          <p class="text-base font-semibold text-slate-800">Your website is offline</p>
          <AppButton v-if="isOwner" class="mt-3" size="sm" :loading="publishing" @click="publish">Put it back online</AppButton>
        </div>

        <form v-if="showChange" class="mt-4 space-y-2 border-t border-slate-100 pt-4" @submit.prevent="submit(changeText)">
          <label for="change" class="block text-sm font-medium text-slate-700">What should we change?</label>
          <textarea
            id="change"
            v-model="changeText"
            rows="3"
            maxlength="2000"
            class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="For example: add Zumba on Saturday at 7 AM, and use the new photo of the weights area at the top"
          />
          <AppButton type="submit" size="sm" :loading="submitting">Send change</AppButton>
        </form>
      </AppCard>

      <!-- Preview -->
      <AppCard v-if="site.hasDraft && (stage === 'ready' || stage === 'live')" title="Preview">
        <div class="mb-3 flex gap-2">
          <button type="button" class="rounded-full px-3 py-1 text-xs font-semibold" :class="previewWidth === 'phone' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'" @click="previewWidth = 'phone'">Phone</button>
          <button type="button" class="rounded-full px-3 py-1 text-xs font-semibold" :class="previewWidth === 'desktop' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'" @click="previewWidth = 'desktop'">Computer</button>
        </div>
        <div class="flex justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <iframe
            :src="previewSrc"
            title="Website preview"
            class="h-[640px] bg-white"
            :class="previewWidth === 'phone' ? 'w-[390px] max-w-full' : 'w-full'"
            sandbox=""
          />
        </div>
      </AppCard>

      <!-- Details -->
      <form v-if="site.active" class="space-y-6" @submit.prevent="save()">
        <AppCard title="Already have a website?">
          <label class="flex items-start gap-3 text-sm text-slate-700">
            <input v-model="hasOwnSite" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600">
            Yes, I already have one. Don't make a new one.
          </label>
          <AppInput v-if="hasOwnSite" v-model="details.existingWebsite" class="mt-3" label="Your website address" placeholder="www.yourgym.in" />
        </AppCard>

        <template v-if="!hasOwnSite">
          <AppCard title="About your business">
            <div class="space-y-4">
              <AppInput v-model="details.businessName" label="Business name" required />
              <AppInput v-model="details.tagline" label="One line about you (optional)" placeholder="e.g. Strength training and Zumba for women in Kharghar" />
              <div>
                <label for="about" class="mb-1 block text-sm font-medium text-slate-700">What makes your place special?</label>
                <textarea
                  id="about"
                  v-model="details.about"
                  rows="4"
                  maxlength="3000"
                  class="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  placeholder="A few lines in your own words: since when you're open, who comes, what you're known for. Hindi or English is fine."
                />
              </div>
              <AppInput v-model="details.facilities" label="Facilities and classes" placeholder="AC, cardio, free weights, Zumba, steam, parking" />
              <AppInput v-model="details.trainers" label="Trainers or teachers (optional)" placeholder="Ravi (8 years, certified), Neha (yoga)" />
              <AppInput v-model="details.offers" label="Any offer to show? (optional)" placeholder="Free trial day, 10% off yearly plan" />
            </div>
          </AppCard>

          <AppCard title="Contact and timings">
            <div class="grid gap-4 sm:grid-cols-2">
              <AppInput v-model="details.phone" label="Phone number" type="tel" placeholder="98765 43210" />
              <AppInput v-model="details.whatsapp" label="WhatsApp number" type="tel" placeholder="98765 43210" />
              <AppInput v-model="details.address" class="sm:col-span-2" label="Full address" placeholder="Shop 4, Sai Plaza, Sector 12" />
              <AppInput v-model="details.area" label="Area and city" placeholder="Kharghar, Navi Mumbai" />
              <AppInput v-model="details.email" label="Email (optional)" type="email" />
              <AppInput v-model="details.hours" class="sm:col-span-2" label="Opening hours" placeholder="Mon to Sat 6 AM to 10 PM, Sunday 7 AM to 12 PM" />
            </div>
          </AppCard>

          <AppCard title="Your Google and Instagram pages">
            <p class="mb-3 text-sm text-slate-600">
              We look at these to get your style and what members say about you. In Google Maps, open your business, tap
              Share and copy the link.
            </p>
            <div class="space-y-4">
              <AppInput v-model="details.googleMapsUrl" label="Google Maps link" placeholder="https://maps.app.goo.gl/..." />
              <AppInput v-model="details.instagram" label="Instagram page (optional)" placeholder="@yourgym" />
              <AppInput v-model="details.colours" label="Colours you like (optional)" placeholder="Black and orange, like our logo" />
              <AppInput v-model="details.notes" label="Anything else? (optional)" />
            </div>
          </AppCard>
        </template>

        <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
        <p v-if="savedNote" class="text-sm text-green-700">{{ savedNote }}</p>
        <div class="flex flex-wrap gap-2">
          <AppButton type="submit" variant="secondary" :loading="saving">Save details</AppButton>
        </div>
      </form>

      <!-- Photos -->
      <AppCard v-if="site?.active && !hasOwnSite" title="Logo and photos">
        <p class="text-sm text-slate-600">
          Real photos make the website. Send your logo and 6 to 10 bright photos: the entrance, the main floor, equipment,
          a class in progress. Up to 12 photos.
        </p>
        <div v-if="site?.files.length" class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          <div v-for="f in site?.files ?? []" :key="f.index" class="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img :src="f.url" :alt="f.name" class="aspect-square w-full object-cover" :class="f.kind === 'logo' ? 'object-contain p-2' : ''">
            <span v-if="f.kind === 'logo'" class="absolute left-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Logo</span>
            <button type="button" class="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-red-700" @click="removeFile(f.index)">Remove</button>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <label class="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            {{ uploading === 'logo' ? 'Uploading…' : (hasLogo ? 'Change logo' : 'Add logo') }}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="sr-only" @change="upload($event, 'logo')">
          </label>
          <label class="cursor-pointer rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            {{ uploading === 'photo' ? 'Uploading…' : 'Add photos' }}
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple class="sr-only" @change="upload($event, 'photo')">
          </label>
        </div>
      </AppCard>

      <!-- Make it -->
      <AppCard v-if="site?.active && !hasOwnSite && stage === 'details'" class="!bg-primary-50">
        <p class="text-base font-semibold text-slate-800">Ready?</p>
        <p class="mt-1 text-sm text-slate-600">
          {{ photoCount < 3 ? 'Add at least 3 photos first. Websites with real photos get far more enquiries.' : 'We\'ll make your website and show it to you, usually within a day.' }}
        </p>
        <AppButton v-if="isOwner" class="mt-3" :disabled="photoCount < 3" :loading="submitting" @click="saveAndSubmit">Make my website</AppButton>
        <p v-else class="mt-2 text-xs text-slate-600">Ask the owner to tap "Make my website".</p>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });
useHead({ title: "Your website - MemberBook" });

interface SiteRequest { id: number; type: string; status: string; message: string | null; change: string | null; createdAt: string }
interface SiteData {
  active: boolean;
  role: string;
  slug: string;
  url: string;
  status: "draft" | "live" | "off";
  details: WebsiteDetails;
  defaults: { businessName: string; whatsapp: string; type: string };
  files: { index: number; name: string; kind: "logo" | "photo"; url: string }[];
  hasDraft: boolean;
  draftApproved: boolean;
  draftDiffersFromLive: boolean;
  publishedAt: string | null;
  requests: SiteRequest[];
}

const { orgId, currentOrg } = useOrg();
const { api } = useApi();
const { formatCurrency } = useFormatCurrency();
const isOwner = computed(() => currentOrg.value?.role === "owner");

const { data: site, pending, refresh } = await useFetch<SiteData>(() => `/api/orgs/${orgId.value}/add-ons/website`, {
  key: `website-${orgId.value}`,
});

const details = reactive<WebsiteDetails>({});
const hasOwnSite = ref(false);
watch(site, (s) => {
  if (!s) return;
  Object.assign(details, { whatsapp: s.defaults.whatsapp, ...s.details, businessName: s.details.businessName || s.defaults.businessName });
  hasOwnSite.value = Boolean(s.details.existingWebsite);
}, { immediate: true });

const latest = computed(() => site.value?.requests[0]);
const hasLogo = computed(() => site.value?.files.some(f => f.kind === "logo"));
const photoCount = computed(() => site.value?.files.filter(f => f.kind === "photo").length ?? 0);

const stage = computed(() => {
  const s = site.value;
  if (!s) return "details";
  const r = latest.value;
  if (r && ["new", "working", "needs_review"].includes(r.status)) return "making";
  if (r && r.status === "failed") return "failed";
  if (s.hasDraft && s.draftApproved && (s.status !== "live" || s.draftDiffersFromLive) && r?.status === "ready") return "ready";
  if (s.status === "live") return "live";
  if (s.status === "off" && s.publishedAt) return "offline";
  return "details";
});

const previewWidth = ref<"phone" | "desktop">("phone");
const previewSrc = computed(() => `/api/orgs/${orgId.value}/add-ons/website/preview?v=${encodeURIComponent(latest.value?.id ?? 0)}`);

const error = ref("");
const savedNote = ref("");
const saving = ref(false);
const submitting = ref(false);
const publishing = ref(false);
const starting = ref(false);
const uploading = ref<"logo" | "photo" | null>(null);
const showChange = ref(false);
const changeText = ref("");
const copied = ref(false);

function errMsg(e: unknown, fallback: string) {
  return (e as { data?: { statusMessage?: string } })?.data?.statusMessage || fallback;
}

async function start() {
  starting.value = true;
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/switch`, { method: "POST", body: JSON.stringify({ addOn: "website", action: "start" }) });
    await refresh();
  }
  catch (e) {
    error.value = errMsg(e, "Could not switch it on.");
  }
  finally {
    starting.value = false;
  }
}

async function save(quiet = false) {
  saving.value = !quiet;
  error.value = "";
  savedNote.value = "";
  try {
    const body = { ...details, existingWebsite: hasOwnSite.value ? details.existingWebsite : "" };
    await api(`/api/orgs/${orgId.value}/add-ons/website`, { method: "PUT", body: JSON.stringify({ details: body }) });
    if (!quiet) savedNote.value = "Saved.";
    await refresh();
    return true;
  }
  catch (e) {
    error.value = errMsg(e, "Could not save. Please try again.");
    return false;
  }
  finally {
    saving.value = false;
  }
}

async function submit(change?: string) {
  submitting.value = true;
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/website/submit`, { method: "POST", body: JSON.stringify({ change: change || "" }) });
    showChange.value = false;
    changeText.value = "";
    await refresh();
  }
  catch (e) {
    error.value = errMsg(e, "Could not send. Please try again.");
  }
  finally {
    submitting.value = false;
  }
}

async function saveAndSubmit() {
  if (await save(true)) await submit();
}

async function publish() {
  publishing.value = true;
  error.value = "";
  try {
    await api(`/api/orgs/${orgId.value}/add-ons/website/publish`, { method: "POST", body: JSON.stringify({}) });
    await refresh();
  }
  catch (e) {
    error.value = errMsg(e, "Could not publish. Please try again.");
  }
  finally {
    publishing.value = false;
  }
}

async function unpublish() {
  if (!window.confirm("Take your website offline? You can put it back any time.")) return;
  await api(`/api/orgs/${orgId.value}/add-ons/website/publish`, { method: "POST", body: JSON.stringify({ action: "unpublish" }) });
  await refresh();
}

async function upload(e: Event, kind: "logo" | "photo") {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (!files.length) return;
  uploading.value = kind;
  error.value = "";
  try {
    const form = new FormData();
    form.append("kind", kind);
    for (const f of files) form.append("files", f);
    await $fetch(`/api/orgs/${orgId.value}/add-ons/website/files`, { method: "POST", body: form });
    await refresh();
  }
  catch (err) {
    error.value = errMsg(err, "Could not upload. Use JPG or PNG photos under 8 MB.");
  }
  finally {
    uploading.value = null;
    input.value = "";
  }
}

async function removeFile(index: number) {
  await $fetch(`/api/orgs/${orgId.value}/add-ons/website/files/${index}`, { method: "DELETE" });
  await refresh();
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  }
  catch {
    // clipboard blocked; the link is visible to copy by hand
  }
}
</script>
