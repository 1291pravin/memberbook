/** The website draft for this request, for the admin's preview frame. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const req = await getServiceRequestOr404(event);
  const site = await ensureWebsite(req.orgId);
  const html = site.draftHtml || site.liveHtml;
  if (!html) throw createError({ statusCode: 404, statusMessage: "No draft yet" });
  setWebsiteSecurityHeaders(event);
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "Content-Type", "text/html; charset=utf-8");
  return html;
});
