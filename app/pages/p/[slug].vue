<template>
  <div class="min-h-screen bg-slate-50">
    <div v-if="error" class="mx-auto max-w-md px-4 py-16 text-center">
      <h1 class="text-xl font-semibold text-slate-800">Page not found</h1>
      <p class="mt-2 text-sm text-slate-600">This business page isn't available.</p>
    </div>

    <template v-else-if="biz">
      <header class="bg-primary-700 px-4 pb-10 pt-8 text-white">
        <div class="mx-auto max-w-xl">
          <p class="text-sm font-medium uppercase tracking-wide opacity-90">{{ typeLabel }}</p>
          <h1 class="mt-1 text-3xl font-extrabold leading-tight">{{ biz.name }}</h1>
          <p v-if="biz.address" class="mt-2 text-sm opacity-90">📍 {{ biz.address }}</p>
          <div class="mt-5 flex flex-wrap gap-2">
            <a v-if="biz.phone" :href="`https://wa.me/${wa(biz.phone)}?text=${encodeURIComponent(`Hi, I found ${biz.name} online and want to know more.`)}`" class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-800">WhatsApp us</a>
            <a v-if="biz.phone" :href="`tel:${biz.phone}`" class="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-white">Call</a>
            <a href="#enquire" class="rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-white">Enquire</a>
          </div>
        </div>
      </header>

      <main class="mx-auto -mt-6 max-w-xl space-y-4 px-4 pb-10">
        <section v-if="biz.plans.length" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-bold text-slate-800">Plans and fees</h2>
          <ul class="mt-3 divide-y divide-slate-100">
            <li v-for="p in biz.plans" :key="p.name" class="flex items-center justify-between gap-3 py-3">
              <div class="min-w-0">
                <p class="font-semibold text-slate-800">{{ p.name }}</p>
                <p class="text-sm text-slate-600">{{ duration(p.durationType, p.durationValue) }}</p>
              </div>
              <p class="shrink-0 text-lg font-bold text-slate-800">{{ formatCurrency(p.price) }}</p>
            </li>
          </ul>
        </section>

        <section id="enquire" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-lg font-bold text-slate-800">Ask us anything</h2>
          <p class="mt-1 text-sm text-slate-600">Leave your number and we'll call you back.</p>
          <div v-if="sent" class="mt-4 rounded-xl bg-success-50 p-4 text-sm font-medium text-success-800" role="status">
            Thank you! We got your message and will call you back soon.
          </div>
          <form v-else class="mt-4 space-y-3" @submit.prevent="send">
            <AppInput v-model="form.name" label="Your name" required autocomplete="name" />
            <AppInput v-model="form.phone" label="Phone" type="tel" inputmode="numeric" required autocomplete="tel" placeholder="98765 43210" />
            <AppSelect v-if="biz.plans.length" v-model="form.interest" label="Interested in" :options="[{ value: '', label: 'Not sure yet' }, ...biz.plans.map(p => ({ value: p.name, label: p.name }))]" />
            <AppInput v-model="form.message" label="Message (optional)" />
            <input v-model="form.company" type="text" name="company" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true">
            <p v-if="sendError" class="text-sm text-danger-700" role="alert">{{ sendError }}</p>
            <AppButton type="submit" class="w-full" :loading="sending">Send</AppButton>
          </form>
        </section>

        <div class="flex flex-wrap justify-center gap-4 text-sm font-medium">
          <a v-if="biz.website" :href="biz.website" class="text-primary-700 underline">Visit our website</a>
          <a v-if="biz.googleReviewUrl" :href="biz.googleReviewUrl" target="_blank" rel="noopener" class="text-primary-700 underline">Review us on Google</a>
        </div>
        <p class="pt-4 text-center text-xs text-slate-600">
          Free business page by <a :href="`https://memberbook.in/?utm_source=business-page&utm_medium=referral&utm_campaign=${biz.slug}`" class="font-semibold text-primary-700">MemberBook</a>
        </p>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const slug = String(route.params.slug);
const { formatCurrency } = useFormatCurrency();

interface Biz {
  name: string;
  slug: string;
  type: string;
  phone: string | null;
  address: string | null;
  googleReviewUrl: string | null;
  website: string | null;
  plans: { name: string; price: number; durationType: string; durationValue: number }[];
}
const { data: biz, error } = await useFetch<Biz>(`/api/p/${slug}`);
// A missing page answers 404 so search engines drop it instead of indexing an empty page.
if (import.meta.server && error.value) {
  const reqEvent = useRequestEvent();
  if (reqEvent) setResponseStatus(reqEvent, 404);
}

const typeLabel = computed(() => ({ gym: "Gym and fitness", library: "Study library", tuition: "Coaching and tuition" } as Record<string, string>)[biz.value?.type ?? ""] ?? "");

useHead(() => {
  const b = biz.value;
  const desc = b ? `${b.name}${b.address ? `, ${b.address}` : ""}. ${b.plans.length ? `Plans from ${formatCurrency(b.plans[0]!.price)}. ` : ""}Enquire or message us on WhatsApp.` : "";
  return {
    title: b ? `${b.name}${typeLabel.value ? ` | ${typeLabel.value}` : ""}` : "Business page",
    titleTemplate: null,
    meta: [
      { name: "description", content: desc },
      ...(b ? [] : [{ name: "robots", content: "noindex" }]),
      { property: "og:title", content: b?.name ?? "" },
      { property: "og:description", content: desc },
      { property: "og:site_name", content: b?.name ?? "" },
    ],
    link: [{ rel: "canonical", href: `https://memberbook.in/p/${slug}` }],
    script: b
      ? [{
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": b.type === "gym" ? "ExerciseGym" : b.type === "library" ? "Library" : "EducationalOrganization",
            "name": b.name,
            ...(b.address ? { address: b.address } : {}),
            ...(b.phone ? { telephone: b.phone } : {}),
            "url": `https://memberbook.in/p/${slug}`,
          }),
        }]
      : [],
  };
});

function duration(type: string, value: number) {
  const unit = ({ daily: "day", weekly: "week", monthly: "month", yearly: "year" } as Record<string, string>)[type] ?? type;
  return value === 1 ? `1 ${unit}` : `${value} ${unit}s`;
}

function wa(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `91${d}` : d;
}

const form = reactive({ name: "", phone: "", interest: "", message: "", company: "" });
const sending = ref(false);
const sent = ref(false);
const sendError = ref("");
async function send() {
  sending.value = true;
  sendError.value = "";
  try {
    await $fetch(`/api/p/${slug}/enquiry`, { method: "POST", body: { ...form } });
    sent.value = true;
  }
  catch (err) {
    sendError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || "Could not send. Please try again.";
  }
  finally {
    sending.value = false;
  }
}
</script>
