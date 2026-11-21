import { db, schema } from "@nuxthub/db";

const TYPES = new Set(["gym", "library", "coaching", "other"]);

/**
 * Add leads: { leads: [{ email, businessName, contactName?, businessType?, city?, sourceUrl? }] }.
 * Only add emails a business lists publicly (website, Google Maps, directory);
 * sourceUrl records where. Existing emails (any status, including unsubscribed)
 * are skipped, so nobody is emailed twice.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ leads?: unknown }>(event).catch(() => ({} as { leads?: unknown }));
  if (!Array.isArray(body?.leads) || body.leads.length === 0) throw createError({ statusCode: 400, statusMessage: "Send leads: [...]" });
  if (body.leads.length > 200) throw createError({ statusCode: 400, statusMessage: "At most 200 leads per call" });

  const str = (v: unknown, max: number) => {
    const s = String(v ?? "").replace(/[\r\n\t]+/g, " ").trim();
    return s ? s.slice(0, max) : null;
  };
  let added = 0;
  const skipped: { email: string; reason: string }[] = [];
  for (const raw of body.leads as Record<string, unknown>[]) {
    const email = normaliseEmail(raw?.email);
    const businessName = str(raw?.businessName, 120);
    if (!email || !businessName) {
      skipped.push({ email: String(raw?.email ?? ""), reason: "needs a valid email and businessName" });
      continue;
    }
    const type = String(raw?.businessType ?? "").toLowerCase();
    const now = new Date().toISOString();
    const res = await db.insert(schema.outreachLeads).values({
      email,
      businessName,
      contactName: str(raw?.contactName, 60),
      businessType: TYPES.has(type) ? type : "other",
      city: str(raw?.city, 60),
      sourceUrl: str(raw?.sourceUrl, 300),
      token: newOutreachToken(),
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing().returning({ id: schema.outreachLeads.id });
    if (res.length) added++;
    else skipped.push({ email, reason: "already in the list" });
  }
  await recordAdminAuditLog(event, "outreach_leads_added", { metadata: { added, skipped: skipped.length } });
  return { added, skipped };
});
