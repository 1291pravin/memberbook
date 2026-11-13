import type { H3Event } from "h3";
import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export interface AddOnState {
  key: AddOnKey;
  status: "off" | "active" | "notify";
  /** The owner can switch it on: open to all, or switched on for this business by the admin. */
  available: boolean;
  adminEnabled: boolean;
  price: number;
  trialEndsOn: string | null;
  startedAt: string | null;
  /** Prepaid add-ons: paid through this IST date (null = not paid yet). */
  paidUntil: string | null;
}

export async function getOrgAddOnStates(orgId: number): Promise<AddOnState[]> {
  const rows = await db.select().from(schema.orgAddOns).where(eq(schema.orgAddOns.orgId, orgId));
  const byKey = new Map(rows.map(r => [r.addOn, r]));
  return ADD_ONS.map((def) => {
    const row = byKey.get(def.key);
    return {
      key: def.key,
      status: (row?.status as AddOnState["status"]) || "off",
      available: def.ready || Boolean(row?.adminEnabled),
      adminEnabled: Boolean(row?.adminEnabled),
      price: row?.status === "active" ? row.price : def.price,
      trialEndsOn: row?.status === "active" ? row.trialEndsOn : null,
      startedAt: row?.status === "active" ? row.startedAt : null,
      paidUntil: row?.paidUntil ?? null,
    };
  });
}

export async function isAddOnActive(orgId: number, key: AddOnKey) {
  const [row] = await db.select({ status: schema.orgAddOns.status }).from(schema.orgAddOns)
    .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key))).limit(1);
  return row?.status === "active";
}

export async function requireAddOn(orgId: number, key: AddOnKey) {
  if (!(await isAddOnActive(orgId, key))) {
    throw createError({ statusCode: 403, statusMessage: `Switch on "${getAddOn(key)?.name ?? key}" first` });
  }
}

async function upsertAddOn(orgId: number, key: AddOnKey, set: Partial<typeof schema.orgAddOns.$inferInsert>) {
  const now = new Date().toISOString();
  await db.insert(schema.orgAddOns)
    .values({ orgId, addOn: key, ...set, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [schema.orgAddOns.orgId, schema.orgAddOns.addOn],
      set: { ...set, updatedAt: now },
    });
}

/** Owner switches an add-on on. Paid add-ons get a free month, once per add-on. */
export async function startAddOn(orgId: number, key: AddOnKey) {
  const def = getAddOn(key);
  if (!def) throw createError({ statusCode: 404, statusMessage: "Unknown add-on" });

  const [row] = await db.select().from(schema.orgAddOns)
    .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key))).limit(1);
  if (!def.ready && !row?.adminEnabled) {
    throw createError({ statusCode: 409, statusMessage: "This one isn't ready yet. Tap \"Tell me when it's ready\"." });
  }
  if (row?.status === "active") return;

  // Prepaid: no free month. Bill now unless it's still paid up; it works once
  // the admin verifies the payment.
  if (def.prepaid && def.price > 0) {
    await upsertAddOn(orgId, key, {
      status: "active",
      price: def.price,
      trialEndsOn: null,
      startedAt: new Date().toISOString(),
      cancelledAt: null,
    });
    if (!isPrepaidActive(row?.paidUntil ?? null)) await createPrepaidBill(orgId, key, def.price, todayIST());
    return;
  }

  // A free month the first time; switching off and on again doesn't restart it.
  const hadTrial = Boolean(row?.trialEndsOn);
  const trialEndsOn = def.price > 0
    ? (hadTrial ? row!.trialEndsOn! : addDaysToDate(todayIST(), FREE_TRIAL_DAYS))
    : null;

  await upsertAddOn(orgId, key, {
    status: "active",
    price: def.price,
    trialEndsOn,
    startedAt: new Date().toISOString(),
    cancelledAt: null,
  });
}

/** A prepaid add-on is usable through its paid_until date (IST). */
export function isPrepaidActive(paidUntil: string | null | undefined) {
  return Boolean(paidUntil && paidUntil >= todayIST());
}

