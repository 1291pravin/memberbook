<template>
  <div class="min-h-[80vh] bg-slate-50 px-4 py-10">
    <div class="mx-auto flex w-full max-w-sm flex-col justify-center">
      <div class="mb-8">
        <p class="text-sm font-semibold text-primary-600">MemberBook</p>
        <h1 class="mt-2 text-2xl font-bold text-slate-800">Admin login</h1>
      </div>

      <div
        v-if="error"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <form class="space-y-4" @submit.prevent="login">
        <AppInput
          v-model="password"
          label="Admin password"
          type="password"
          placeholder="Enter admin password"
          required
        />
        <AppButton type="submit" class="w-full" :loading="loading">
          Login
        </AppButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

useSeoMeta({
  robots: "noindex, nofollow",
});

const route = useRoute();
const password = ref("");
const error = ref("");
const loading = ref(false);

const { data: session } = await useFetch<{ authenticated: boolean }>("/api/admin/session", {
  key: "admin-login-session",
});

if (session.value?.authenticated) {
  await navigateTo("/admin/usage");
}

async function login() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/admin/login", {
      method: "POST",
      body: { password: password.value },
    });

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/admin/usage";
    await navigateTo(redirect.startsWith("/admin/") ? redirect : "/admin/usage");
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Admin login failed";
  } finally {
    loading.value = false;
  }
}
</script>
