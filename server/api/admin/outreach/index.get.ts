import { desc, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/** Outreach state: switches, counts by status, sent today, and the latest leads. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const cfg = outreachConfig();
  const counts = await db.select({ status: schema.outreachLeads.status, n: sql<number>`count(*)` })
    .from(schema.outreachLeads).groupBy(schema.outreachLeads.status);
  const leads = await db.select({
    id: schema.outreachLeads.id,
    email: schema.outreachLeads.email,
    businessName: schema.outreachLeads.businessName,
    businessType: schema.outreachLeads.businessType,
    city: schema.outreachLeads.city,
    sourceUrl: schema.outreachLeads.sourceUrl,
    notes: schema.outreachLeads.notes,
    createdAt: schema.outreachLeads.createdAt,
    status: schema.outreachLeads.status,
    sentAt: schema.outreachLeads.sentAt,
    followedUpAt: schema.outreachLeads.followedUpAt,
    lastError: schema.outreachLeads.lastError,
  }).from(schema.outreachLeads).orderBy(desc(schema.outreachLeads.id)).limit(200);
  return {
    enabled: cfg.enabled,
    hasKey: Boolean(cfg.apiKey),
    dailyCap: cfg.dailyCap,
    followUpDays: OUTREACH_FOLLOW_UP_DAYS,
    sentToday: await outreachSentToday(),
    counts: Object.fromEntries(counts.map(c => [c.status, Number(c.n)])),
    leads,
  };
});