/** Is this prepaid add-on switched on and paid up? */
export async function isPrepaidAddOnPaid(orgId: number, key: AddOnKey) {
  const [row] = await db.select({ status: schema.orgAddOns.status, paidUntil: schema.orgAddOns.paidUntil }).from(schema.orgAddOns)
    .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key))).limit(1);
  return { active: row?.status === "active", paid: isPrepaidActive(row?.paidUntil), paidUntil: row?.paidUntil ?? null };
}

/**
 * A bill for one prepaid period. `period` is the IST date the paid period
 * starts (YYYY-MM-DD), so it never clashes with a monthly bill (YYYY-MM).
 */
async function createPrepaidBill(orgId: number, key: AddOnKey, amount: number, startsOn: string) {
  const def = getAddOn(key)!;
  // One open prepaid bill per add-on at a time.
  const open = await db.select({ items: schema.addOnBills.items }).from(schema.addOnBills)
    .where(and(eq(schema.addOnBills.orgId, orgId), inArray(schema.addOnBills.status, ["due", "claimed"])));
  if (open.some((b: { items: string }) => parseJson<BillItem[]>(b.items, []).some(i => i.addOn === key && i.prepaid))) return false;
  const now = new Date().toISOString();
  const inserted = await db.insert(schema.addOnBills).values({
    orgId,
    period: startsOn,
    amount,
    items: JSON.stringify([{ addOn: key, name: def.name, amount, prepaid: true, startsOn }] satisfies BillItem[]),
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing().returning({ id: schema.addOnBills.id });
  return inserted.length > 0;
}

/**
 * Admin verified (or waived) a bill: extend every prepaid add-on on it by
 * PREPAID_DAYS, from its current paid-until date or from today if it lapsed.
 */
export async function applyPrepaidBill(billId: number) {
  const [bill] = await db.select().from(schema.addOnBills).where(eq(schema.addOnBills.id, billId)).limit(1);
  if (!bill) return;
  for (const item of parseJson<BillItem[]>(bill.items, [])) {
    if (!item.prepaid) continue;
    const [row] = await db.select({ paidUntil: schema.orgAddOns.paidUntil }).from(schema.orgAddOns)
      .where(and(eq(schema.orgAddOns.orgId, bill.orgId), eq(schema.orgAddOns.addOn, item.addOn))).limit(1);
    const today = todayIST();
    const from = row?.paidUntil && row.paidUntil >= today ? addDaysToDate(row.paidUntil, 1) : today;
    await upsertAddOn(bill.orgId, item.addOn, { paidUntil: addDaysToDate(from, PREPAID_DAYS - 1) });
  }
}

/** Daily: renewal bills for prepaid add-ons that run out within PREPAID_RENEW_DAYS_BEFORE days. */
export async function generatePrepaidRenewals() {
  const soon = addDaysToDate(todayIST(), PREPAID_RENEW_DAYS_BEFORE);
  const rows = await db.select().from(schema.orgAddOns)
    .where(and(eq(schema.orgAddOns.status, "active"), isNotNull(schema.orgAddOns.paidUntil), lte(schema.orgAddOns.paidUntil, soon)));
  let created = 0;
  for (const r of rows) {
    const def = getAddOn(r.addOn);
    if (!def?.prepaid || r.price <= 0) continue;
    const startsOn = r.paidUntil! >= todayIST() ? addDaysToDate(r.paidUntil!, 1) : todayIST();
    if (await createPrepaidBill(r.orgId, def.key, r.price, startsOn)) created++;
  }
  return created;
}

export async function stopAddOn(orgId: number, key: AddOnKey) {
  await upsertAddOn(orgId, key, { status: "off", cancelledAt: new Date().toISOString() });
  // Switching the website off takes it offline; switching on again and
  // tapping Publish brings it back without a rebuild.
  if (key === "website") {
    await db.update(schema.orgWebsites).set({ status: "off", updatedAt: new Date().toISOString() })
      .where(and(eq(schema.orgWebsites.orgId, orgId), eq(schema.orgWebsites.status, "live")));
  }
}

export async function notifyAddOn(orgId: number, key: AddOnKey) {
  const [row] = await db.select({ status: schema.orgAddOns.status }).from(schema.orgAddOns)
    .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key))).limit(1);
  if (row?.status === "active") return;
  await upsertAddOn(orgId, key, { status: "notify", notifyRequestedAt: new Date().toISOString() });
}

