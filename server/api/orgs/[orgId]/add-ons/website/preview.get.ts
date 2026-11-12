/** The draft website as HTML, for the preview frame on the website page. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const site = await ensureWebsite(access.orgId);
  const html = getQuery(event).live ? site.liveHtml : (site.draftHtml || site.liveHtml);
  if (!html) throw createError({ statusCode: 404, statusMessage: "No website yet" });
  setWebsiteSecurityHeaders(event);
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "Content-Type", "text/html; charset=utf-8");
  return html;
});
