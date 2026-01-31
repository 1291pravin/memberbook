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
    db: {
      dialect: "sqlite",
      driver: "d1",
      connection: { databaseId: "7b694b50-7cbb-4f81-989c-c28ab4884f02" },
    },
    cache: {
      driver: "cloudflare-kv-binding",
      namespaceId: "2e5b2b3d603346dfab9979436363be9e",
    },
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
