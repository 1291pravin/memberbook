export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("beforeResponse", (event) => {
    const request = getRequestURL(event);
    const acceptsHtml = getHeader(event, "accept")?.includes("text/html");

    // Member photos set their own (private, versioned) caching in photo.get.ts.
    if (/^\/api\/orgs\/\d+\/members\/\d+\/photo$/.test(request.pathname)) return;

    if (request.pathname.startsWith("/api/") || acceptsHtml) {
      setResponseHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate");
    }
  });
});
