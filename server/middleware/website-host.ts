/**
 * Business websites on their own subdomain: <slug>.memberbook.in serves the
 * same page as memberbook.in/s/<slug>. The page links its images, manifest and
 * enquiry form under /s/<slug>/..., which the normal routes handle on any host.
 *
 * Needs a wildcard DNS record (*.memberbook.in, proxied) and a Worker route
 * for *.memberbook.in/* in Cloudflare. Until then, sites live at /s/<slug>.
 */
const RESERVED = new Set(["www", "app", "api", "admin", "mail", "staging", "dev"]);

export default defineEventHandler(async (event) => {
  const host = (getRequestHeader(event, "host") || "").toLowerCase().split(":")[0]!;
  const match = /^([a-z0-9-]{1,60})\.memberbook\.in$/.exec(host);
  if (!match || RESERVED.has(match[1]!)) return;

  const path = getRequestURL(event).pathname;
  if (path.startsWith("/s/") || path.startsWith("/_nuxt/") || /\.(png|ico|svg|webmanifest|xml)$/.test(path)) return;
  if (path !== "/") return sendRedirect(event, "/", 302);

  const site = await getWebsiteBySlug(match[1]!);
  if (!site || site.status !== "live" || !site.liveHtml) {
    throw createError({ statusCode: 404, statusMessage: "Website not found" });
  }
  setWebsiteSecurityHeaders(event);
  setHeader(event, "Cache-Control", "public, max-age=60");
  setHeader(event, "Content-Type", "text/html; charset=utf-8");
  return site.liveHtml;
});
