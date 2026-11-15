/** A business's published website. */
export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") || "");
  const site = await getWebsiteBySlug(slug);
  if (!site || site.status !== "live" || !site.liveHtml) {
    throw createError({ statusCode: 404, statusMessage: "Website not found" });
  }
  setWebsiteSecurityHeaders(event);
  setHeader(event, "Cache-Control", "public, max-age=60");
  setHeader(event, "Content-Type", "text/html; charset=utf-8");
  return withMadeByFooter(site.liveHtml, slug);
});

/**
 * A small "Website by MemberBook" line at the bottom of every site we build:
 * other owners who visit find us (tracked as referral traffic per site).
 * Added at serve time so existing sites get it too, and skipped if the site
 * already links to MemberBook.
 */
function withMadeByFooter(html: string, slug: string) {
  if (/memberbook\.in\/\?utm_source=client-site/i.test(html)) return html;
  const href = `https://memberbook.in/?utm_source=client-site&utm_medium=referral&utm_campaign=${encodeURIComponent(slug)}`;
  const footer = `<p style="margin:0;padding:14px 16px;text-align:center;font:13px/1.4 system-ui,sans-serif;color:#475569;background:#f8fafc">Website and fee reminders by <a href="${href}" style="color:#0f766e;font-weight:600">MemberBook</a></p>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${footer}</body>`) : html + footer;
}
