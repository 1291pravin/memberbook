<template>
  <div>
    <article class="py-12 px-4">
      <div class="max-w-3xl mx-auto">
        <nav class="text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600">Home</NuxtLink>
          <span class="mx-2">/</span>
          <NuxtLink to="/guides" class="hover:text-primary-600">Guides</NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-slate-800">{{ guide.title }}</span>
        </nav>

        <div class="text-sm text-primary-600 font-semibold mb-3 uppercase tracking-wide">{{ categoryLabel }}</div>
        <h1 class="text-3xl sm:text-4xl font-bold text-slate-800 mb-4 leading-tight">{{ guide.title }}</h1>
        <p class="text-sm text-slate-600 mb-8">Updated {{ updatedLabel }} · MemberBook</p>

        <!-- Short answer first, for readers and answer engines -->
        <div class="rounded-xl border border-primary-200 bg-primary-50 p-5 mb-10">
          <p class="text-sm font-semibold text-primary-700 mb-2">Short answer</p>
          <p class="text-lg text-slate-800 leading-relaxed">{{ guide.answer }}</p>
        </div>

        <div class="guide-content" v-html="guide.content" />

        <section v-if="guide.faqs.length" class="mt-12">
          <h2 class="text-2xl font-bold text-slate-800 mb-6">Questions owners ask</h2>
          <div class="space-y-6">
            <div v-for="faq in guide.faqs" :key="faq.q">
              <h3 class="font-semibold text-slate-800 mb-2">{{ faq.q }}</h3>
              <p class="text-slate-600 leading-relaxed">{{ faq.a }}</p>
            </div>
          </div>
        </section>

        <div class="mt-12 rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
          <h2 class="text-xl font-bold text-slate-800 mb-2">Let us set it up for you, free</h2>
          <p class="text-slate-600 mb-5">Send a photo of your register. We load every member, plan and due date, and you see each morning who to collect from.</p>
          <div class="flex flex-wrap gap-3 justify-center">
            <a :href="setupLink" :target="setupLink.startsWith('http') ? '_blank' : undefined" rel="noopener">
              <AppButton>Send us your register</AppButton>
            </a>
            <NuxtLink to="/register">
              <AppButton variant="secondary">Set it up myself</AppButton>
            </NuxtLink>
          </div>
        </div>

        <section v-if="related.length" class="mt-12">
          <h2 class="text-xl font-bold text-slate-800 mb-4">Related guides</h2>
          <ul class="space-y-2">
            <li v-for="r in related" :key="r.slug">
              <NuxtLink :to="`/guides/${r.slug}`" class="text-primary-700 underline underline-offset-2 hover:text-primary-800">{{ r.title }}</NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { getGuide, guides, guideCategories } from "~/data/guides";

definePageMeta({ layout: "default" });

const route = useRoute();
const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.in";
const slug = route.params.slug as string;

const found = getGuide(slug);
if (!found) {
  throw createError({ statusCode: 404, message: "Guide not found" });
}
const guide = found;

const categoryLabel = guideCategories[guide.category].label;
const updatedLabel = new Date(`${guide.updatedISO}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const related = (guide.related || []).map(s => guides.find(g => g.slug === s)).filter((g): g is NonNullable<typeof g> => !!g);

const { setupHref } = useSupport();
const setupLink = computed(() => setupHref(`Hi MemberBook team, I read "${guide.title}" and want you to set up my register.\n\nBusiness name:\nCity:\nNumber of members (approx):`));

const pageUrl = `${appUrl}/guides/${slug}`;

useSeoMeta({
  title: guide.metaTitle,
  description: guide.description,
  ogTitle: guide.metaTitle,
  ogDescription: guide.description,
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: pageUrl,
  ogType: "article",
  twitterCard: "summary_large_image",
  twitterTitle: guide.metaTitle,
  twitterDescription: guide.description,
  twitterImage: `${appUrl}/og-image.png`,
});

const scripts: { type: string; innerHTML: string }[] = [
  {
    type: "application/ld+json",
    innerHTML: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": guide.title,
      "description": guide.description,
      "datePublished": guide.publishedISO,
      "dateModified": guide.updatedISO,
      "author": { "@type": "Organization", "name": "MemberBook", "url": appUrl },
      "publisher": {
        "@type": "Organization",
        "name": "MemberBook",
        "logo": { "@type": "ImageObject", "url": `${appUrl}/logo.png` },
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
      "image": `${appUrl}/og-image.png`,
      "inLanguage": "en-IN",
    }),
  },
  {
    type: "application/ld+json",
    innerHTML: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": appUrl },
        { "@type": "ListItem", "position": 2, "name": "Guides", "item": `${appUrl}/guides` },
        { "@type": "ListItem", "position": 3, "name": guide.title, "item": pageUrl },
      ],
    }),
  },
];

if (guide.faqs.length) {
  scripts.push({
    type: "application/ld+json",
    innerHTML: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": guide.faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    }),
  });
}

useHead({
  link: [{ rel: "canonical", href: pageUrl }],
  script: scripts,
});
</script>

<style scoped>
.guide-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b; /* slate-800 */
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.guide-content :deep(h3) {
  font-size: 1.15rem;
  font-weight: 600;
  color: #334155; /* slate-700 */
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
}

.guide-content :deep(p) {
  color: #475569; /* slate-600 */
  line-height: 1.8;
  margin-bottom: 1.25rem;
}

.guide-content :deep(ul),
.guide-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
}

.guide-content :deep(ul) { list-style-type: disc; }
.guide-content :deep(ol) { list-style-type: decimal; }

.guide-content :deep(li) {
  color: #475569; /* slate-600 */
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

.guide-content :deep(strong) {
  color: #1e293b; /* slate-800 */
  font-weight: 600;
}

.guide-content :deep(a) {
  color: var(--color-primary-700, #1d4ed8);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.guide-content :deep(table) {
  display: block;
  overflow-x: auto;
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.95rem;
}

.guide-content :deep(th),
.guide-content :deep(td) {
  border: 1px solid #e2e8f0; /* slate-200 */
  padding: 0.6rem 0.75rem;
  text-align: left;
  vertical-align: top;
  color: #334155; /* slate-700 */
}

.guide-content :deep(th) {
  background: #f8fafc; /* slate-50 */
  font-weight: 600;
  color: #1e293b; /* slate-800 */
}

.guide-content :deep(.template) {
  background: #f8fafc; /* slate-50 */
  border: 1px solid #e2e8f0; /* slate-200 */
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin: 0.75rem 0 1.5rem;
  white-space: pre-line;
  color: #1e293b; /* slate-800 */
  line-height: 1.7;
}
</style>
