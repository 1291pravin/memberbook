<template>
  <div>
    <section class="px-4 pt-10 pb-12 bg-gradient-to-b from-primary-50 to-white">
      <div class="max-w-3xl mx-auto">
        <nav class="text-sm text-slate-600 mb-5">
          <NuxtLink to="/" class="hover:text-primary-700">Home</NuxtLink>
          <span class="mx-2">/</span>
          <NuxtLink :to="kindHome" class="hover:text-primary-700">{{ kindLabel }}</NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-slate-800">{{ page.city }}</span>
        </nav>
        <p class="text-sm font-semibold uppercase tracking-wide text-primary-700">For {{ info.placePlural }} in {{ page.city }}</p>
        <h1 class="mt-2 text-3xl sm:text-4xl font-bold leading-tight text-slate-800">{{ info.title(page.city) }}</h1>
        <p class="mt-4 text-lg leading-relaxed text-slate-700">{{ page.intro }}</p>
        <p class="mt-3 text-lg leading-relaxed text-slate-700">
          MemberBook is free. Send us your register and we load every {{ singular }}, plan and due date for you. Then you see each morning who has to pay, and each {{ singular }} gets a WhatsApp reminder with a UPI pay link.
        </p>
        <div class="mt-7 flex flex-col sm:flex-row gap-3">
          <a :href="setupLink" :target="setupLink.startsWith('http') ? '_blank' : undefined" rel="noopener" class="sm:w-auto">
            <AppButton size="lg" class="w-full">Send us your register</AppButton>
          </a>
          <NuxtLink to="/register" class="sm:w-auto">
            <AppButton size="lg" variant="secondary" class="w-full">Sign up free</AppButton>
          </NuxtLink>
        </div>
        <p class="mt-3 text-sm text-slate-600">Free app, free setup. No card needed.</p>
      </div>
    </section>

    <section class="px-4 py-12">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">What you get</h2>
        <div class="grid gap-4 sm:grid-cols-3">
          <div v-for="pt in info.points" :key="pt.title" class="rounded-xl border border-slate-200 bg-white p-5">
            <h3 class="font-semibold text-slate-800">{{ pt.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ pt.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="px-4 py-12 bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">How setup works</h2>
        <ol class="space-y-4">
          <li v-for="(step, i) in steps" :key="step" class="flex gap-4">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">{{ i + 1 }}</span>
            <p class="pt-1 text-slate-700 leading-relaxed">{{ step }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="px-4 py-12">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Questions {{ info.place }} owners in {{ page.city }} ask</h2>
        <div class="space-y-6">
          <div v-for="faq in allFaqs" :key="faq.q">
            <h3 class="font-semibold text-slate-800 mb-1">{{ faq.q }}</h3>
            <p class="text-slate-600 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="px-4 pb-12">
      <div class="max-w-3xl mx-auto rounded-2xl bg-primary-700 px-6 py-8 text-center text-white">
        <h2 class="text-2xl font-bold">Let us set up your {{ info.place }}, free</h2>
        <p class="mt-2 text-primary-50">Send a photo of your register on WhatsApp. We load it, usually the same day.</p>
        <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a :href="setupLink" :target="setupLink.startsWith('http') ? '_blank' : undefined" rel="noopener">
            <AppButton size="lg" class="w-full bg-white !text-primary-800 hover:bg-primary-50">Send us your register</AppButton>
          </a>
          <NuxtLink to="/register">
            <AppButton size="lg" variant="secondary" class="w-full">Sign up free</AppButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="px-4 pb-14">
      <div class="max-w-3xl mx-auto grid gap-8 sm:grid-cols-2">
        <div>
          <h2 class="text-lg font-bold text-slate-800 mb-3">Helpful guides</h2>
          <ul class="space-y-2">
            <li v-for="g in info.guides" :key="g.slug">
              <NuxtLink :to="`/guides/${g.slug}`" class="text-primary-700 underline underline-offset-2 hover:text-primary-800">{{ g.title }}</NuxtLink>
            </li>
          </ul>
        </div>
        <div v-if="otherCities.length">
          <h2 class="text-lg font-bold text-slate-800 mb-3">Also for {{ info.placePlural }} in</h2>
          <ul class="flex flex-wrap gap-2">
            <li v-for="o in otherCities" :key="o.slug">
              <NuxtLink :to="localPagePath(o)" class="inline-block rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:border-primary-600 hover:text-primary-700">{{ o.city }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getLocalPage, kindInfo, localPagePath, localPages, type LocalKind } from "~/data/local-pages";

const props = defineProps<{ kind: LocalKind }>();
const route = useRoute();
const found = getLocalPage(props.kind, String(route.params.city || ""));
if (!found) throw createError({ statusCode: 404, message: "Page not found" });
const page = found;
const info = kindInfo[props.kind];
const singular = info.people.replace(/s$/, "");

const kindHome = { library: "/library", gym: "/gym", coaching: "/tuition" }[props.kind];
const kindLabel = { library: "Library software", gym: "Gym software", coaching: "Coaching software" }[props.kind];
const otherCities = localPages.filter(p => p.kind === props.kind && p.slug !== page.slug);

const steps = [
  `Send us photos of your register, or your Excel sheet, on WhatsApp. Add your fee plans, for example "${info.example}".`,
  `We load every ${singular}, plan and due date into MemberBook for you, free, usually the same day.`,
  `Log in on your phone. Each morning you see who is due and who is overdue, and can remind each of them on WhatsApp with a UPI pay link.`,
];

const sharedFaqs = [
  { q: "How much does MemberBook cost?", a: "The app is free, including setup. Automatic WhatsApp reminders are optional: 14 days free, then ₹199 a month for up to 500 reminders." },
  { q: "Where does the money go?", a: "Straight to your own UPI ID. MemberBook never holds your fees." },
];
const allFaqs = [...page.faqs, ...sharedFaqs];

const { setupHref } = useSupport();
const setupLink = computed(() => setupHref(`Hi MemberBook team, I run a ${info.place} in ${page.city} and want you to set up my register.\n\nName:\nNumber of ${info.people} (approx):`));

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.in";
const pageUrl = `${appUrl}${localPagePath(page)}`;

useSeoMeta({
  title: info.metaTitle(page.city),
  description: info.description(page.city),
  ogTitle: info.metaTitle(page.city),
  ogDescription: info.description(page.city),
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [{ rel: "canonical", href: pageUrl }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `MemberBook for ${info.placePlural} in ${page.city}`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser",
        "areaServed": { "@type": "City", "name": page.city, "containedInPlace": { "@type": "State", "name": page.state } },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
        "description": info.description(page.city),
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": allFaqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": appUrl },
          { "@type": "ListItem", "position": 2, "name": kindLabel, "item": `${appUrl}${kindHome}` },
          { "@type": "ListItem", "position": 3, "name": page.city, "item": pageUrl },
        ],
      }),
    },
  ],
});
</script>
