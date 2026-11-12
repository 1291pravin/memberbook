import { eq } from "drizzle-orm";

/** Set our CRM stage and next follow-up for a business. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const orgId = readOrgIdParam(event);
  const body = await readBody<{ stage?: string | null; followUpOn?: string | null; followUpReason?: string | null }>(event).catch(() => ({}));

  const [org] = await db.select({ id: schema.organizations.id }).from(schema.organizations)
    .where(eq(schema.organizations.id, orgId)).limit(1);
  if (!org) throw createError({ statusCode: 404, statusMessage: "Business not found" });

  const values: Partial<typeof schema.adminOrgCrm.$inferInsert> = { updatedAt: new Date().toISOString() };
  if (body && "stage" in body) {
    if (body.stage && !ADMIN_STAGE_VALUES.includes(body.stage)) {
      throw createError({ statusCode: 400, statusMessage: "Unknown stage" });
    }
    values.stage = body.stage || null;
  }
  if (body && "followUpOn" in body) {
    if (body.followUpOn && !/^\d{4}-\d{2}-\d{2}$/.test(body.followUpOn)) {
      throw createError({ statusCode: 400, statusMessage: "Follow-up date must be YYYY-MM-DD" });
    }
    values.followUpOn = body.followUpOn || null;
    values.followUpReason = body.followUpOn ? (body.followUpReason || "").trim().slice(0, 200) || null : null;
  }

  await db.insert(schema.adminOrgCrm)
    .values({ orgId, ...values })
    .onConflictDoUpdate({ target: schema.adminOrgCrm.orgId, set: values });

  await recordAdminAuditLog(event, "crm_updated", { targetOrgId: orgId, metadata: values });
  return { ok: true };
});
