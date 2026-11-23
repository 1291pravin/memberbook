<template>
  <section class="px-4 py-10">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-lg font-bold text-slate-800">{{ heading }}</h2>
      <ul class="mt-4 flex flex-wrap justify-center gap-2">
        <li v-for="p in pages" :key="p.slug">
          <NuxtLink :to="localPagePath(p)" class="inline-block rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:border-primary-600 hover:text-primary-700">{{ p.city }}</NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { kindInfo, localPagePath, localPages, type LocalKind } from "~/data/local-pages";

const props = defineProps<{ kind: LocalKind }>();
const pages = localPages.filter(p => p.kind === props.kind);
const heading = `MemberBook for ${kindInfo[props.kind].placePlural} in your city`;
</script>
