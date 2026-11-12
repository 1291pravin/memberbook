/**
 * Page-view beacon from the public site (app/plugins/site-visits.client.ts).
 * Body: { u: path with query string, r: referrer (landing page only), l: 1 on the first page of a visit }.
 * Always answers 204 so it never shows up as an error in the browser.
 */
const SKIP_PREFIXES = ["/dashboard", "/admin", "/api", "/pay/", "/checkin/", "/s/", "/_"];

export default defineEventHandler(async (event) => {
  setResponseStatus(event, 204);
  try {
    const ua = getHeader(event, "user-agent") ?? "";
    if (isBot(ua)) return null;

    const raw = await readRawBody(event);
    if (!raw || raw.length > 4000) return null;
    const body = JSON.parse(raw) as { u?: unknown; r?: unknown; l?: unknown };
    if (typeof body.u !== "string" || !body.u.startsWith("/")) return null;

    const url = new URL(body.u, "https://memberbook.in");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path.length > 200 || SKIP_PREFIXES.some(p => path.startsWith(p))) return null;

    const isLanding = body.l === 1 || body.l === true;
    const referrer = isLanding && typeof body.r === "string" ? body.r.slice(0, 500) : null;
    const ownHost = getRequestURL(event).hostname.replace(/^www\./, "");
    const traffic = isLanding
      ? classifySource(url.searchParams, referrer, ownHost)
      : { source: null, medium: null, campaign: null, referrerHost: null };
    const geo = readGeo(event);

    await db.insert(schema.siteVisits).values({
      visitorId: ensureVisitorId(event),
      day: todayIST(),
      path,
      isLanding,
      source: traffic.source,
      medium: traffic.medium,
      campaign: traffic.campaign,
      referrerHost: traffic.referrerHost,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      device: deviceFromUserAgent(ua),
      createdAt: new Date().toISOString(),
    });
  }
  catch (error) {
    console.warn("site visit beacon failed", error);
  }
  return null;
});
