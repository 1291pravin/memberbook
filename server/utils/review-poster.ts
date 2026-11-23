import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Google review poster (part of the "reviews" add-on). The poster QR points at
 * our short link /r/<token>, which counts the scan and sends the member on to the
 * owner's Google "write a review" link. Going through our link means the owner
 * sees how many people scanned, and can fix a wrong Google link without
 * reprinting the poster.
 */

/** Hosts a Google review or Maps link can be on. */
const GOOGLE_HOSTS = [
  "g.page",
  "maps.app.goo.gl",
  "goo.gl",
  "g.co",
  "google.com",
  "google.co.in",
  "search.google.com",
  "maps.google.com",
  "maps.google.co.in",
  "business.google.com",
];

/**
 * Checks and tidies an owner-pasted Google review link. Returns the link to
 * store, or an error to show. A bare Place ID becomes Google's write-review URL.
 */
export function normaliseGoogleReviewUrl(raw: string): { url: string } | { error: string } {
  let value = String(raw || "").trim();
  // People often paste the whole "Share" message: keep just the link.
  const found = value.match(/https?:\/\/\S+/i);
  if (found) value = found[0].replace(/[).,]+$/, "");
  if (!value) return { error: "Paste your Google review link" };
  if (/^ChIJ[\w-]{10,}$/.test(value)) {
    return { url: `https://search.google.com/local/writereview?placeid=${value}` };
  }
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let u: URL;
  try {
    u = new URL(value);
  }
  catch {
    return { error: "That doesn't look like a link. Copy it again from Google." };
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (!GOOGLE_HOSTS.some(h => host === h || host.endsWith(`.${h}`))) {
    return { error: "Use the link from Google (it starts with g.page, maps.app.goo.gl or google.com)" };
  }
  u.protocol = "https:";
  if (u.toString().length > 1000) return { error: "That link is too long" };
  return { url: u.toString() };
}

function newToken() {
  // 8 random bytes = 11 url-safe characters: short enough to read off a poster.
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function getReviewSettings(orgId: number) {
  const [org] = await db.select({
    name: schema.organizations.name,
    type: schema.organizations.type,
    googleReviewUrl: schema.organizations.googleReviewUrl,
    reviewToken: schema.organizations.reviewToken,
  }).from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
  return org ?? null;
}

/** Save the owner's Google link; makes the short link token the first time. */
export async function saveGoogleReviewUrl(orgId: number, url: string | null) {
  const current = await getReviewSettings(orgId);
  const set: Partial<typeof schema.organizations.$inferInsert> = { googleReviewUrl: url };
  if (url && !current?.reviewToken) set.reviewToken = newToken();
  await db.update(schema.organizations).set(set).where(eq(schema.organizations.id, orgId));
}

/**
 * The business behind a short review link. The link keeps working after the
 * add-on is switched off, so a poster still on the wall never sends members to
 * an error page.
 */
export async function getOrgByReviewToken(token: string) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(token)) return null;
  const [org] = await db.select({
    id: schema.organizations.id,
    name: schema.organizations.name,
    type: schema.organizations.type,
    googleReviewUrl: schema.organizations.googleReviewUrl,
  }).from(schema.organizations).where(eq(schema.organizations.reviewToken, token)).limit(1);
  if (!org?.googleReviewUrl) return null;
  return org;
}

export async function logReviewScan(orgId: number, source: "qr" | "wa") {
  await db.insert(schema.reviewLinkScans).values({ orgId, source, createdAt: new Date().toISOString() });
}

/** Scans in the last 30 days and all time, split by poster and WhatsApp. */
export async function getReviewScanStats(orgId: number) {
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [row] = await db.select({
    total: sql<number>`count(*)`,
    last30: sql<number>`sum(case when ${schema.reviewLinkScans.createdAt} >= ${since} then 1 else 0 end)`,
    qr30: sql<number>`sum(case when ${schema.reviewLinkScans.createdAt} >= ${since} and ${schema.reviewLinkScans.source} = 'qr' then 1 else 0 end)`,
    wa30: sql<number>`sum(case when ${schema.reviewLinkScans.createdAt} >= ${since} and ${schema.reviewLinkScans.source} = 'wa' then 1 else 0 end)`,
  }).from(schema.reviewLinkScans).where(and(eq(schema.reviewLinkScans.orgId, orgId)));
  return {
    total: Number(row?.total ?? 0),
    last30: Number(row?.last30 ?? 0),
    poster30: Number(row?.qr30 ?? 0),
    whatsapp30: Number(row?.wa30 ?? 0),
  };
}

export function reviewShortUrl(appUrl: string, token: string, source?: "wa") {
  return `${appUrl.replace(/\/$/, "")}/r/${token}${source ? `?s=${source}` : ""}`;
}