/** Admin feature flag: let one business use an add-on before it opens to everyone. */
export async function setAddOnAdminEnabled(orgId: number, key: AddOnKey, enabled: boolean) {
  await upsertAddOn(orgId, key, { adminEnabled: enabled });
  if (!enabled && !getAddOn(key)?.ready) {
    await db.update(schema.orgAddOns).set({ status: "off", updatedAt: new Date().toISOString() })
      .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key), eq(schema.orgAddOns.status, "active")));
  }
}

// ---------------------------------------------------------------- websites

export interface WebsiteFile {
  key: string;
  name: string;
  type: string;
  size: number;
  kind: "logo" | "photo";
}

export const MAX_WEBSITE_PHOTOS = 12;
export const MAX_WEBSITE_FILE_BYTES = 8 * 1024 * 1024;
export const WEBSITE_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export function parseJson<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  }
  catch {
    return fallback;
  }
}

export function cleanWebsiteDetails(input: unknown): WebsiteDetails {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: WebsiteDetails = {};
  for (const key of WEBSITE_DETAIL_KEYS) {
    const value = src[key];
    if (typeof value === "string" && value.trim()) {
      out[key] = value.trim().slice(0, key === "about" || key === "notes" ? 3000 : 500);
    }
  }
  return out;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "site";
}

/** The business's website row, created (with a free slug) on first use. */
export async function ensureWebsite(orgId: number) {
  const [existing] = await db.select().from(schema.orgWebsites).where(eq(schema.orgWebsites.orgId, orgId)).limit(1);
  if (existing) return existing;

  const [org] = await db.select({ name: schema.organizations.name, slug: schema.organizations.slug })
    .from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
  if (!org) throw createError({ statusCode: 404, statusMessage: "Business not found" });

  const base = slugify(org.name || org.slug);
  for (let i = 0; i < 50; i += 1) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [taken] = await db.select({ orgId: schema.orgWebsites.orgId }).from(schema.orgWebsites)
      .where(eq(schema.orgWebsites.slug, slug)).limit(1);
    if (taken) continue;
    const now = new Date().toISOString();
    const [row] = await db.insert(schema.orgWebsites)
      .values({ orgId, slug, details: JSON.stringify({ businessName: org.name }), createdAt: now, updatedAt: now })
      .onConflictDoNothing()
      .returning();
    if (row) return row;
  }
  throw createError({ statusCode: 500, statusMessage: "Could not pick a web address" });
}

export async function getWebsiteBySlug(slug: string) {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const [row] = await db.select().from(schema.orgWebsites).where(eq(schema.orgWebsites.slug, slug)).limit(1);
  return row ?? null;
}

export function websiteUrl(event: H3Event, slug: string) {
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in").replace(/\/$/, "");
  return `${appUrl}/s/${slug}`;
}

/**
 * Websites are written by the delivery routine, so they are served as plain
 * HTML and CSS with no scripts at all. This stops a mistake in generated HTML
 * from running code on memberbook.in, where owners are signed in.
 */
export function setWebsiteSecurityHeaders(event: H3Event) {
  setHeader(event, "Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "frame-src https://www.google.com https://maps.google.com",
    "form-action 'self' https://wa.me https://api.whatsapp.com",
    "frame-ancestors 'self'",
  ].join("; "));
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
}

// --------------------------------------------------------- service requests

export async function getServiceRequestOr404(event: H3Event) {
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid request id" });
  const [row] = await db.select().from(schema.serviceRequests).where(eq(schema.serviceRequests.id, id)).limit(1);
  if (!row) throw createError({ statusCode: 404, statusMessage: "Request not found" });
  return row;
}

export function serializeRequest(r: typeof schema.serviceRequests.$inferSelect) {
  return {
    id: r.id,
    orgId: r.orgId,
    type: r.type,
    status: r.status,
    input: parseJson<Record<string, unknown>>(r.input, {}),
    result: parseJson<Record<string, unknown> | null>(r.result, null),
    adminNote: r.adminNote,
    message: r.message,
    createdAt: r.createdAt,
    claimedAt: r.claimedAt,
    deliveredAt: r.deliveredAt,
    reviewedAt: r.reviewedAt,
  };
}

