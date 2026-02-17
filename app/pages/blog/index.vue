<template>
  <div>
    <!-- Hero -->
    <section class="py-12 px-4 text-center bg-slate-50">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl font-bold text-slate-800">MemberBook Blog</h1>
        <p class="mt-3 text-lg text-slate-600">
          Tips, guides, and insights for managing your gym, library, or tuition center.
        </p>
      </div>
    </section>

    <!-- Blog Posts Grid -->
    <section class="py-12 px-4">
      <div class="max-w-5xl mx-auto">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <NuxtLink
            v-for="post in blogPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div class="aspect-video overflow-hidden">
              <img
                :src="post.image"
                :alt="post.title"
                class="w-full h-full object-cover"
              >
            </div>
            <div class="p-6">
              <div class="text-xs text-primary-600 font-medium mb-2">{{ post.category }}</div>
              <h2 class="text-xl font-semibold text-slate-800 mb-2 line-clamp-2">{{ post.title }}</h2>
              <p class="text-sm text-slate-600 mb-4 line-clamp-3">{{ post.excerpt }}</p>
              <div class="flex items-center justify-between text-xs text-slate-600">
                <span>{{ post.date }}</span>
                <span>{{ post.readTime }} read</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Empty State -->
        <div v-if="blogPosts.length === 0" class="text-center py-16">
          <div class="text-6xl mb-4">📝</div>
          <h2 class="text-2xl font-semibold text-slate-800 mb-2">Coming Soon</h2>
          <p class="text-slate-600">We're working on helpful content for you. Check back soon!</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { blogPosts } from "~/data/blogPosts";

definePageMeta({ layout: "default" });

const config = useRuntimeConfig();
const appUrl = config.public.appUrl || "https://memberbook.app";

useSeoMeta({
  title: "Blog - MemberBook | Tips for Gym, Library & Tuition Center Management",
  description: "Read our blog for tips, guides, and best practices on managing gyms, libraries, and tuition centers. Learn how to grow your membership business.",
  ogTitle: "MemberBook Blog - Member Management Tips & Guides",
  ogDescription: "Tips, guides, and insights for managing your gym, library, or tuition center effectively.",
  ogImage: `${appUrl}/og-image.png`,
  ogUrl: `${appUrl}/blog`,
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterTitle: "MemberBook Blog - Membership Management Insights",
  twitterDescription: "Learn how to manage your members, track payments, and grow your business.",
  twitterImage: `${appUrl}/og-image.png`,
});

useHead({
  link: [
    { rel: "canonical", href: `${appUrl}/blog` },
  ],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "MemberBook Blog",
        "description": "Tips, guides, and insights for managing gyms, libraries, and tuition centers",
        "url": `${appUrl}/blog`,
        "publisher": {
          "@type": "Organization",
          "name": "MemberBook",
          "logo": {
            "@type": "ImageObject",
            "url": `${appUrl}/logo.png`,
          },
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
        ],
      }),
    },
  ],
});

</script>
