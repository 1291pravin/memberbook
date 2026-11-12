import type { H3Event } from "h3";
import { and, asc, eq } from "drizzle-orm";

/**
 * First-party website analytics. The public site sends one beacon per page
 * view to /api/t. We keep a random visitor id in a first-party cookie, the
 * traffic source and Cloudflare's city/region guess. No IP address or user
 * agent is stored.
 */

export const VISITOR_COOKIE = "mb_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface Geo {
  country: string | null;
  region: string | null;
  city: string | null;
}

export interface TrafficSource {
  source: string;
  medium: string;
  campaign: string | null;
  referrerHost: string | null;
}

const clean = (value: unknown, max = 120): string | null => {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, max);
  return v || null;
};

/** Country, region and city from Cloudflare's request.cf (falls back to the cf-ipcountry header). */
export function readGeo(event: H3Event): Geo {
  const ctx = event.context as { cf?: Record<string, unknown>; cloudflare?: { request?: { cf?: Record<string, unknown> } } };
  const cf = ctx.cf ?? ctx.cloudflare?.request?.cf ?? {};
  const country = clean(cf.country, 2) ?? clean(getHeader(event, "cf-ipcountry"), 2);
  return {
    country: country && country !== "XX" && country !== "T1" ? country.toUpperCase() : null,
    region: clean(cf.region, 80),
    city: clean(cf.city, 80),
  };
}

export function deviceFromUserAgent(ua: string): string {
  if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

export function isBot(ua: string): boolean {
  return !ua || /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp\/|curl|wget|python|axios|node-fetch|go-http|java\/|monitor|uptime/i.test(ua);
}

const SEARCH = [
  ["google.", "Google"], ["bing.com", "Bing"], ["duckduckgo.com", "DuckDuckGo"], ["yahoo.", "Yahoo"],
  ["yandex.", "Yandex"], ["ecosia.org", "Ecosia"], ["search.brave.com", "Brave"],
  ["chatgpt.com", "ChatGPT"], ["chat.openai.com", "ChatGPT"], ["perplexity.ai", "Perplexity"],
  ["claude.ai", "Claude"], ["gemini.google.com", "Gemini"],
] as const;
const SOCIAL = [
  ["whatsapp", "WhatsApp"], ["wa.me", "WhatsApp"], ["facebook.com", "Facebook"], ["fb.com", "Facebook"],
  ["instagram.com", "Instagram"], ["youtube.com", "YouTube"], ["youtu.be", "YouTube"], ["t.co", "X"],
  ["twitter.com", "X"], ["x.com", "X"], ["linkedin.com", "LinkedIn"], ["lnkd.in", "LinkedIn"],
  ["reddit.com", "Reddit"], ["quora.com", "Quora"], ["telegram", "Telegram"], ["t.me", "Telegram"],
  ["pinterest.", "Pinterest"], ["threads.net", "Threads"],
] as const;
const AI_SOURCES = new Set(["ChatGPT", "Perplexity", "Claude", "Gemini"]);

function hostMatches(host: string, needle: string) {
  return needle.endsWith(".") ? host.includes(needle) : host === needle || host.endsWith(`.${needle}`) || host.includes(needle);
}

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Work out where a visit came from: UTM tags first, then ad click ids, then
 * the referrer. Our own domain as referrer counts as Direct.
 */
export function classifySource(params: URLSearchParams, referrer: string | null, ownHost: string): TrafficSource {
  let referrerHost: string | null = null;
  if (referrer) {
    try {
      referrerHost = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    }
    catch { /* ignore bad referrer */ }
  }
  if (referrerHost && (referrerHost === ownHost || referrerHost.endsWith(`.${ownHost}`))) referrerHost = null;

  const utmSource = clean(params.get("utm_source"), 60);
  const utmMedium = clean(params.get("utm_medium"), 60)?.toLowerCase() ?? null;
  const campaign = clean(params.get("utm_campaign"), 80);

  if (utmSource) {
    const known = [...SEARCH, ...SOCIAL].find(([n]) => hostMatches(utmSource.toLowerCase(), n.replace(/\.$/, "")));
    return {
      source: known ? known[1] : titleCase(utmSource),
      medium: utmMedium ?? (known && SOCIAL.some(s => s[1] === known[1]) ? "social" : "campaign"),
      campaign,
      referrerHost,
    };
  }
  if (params.get("gclid") || params.get("gbraid") || params.get("wbraid")) {
    return { source: "Google", medium: "paid", campaign, referrerHost };
  }
  if (params.get("fbclid")) {
    const ig = referrerHost?.includes("instagram");
    return { source: ig ? "Instagram" : "Facebook", medium: "social", campaign, referrerHost };
  }
  if (!referrerHost) return { source: "Direct", medium: "direct", campaign, referrerHost };

  const search = SEARCH.find(([n]) => hostMatches(referrerHost!, n));
  if (search) return { source: search[1], medium: AI_SOURCES.has(search[1]) ? "ai" : "search", campaign, referrerHost };
  const social = SOCIAL.find(([n]) => hostMatches(referrerHost!, n));
  if (social) return { source: social[1], medium: "social", campaign, referrerHost };
  if (/mail\.|outlook\.|gmail/.test(referrerHost)) return { source: "Email", medium: "email", campaign, referrerHost };
  return { source: referrerHost, medium: "referral", campaign, referrerHost };
}

/** The visitor id from the cookie, creating and setting one if missing. */
export function ensureVisitorId(event: H3Event): string {
  const existing = getCookie(event, VISITOR_COOKIE);
  if (existing && /^[a-zA-Z0-9-]{8,64}$/.test(existing)) return existing;
  const id = crypto.randomUUID();
  setCookie(event, VISITOR_COOKIE, id, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: "lax",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  return id;
}

/**
 * Attribution fields for a new user row: the visitor's first landing on the
 * site (source, campaign, landing page) and where they are signing up from.
 * Never throws: signup must not fail because of analytics.
 */
export async function signupAttribution(event: H3Event) {
  const geo = readGeo(event);
  const visitorId = getCookie(event, VISITOR_COOKIE);
  const base = {
    visitorId: visitorId && /^[a-zA-Z0-9-]{8,64}$/.test(visitorId) ? visitorId : null,
    signupSource: null as string | null,
    signupMedium: null as string | null,
    signupCampaign: null as string | null,
    signupLanding: null as string | null,
    signupCountry: geo.country,
    signupRegion: geo.region,
    signupCity: geo.city,
  };
  if (!base.visitorId) return base;
  try {
    const [first] = await db.select({
      source: schema.siteVisits.source,
      medium: schema.siteVisits.medium,
      campaign: schema.siteVisits.campaign,
      path: schema.siteVisits.path,
    })
      .from(schema.siteVisits)
      .where(and(eq(schema.siteVisits.visitorId, base.visitorId), eq(schema.siteVisits.isLanding, true)))
      .orderBy(asc(schema.siteVisits.createdAt))
      .limit(1);
    if (first) {
      base.signupSource = first.source;
      base.signupMedium = first.medium;
      base.signupCampaign = first.campaign;
      base.signupLanding = first.path;
    }
  }
  catch (error) {
    console.warn("signup attribution lookup failed", error);
  }
  return base;
}