export async function queueServiceRequest(opts: {
  orgId: number;
  type: ServiceRequestType;
  input: Record<string, unknown>;
  requestedBy: number | null;
}) {
  // Keep a runaway form or script from filling the queue.
  const since = new Date(Date.now() - 86400000).toISOString();
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.serviceRequests)
    .where(and(eq(schema.serviceRequests.orgId, opts.orgId), sql`${schema.serviceRequests.createdAt} > ${since}`)) as [{ count: number }];
  if (Number(count) >= 30) {
    throw createError({ statusCode: 429, statusMessage: "That's a lot of requests for one day. Message us if something is urgent." });
  }

  const now = new Date().toISOString();
  const [row] = await db.insert(schema.serviceRequests).values({
    orgId: opts.orgId,
    type: opts.type,
    input: JSON.stringify(opts.input),
    requestedBy: opts.requestedBy,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return row!;
}

export async function alertServiceRequest(event: H3Event, req: { id: number; orgId: number; type: string }) {
  const [org] = await db.select({ name: schema.organizations.name }).from(schema.organizations)
    .where(eq(schema.organizations.id, req.orgId)).limit(1);
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in");
  await sendAdminEmail(
    event,
    `New add-on request: ${org?.name ?? `business ${req.orgId}`} (${req.type.replace("_", " ")})`,
    `${org?.name ?? "A business"} asked for ${req.type.replace("_", " ")} (request #${req.id}).\n\n`
    + `The AI task starts on its own now (or within a few hours if that fails). Queue: ${appUrl}/admin/services\n`,
  );
}

// ----------------------------------------------------------------- billing

export interface BillItem {
  addOn: AddOnKey;
  name: string;
  amount: number;
  /** Prepaid add-on period starting on `startsOn`; paying it switches the add-on on. */
  prepaid?: boolean;
  startsOn?: string;
}

/** MemberBook's own UPI ID for add-on bills. Empty = show "we'll message you". */
export function billingUpi(event?: H3Event) {
  const config = useRuntimeConfig(event);
  const upiId = String(config.billingUpiId || "").trim();
  return {
    upiId: UPI_ID_PATTERN.test(upiId) ? upiId : "",
    payeeName: String(config.billingPayeeName || "MemberBook").trim(),
  };
}

/**
 * Create this month's bill for every business with a paid add-on whose free
 * month is over. Runs daily; a bill is created once per business per month
 * and never changed afterwards (the admin can waive it).
 */
export async function generateAddOnBills() {
  const today = todayIST();
  const period = today.slice(0, 7);
  const rows = await db.select().from(schema.orgAddOns)
    .where(and(eq(schema.orgAddOns.status, "active"), sql`${schema.orgAddOns.price} > 0`, sql`${schema.orgAddOns.trialEndsOn} < ${today}`));

  const byOrg = new Map<number, BillItem[]>();
  for (const r of rows) {
    const def = getAddOn(r.addOn);
    if (!def || def.prepaid) continue; // prepaid add-ons bill themselves (generatePrepaidRenewals)
    const items = byOrg.get(r.orgId) ?? [];
    items.push({ addOn: def.key, name: def.name, amount: r.price });
    byOrg.set(r.orgId, items);
  }

  let created = 0;
  for (const [orgId, items] of byOrg) {
    const now = new Date().toISOString();
    const inserted = await db.insert(schema.addOnBills).values({
      orgId,
      period,
      amount: items.reduce((sum, i) => sum + i.amount, 0),
      items: JSON.stringify(items),
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing().returning({ id: schema.addOnBills.id });
    created += inserted.length;
  }
  return { created, businesses: byOrg.size };
}

export function serializeBill(b: typeof schema.addOnBills.$inferSelect) {
  return {
    id: b.id,
    orgId: b.orgId,
    period: b.period,
    amount: b.amount,
    items: parseJson<BillItem[]>(b.items, []),
    status: b.status,
    upiRef: b.upiRef,
    claimedAt: b.claimedAt,
    paidAt: b.paidAt,
    createdAt: b.createdAt,
  };
}
