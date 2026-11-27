<template>
  <NuxtLayout name="default">
    <section class="section">
      <div class="wrap">
        <div class="mx-auto max-w-xl text-center">
          <BrandMark :size="56" class="mx-auto" />
          <p class="mt-6 text-sm font-semibold uppercase tracking-widest text-primary-700">
            {{ notFound ? "Error 404" : `Error ${statusCode}` }}
          </p>
          <h1 class="mt-3 text-3xl font-extrabold text-slate-800 sm:text-4xl">
            {{ notFound ? "We couldn't find that page" : "Something went wrong on our side" }}
          </h1>
          <p class="mt-4 text-lg text-slate-600">
            {{ notFound
              ? "The link may be old or mistyped. Everything else is where you left it."
              : "Please try again in a minute. If it keeps happening, message us and we'll fix it." }}
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button v-if="notFound" type="button" class="btn btn-primary" @click="goTo(loggedIn ? '/dashboard' : '/')">
              {{ loggedIn ? "Go to your dashboard" : "Go to the home page" }}
            </button>
            <button v-else type="button" class="btn btn-primary" @click="retry">
              Try again
            </button>
          </div>
          <p class="mt-8 text-sm text-slate-600">
            Looking for something?
            <NuxtLink to="/guides" class="whitespace-nowrap font-semibold text-primary-700 underline">Guides</NuxtLink>
            &middot;
            <NuxtLink to="/tools" class="whitespace-nowrap font-semibold text-primary-700 underline">Free tools</NuxtLink>
            &middot;
            <NuxtLink to="/contact" class="whitespace-nowrap font-semibold text-primary-700 underline">Contact us</NuxtLink>
          </p>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const statusCode = computed(() => props.error?.statusCode || 500);
const notFound = computed(() => statusCode.value === 404);
const { loggedIn } = useUserSession();

useSeoMeta({
  title: () => (notFound.value ? "Page not found - MemberBook" : "Something went wrong - MemberBook"),
  robots: "noindex",
});

function goTo(path: string) {
  clearError({ redirect: path });
}

function retry() {
  clearError();
  if (import.meta.client) window.location.reload();
}
</script>
