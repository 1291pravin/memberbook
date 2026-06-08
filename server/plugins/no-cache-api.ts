export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("beforeResponse", (event) => {
    const request = getRequestURL(event);
    const acceptsHtml = getHeader(event, "accept")?.includes("text/html");

    if (request.pathname.startsWith("/api/") || acceptsHtml) {
      setResponseHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate");
    }
  });
});
