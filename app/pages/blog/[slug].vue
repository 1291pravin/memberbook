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
          <span class="text-slate-900">{{ article.title }}</span>
        </nav>

        <!-- Article Meta -->
        <div class="mb-6">
          <div class="text-sm text-primary-600 font-medium mb-2">{{ article.category }}</div>
          <h1 class="text-4xl font-bold text-slate-800 mb-4">{{ article.title }}</h1>
          <div class="flex items-center gap-4 text-sm text-slate-600">
            <span>{{ article.date }}</span>
            <span>&middot;</span>
            <span>{{ article.readTime }} read</span>
          </div>
        </div>

        <!-- Article Content -->
        <div class="prose prose-slate max-w-none">
          <p class="lead text-lg text-slate-600">{{ article.excerpt }}</p>

          <!-- Placeholder for article content -->
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center my-8">
            <div class="text-5xl mb-4">📝</div>
            <p class="text-slate-600">
              Article content will be added here. This is a placeholder for the blog post structure.
            </p>
          </div>
        </div>

        <!-- Share -->
        <div class="mt-12 pt-8 border-t border-slate-200">
          <p class="text-sm font-medium text-slate-800 mb-4">Share this article</p>
          <div class="flex gap-3">
            <a
              :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`"
              target="_blank"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              Twitter
            </a>
            <a
              :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`"
              target="_blank"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
            >
              Facebook
            </a>
            <a
              :href="`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`"
              target="_blank"
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
definePageMeta({ layout: "default" });

const route = useRoute();
const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";
const slug = route.params.slug as string;

// In a real implementation, this would fetch from a CMS or database
// For now, using placeholder data
const article = ref({
  slug,
  title: "Sample Blog Post",
  excerpt: "This is a placeholder for blog article content. Replace this with your actual blog post data.",
  category: "Guides",
  date: "Feb 12, 2025",
  readTime: "5 min",
  author: "MemberBook Team",
});

const articleUrl = `${appUrl}/blog/${slug}`;

useSeoMeta({
  title: `${article.value.title} - MemberBook Blog`,
  description: article.value.excerpt,
  ogTitle: article.value.title,
  ogDescription: article.value.excerpt,
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: articleUrl,
  ogType: "article",
  articlePublishedTime: article.value.date,
  articleAuthor: article.value.author,
  twitterCard: "summary_large_image",
  twitterTitle: article.value.title,
  twitterDescription: article.value.excerpt,
  twitterImage: `${appUrl}/og-image.png`,
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
        "headline": article.value.title,
        "description": article.value.excerpt,
        "datePublished": article.value.date,
        "author": {
          "@type": "Organization",
          "name": article.value.author,
        },
        "publisher": {
          "@type": "Organization",
          "name": "MemberBook",
          "logo": {
            "@type": "ImageObject",
            "url": `${appUrl}/logo.svg`,
          },
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": articleUrl,
        },
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
            "name": article.value.title,
            "item": articleUrl,
          },
        ],
      }),
    },
  ],
});
</script>
