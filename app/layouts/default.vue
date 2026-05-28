<template>
  <div class="mb mb-warm min-h-screen">
    <!-- Announce bar -->
    <div class="announce">
      <span class="acc">NEW</span>
      WhatsApp renewal reminders are now bundled in every plan —
      <NuxtLink to="/features">see what's new &rarr;</NuxtLink>
    </div>

    <header class="mb-nav">
      <div class="wrap nav-inner">
        <NuxtLink to="/" class="brand" aria-label="MemberBook home">
          <BrandMark :size="30" />
          <span class="brand-name">MemberBook</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="nav-links">
          <NuxtLink to="/features">Features</NuxtLink>
          <NuxtLink to="/#pricing">Pricing</NuxtLink>
          <NuxtLink to="/blog">Blog</NuxtLink>
          <NuxtLink to="/tools">Tools</NuxtLink>
          <NuxtLink to="/contact">Contact</NuxtLink>
        </nav>

        <!-- Desktop CTA -->
        <div class="nav-cta">
          <template v-if="loggedIn">
            <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm">Dashboard</NuxtLink>
            <button class="btn btn-ghost btn-sm" @click="logout">Log out</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn btn-ghost btn-sm">Log in</NuxtLink>
            <NuxtLink to="/register" class="btn btn-accent btn-sm" @click="trackCtaClick('nav_get_started')">
              Start free
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </NuxtLink>
          </template>
        </div>

        <!-- Mobile controls -->
        <div class="nav-mobile">
          <template v-if="loggedIn">
            <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm">Dashboard</NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn btn-ghost btn-sm">Log in</NuxtLink>
          </template>
          <button
            class="row-action"
            style="width: 38px; height: 38px;"
            aria-label="Toggle menu"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg v-if="!mobileMenuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu dropdown -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="mobileMenuOpen" class="md:hidden" style="border-top: 1px solid var(--border); background: var(--paper);">
          <div class="wrap" style="padding-top: 14px; padding-bottom: 16px; display: flex; flex-direction: column; gap: 4px;">
            <NuxtLink class="mb-mobile-link" to="/features" @click="mobileMenuOpen = false">Features</NuxtLink>
            <NuxtLink class="mb-mobile-link" to="/#pricing" @click="mobileMenuOpen = false">Pricing</NuxtLink>
            <NuxtLink class="mb-mobile-link" to="/blog" @click="mobileMenuOpen = false">Blog</NuxtLink>
            <NuxtLink class="mb-mobile-link" to="/tools" @click="mobileMenuOpen = false">Tools</NuxtLink>
            <NuxtLink class="mb-mobile-link" to="/contact" @click="mobileMenuOpen = false">Contact</NuxtLink>
            <template v-if="loggedIn">
              <button class="mb-mobile-link" style="text-align: left;" @click="mobileMenuOpen = false; logout()">Log out</button>
            </template>
            <template v-else>
              <NuxtLink to="/register" class="btn btn-accent btn-sm" style="margin-top: 8px; align-self: flex-start;" @click="mobileMenuOpen = false; trackCtaClick('mobile_nav_get_started')">Start free</NuxtLink>
            </template>
          </div>
        </div>
      </Transition>
    </header>

    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="mb-footer">
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <div class="brand">
              <BrandMark :size="28" />
              <span class="brand-name">MemberBook</span>
            </div>
            <p class="blurb">The friendly way to run a gym, library, or tuition center in India. Made with care.</p>
            <a
              :href="`https://wa.me/${WHATSAPP_NUMBER}`"
              target="_blank"
              rel="noopener"
              style="display: inline-flex; gap: 8px; margin-top: 14px; color: var(--ink-3); align-items: center; font-size: 13px;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M19.05 4.91A10 10 0 0 0 2.05 14.83l-1.4 5.16 5.28-1.39A10 10 0 1 0 19.05 4.9zm-7.04 15.37a8 8 0 0 1-4.06-1.11l-.29-.17-3.13.82.83-3.05-.19-.31a8 8 0 1 1 6.84 3.82zm4.39-6c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.92-1.18-.71-.63-1.18-1.41-1.32-1.65-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" /></svg>
              +91 91378 49812
            </a>
          </div>
          <div>
            <h5>Product</h5>
            <ul>
              <li><NuxtLink to="/features">Features</NuxtLink></li>
              <li><NuxtLink to="/#pricing">Pricing</NuxtLink></li>
              <li><NuxtLink to="/tools">Free tools</NuxtLink></li>
              <li><NuxtLink to="/blog">Blog</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h5>For</h5>
            <ul>
              <li><NuxtLink to="/gym">Gyms</NuxtLink></li>
              <li><NuxtLink to="/tuition">Tuition centers</NuxtLink></li>
              <li><NuxtLink to="/library">Libraries</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li><NuxtLink to="/about">About</NuxtLink></li>
              <li><NuxtLink to="/blog">Blog</NuxtLink></li>
              <li><NuxtLink to="/contact">Contact</NuxtLink></li>
            </ul>
          </div>
          <div>
            <h5>Help</h5>
            <ul>
              <li>
                <a :href="`https://wa.me/${WHATSAPP_NUMBER}`" target="_blank" rel="noopener">WhatsApp us</a>
              </li>
              <li><NuxtLink to="/contact">Get setup help</NuxtLink></li>
              <li><NuxtLink to="/privacy">Privacy</NuxtLink></li>
              <li><NuxtLink to="/terms">Terms</NuxtLink></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div>&copy; {{ new Date().getFullYear() }} MemberBook &middot; Made in India.</div>
          <div style="display: flex; gap: 18px;">
            <NuxtLink to="/privacy">Privacy</NuxtLink>
            <NuxtLink to="/terms">Terms</NuxtLink>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";

const route = useRoute();
const { loggedIn, clear } = useUserSession();
const mobileMenuOpen = ref(false);
const { trackCtaClick } = useAnalytics();

const WHATSAPP_NUMBER = "919137849812";

// MemberBook mark: a compact ledger monogram with payment/member dots.
const BrandMark = (props: { size?: number }) =>
  h("svg", { width: props.size ?? 30, height: props.size ?? 30, viewBox: "0 0 48 48", fill: "none", "aria-hidden": "true" }, [
    h("rect", { x: 3, y: 3, width: 42, height: 42, rx: 13, fill: "var(--ink)" }),
    h("path", {
      d: "M13.5 31.5v-14c0-2 1.5-3.5 3.5-3.5h3.4c1.2 0 2.3.7 2.9 1.7l.7 1.3.7-1.3c.6-1 1.7-1.7 2.9-1.7H31c2 0 3.5 1.5 3.5 3.5v14",
      stroke: "var(--paper)",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
    h("path", { d: "M18 22h3M27 22h3", stroke: "var(--accent)", "stroke-width": 2.4, "stroke-linecap": "round" }),
    h("circle", { cx: 19, cy: 28, r: 2.1, fill: "var(--positive)" }),
    h("circle", { cx: 29, cy: 28, r: 2.1, fill: "var(--saffron)" }),
    h("path", { d: "M20 35c2.5 1.3 5.5 1.3 8 0", stroke: "var(--paper)", "stroke-width": 2.4, "stroke-linecap": "round", opacity: ".9" }),
  ]);

watch(() => route.path, () => {
  mobileMenuOpen.value = false;
});

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  navigateTo("/login");
}
</script>

<style scoped>
.mb-mobile-link {
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-2);
  padding: 10px 4px;
  border-radius: 8px;
}
.mb-mobile-link:hover { color: var(--ink); background: var(--paper-2); }
</style>
