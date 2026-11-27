/**
 * Force HTTPS and set baseline security headers on every Worker response.
 *
 * Cloudflare passes the scheme the visitor used in the cf-visitor header
 * ({"scheme":"http"}). Without it (local dev, tests) nothing is redirected.
 * Only GET/HEAD are redirected: webhooks and forms always post to https URLs,
 * and a redirect would turn a POST into a GET.
 */
export default defineEventHandler((event) => {
  const method = event.method;
  const visitor = getRequestHeader(event, "cf-visitor") || "";
  // Only Cloudflare sets cf-visitor, so this can never loop or fire in dev
  // (x-forwarded-proto is not used: dev servers set it to http).
  if ((method === "GET" || method === "HEAD") && visitor.includes("\"http\"")) {
    const url = getRequestURL(event);
    url.protocol = "https:";
    return sendRedirect(event, url.toString(), 301);
  }

  // One year of HTTPS-only. Subdomains are left out on purpose: business
  // websites on <slug>.memberbook.in are switched on later.
  setResponseHeader(event, "Strict-Transport-Security", "max-age=31536000");
  setResponseHeader(event, "X-Content-Type-Options", "nosniff");
  setResponseHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
  setResponseHeader(event, "X-Frame-Options", "SAMEORIGIN");
});
