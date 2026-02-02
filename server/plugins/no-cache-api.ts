export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("beforeResponse", (event) => {
    if (getRequestURL(event).pathname.startsWith("/api/")) {
      setResponseHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate");
    }
  });
});
