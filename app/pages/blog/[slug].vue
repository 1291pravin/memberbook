<template>
  <div>
    <!-- Article Header -->
    <article class="py-12 px-4">
      <div class="max-w-3xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="text-sm text-slate-600 mb-6">
          <NuxtLink to="/" class="hover:text-primary-600">Home</NuxtLink>
          <span class="mx-2">/</span>
          <NuxtLink to="/blog" class="hover:text-primary-600">Blog</NuxtLink>
          <span class="mx-2">/</span>
          <span class="text-slate-800">{{ article.title }}</span>
        </nav>

        <!-- Hero image -->
        <div class="rounded-xl overflow-hidden mb-8 shadow-md">
          <img
            :src="article.image"
            :alt="article.title"
            class="w-full aspect-video object-cover"
          >
        </div>

        <!-- Category + Title -->
        <div class="mb-8">
          <div class="text-sm text-primary-600 font-semibold mb-3 uppercase tracking-wide">{{ article.category }}</div>
          <h1 class="text-4xl font-bold text-slate-800 mb-5 leading-tight">{{ article.title }}</h1>
          <div class="flex items-center gap-4 text-sm text-slate-600 pb-6 border-b border-slate-200">
            <span>By {{ article.author }}</span>
            <span>&middot;</span>
            <span>{{ article.date }}</span>
            <span>&middot;</span>
            <span>{{ article.readTime }} read</span>
          </div>
        </div>

        <!-- Lead excerpt -->
        <p class="text-xl text-slate-600 leading-relaxed mb-8">{{ article.excerpt }}</p>

        <!-- Article Content -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose-content" v-html="article.content" />

        <!-- Share -->
        <div class="mt-12 pt-8 border-t border-slate-200">
          <p class="text-sm font-medium text-slate-800 mb-4">Share this article</p>
          <div class="flex gap-3 flex-wrap">
            <a
              :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              X (Twitter)
            </a>
            <a
              :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              Facebook
            </a>
            <a
              :href="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </article>

    <!-- CTA -->
    <section class="py-12 px-4 bg-primary-50">
      <div class="max-w-xl mx-auto text-center">
        <h2 class="text-2xl font-bold text-slate-800 mb-3">Ready to get started?</h2>
        <p class="text-slate-600 mb-6">
          Try MemberBook free and see how easy member management can be.
        </p>
        <NuxtLink to="/register">
          <AppButton size="lg">Start Free Trial</AppButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getBlogPost } from "~/data/blogPosts";

definePageMeta({ layout: "default" });

const route = useRoute();
const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";
const slug = route.params.slug as string;

const article = getBlogPost(slug);

if (!article) {
  throw createError({ statusCode: 404, message: "Article not found" });
}

const articleUrl = `${appUrl}/blog/${slug}`;
const ogImage = `${appUrl}${article.image}`;

useSeoMeta({
  title: `${article.title} - MemberBook Blog`,
  description: article.excerpt,
  ogTitle: article.title,
  ogDescription: article.excerpt,
  ogImage,
  ogUrl: articleUrl,
  ogType: "article",
  articlePublishedTime: article.dateISO,
  articleAuthor: article.author,
  articleTag: article.keywords,
  twitterCard: "summary_large_image",
  twitterTitle: article.title,
  twitterDescription: article.excerpt,
  twitterImage: ogImage,
});

useHead({
  link: [
    { rel: "canonical", href: articleUrl },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": article.title,
        "description": article.excerpt,
        "keywords": article.keywords.join(", "),
        "datePublished": article.dateISO,
        "dateModified": article.dateISO,
        "author": {
          "@type": "Organization",
          "name": article.author,
          "url": appUrl,
        },
        "publisher": {
          "@type": "Organization",
          "name": "MemberBook",
          "logo": {
            "@type": "ImageObject",
            "url": `${appUrl}/logo.png`,
          },
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": articleUrl,
        },
        "image": ogImage,
        "inLanguage": "en-IN",
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": appUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": `${appUrl}/blog`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": article.title,
            "item": articleUrl,
          },
        ],
      }),
    },
  ],
});
</script>

<style scoped>
.prose-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b; /* slate-800 */
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.prose-content :deep(h3) {
  font-size: 1.2rem;
  font-weight: 600;
  color: #334155; /* slate-700 */
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
}

.prose-content :deep(p) {
  color: #475569; /* slate-600 */
  line-height: 1.8;
  margin-bottom: 1.25rem;
}

.prose-content :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
}

.prose-content :deep(li) {
  color: #475569; /* slate-600 */
  line-height: 1.8;
  margin-bottom: 0.5rem;
}

.prose-content :deep(strong) {
  color: #1e293b; /* slate-800 */
  font-weight: 600;
}

.prose-content :deep(a) {
  color: var(--color-primary-600, #2563eb);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.prose-content :deep(a:hover) {
  color: var(--color-primary-700, #1d4ed8);
}
</style>
