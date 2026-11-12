/** A business's published website. */
export default defineEventHandler(async (event) => {
  const site = await getWebsiteBySlug(String(getRouterParam(event, "slug") || ""));
  if (!site || site.status !== "live" || !site.liveHtml) {
    throw createError({ statusCode: 404, statusMessage: "Website not found" });
  }
  setWebsiteSecurityHeaders(event);
  setHeader(event, "Cache-Control", "public, max-age=60");
  setHeader(event, "Content-Type", "text/html; charset=utf-8");
  return site.liveHtml;
});
