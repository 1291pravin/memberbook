<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-slate-800 text-center mb-8">
        Sign in to MemberBook
      </h1>

      <div
        v-if="error"
        class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <AppInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <AppInput
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="Your password"
          required
        />
        <AppButton type="submit" class="w-full" :loading="loading">
          Sign In
        </AppButton>
      </form>

      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-slate-200" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-slate-50 px-2 text-slate-500">or</span>
        </div>
      </div>

      <a
        href="/auth/google"
        class="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </a>

      <p class="mt-6 text-center text-sm text-slate-500">
        Don't have an account?
        <NuxtLink
          :to="route.query.redirect ? `/register?redirect=${encodeURIComponent(route.query.redirect as string)}` : '/register'"
          class="text-primary-600 hover:text-primary-500 font-medium"
          >Sign up</NuxtLink
        >
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "guest" });

const { fetch: refreshSession, session } = useUserSession();

const form = reactive({ email: "", password: "" });
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { email: form.email, password: form.password },
    });
    await refreshSession();

    // Handle redirect parameter
    const redirect = route.query.redirect as string;
    if (redirect && redirect.startsWith("/")) {
      navigateTo(redirect);
    } else {
      navigateTo(session.value?.currentOrg ? "/dashboard" : "/onboarding");
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Login failed";
  } finally {
    loading.value = false;
  }
}

const route = useRoute();
if (route.query.error === "oauth") {
  error.value = "Google sign-in failed. Please try again.";
}
</script>
