<template>
  <figure class="my-10">
    <div class="relative w-full overflow-hidden rounded-xl bg-slate-900" style="aspect-ratio: 16 / 9">
      <iframe
        v-if="playing"
        :src="`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`"
        :title="title"
        class="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
      <button
        v-else
        type="button"
        class="group absolute inset-0 h-full w-full"
        :aria-label="`Play video: ${title}`"
        @click="playing = true"
      >
        <img :src="poster" :alt="title" class="h-full w-full object-cover" loading="lazy">
        <span class="absolute inset-0 flex items-center justify-center bg-slate-900/20 transition group-hover:bg-slate-900/30">
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg">
            <svg viewBox="0 0 24 24" class="ml-1 h-7 w-7 text-slate-800" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
      </button>
    </div>
    <figcaption v-if="caption" class="mt-2 text-sm text-slate-600">{{ caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  videoId: string
  title: string
  poster: string
  caption?: string
}>();

const playing = ref(false);
</script>
