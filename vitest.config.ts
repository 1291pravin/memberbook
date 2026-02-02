import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    dir: "tests",
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
