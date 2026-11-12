<template>
  <div>
    <section class="py-14 px-4 text-center bg-gradient-to-b from-primary-50 to-white">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800">Guides for gym, library and coaching centre owners</h1>
        <p class="mt-4 text-lg text-slate-600">
          Straight answers on collecting fees, managing seats and batches, and choosing software, written for small businesses in India.
        </p>
      </div>
    </section>

    <section class="py-10 px-4">
      <div class="max-w-4xl mx-auto space-y-12">
        <div v-for="group in groups" :key="group.key">
          <h2 class="text-2xl font-bold text-slate-800 mb-2">{{ group.label }}</h2>
          <p class="text-slate-600 mb-5">{{ group.blurb }}</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <NuxtLink
              v-for="g in group.items"
              :key="g.slug"
              :to="`/guides/${g.slug}`"
              class="block rounded-xl border border-slate-200 bg-white p-5 hover:border-primary-300 hover:shadow-sm transition"
            >
              <h3 class="font-semibold text-slate-800 mb-2">{{ g.title }}</h3>
              <p class="text-sm text-slate-600 line-clamp-3">{{ g.description }}</p>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { guides, guideCategories, type GuideCategory } from "~/data/guides";

definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.in";

const order: GuideCategory[] = ["library", "coaching", "gym", "templates", "comparison"];
const groups = order
  .map(key => ({ key, ...guideCategories[key], items: guides.filter(g => g.category === key) }))
  .filter(g => g.items.length);

const title = "Guides for Gym, Library & Coaching Centre Owners in India | MemberBook";
const description = "Free guides for Indian gym, study library and coaching centre owners: fee collection, seat management, fee reminder templates in Hindi and more, and honest software comparisons.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/guides`,
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [{ rel: "canonical", href: `${appUrl}/guides` }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "MemberBook guides",
        "url": `${appUrl}/guides`,
        "itemListElement": guides.map((g, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": g.title,
          "url": `${appUrl}/guides/${g.slug}`,
        })),
      }),
    },
  ],
});
</script>
