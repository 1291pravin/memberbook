<template>
  <div class="admin-shell flex min-h-[80vh] items-center px-4 py-10">
    <div class="mx-auto w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <div class="mb-6 flex items-center gap-2.5">
        <span class="admin-logo flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold">M</span>
        <div>
          <h1 class="text-lg font-semibold text-slate-900">Admin login</h1>
          <p class="text-xs text-slate-600">MemberBook</p>
        </div>
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
