// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "@nuxt/hints", "@nuxthub/core", "nuxt-auth-utils"],
  vite: {
    plugins: [tailwindcss()],
    build: {
      sourcemap: false,
    },
  },
  css: ["~/assets/css/main.css"],
  hub: {
    db: "sqlite",
    cache: true,
  },
  runtimeConfig: {
    oauth: {
      google: {
        clientId: "",
        clientSecret: "",
      },
    },
  },
});
