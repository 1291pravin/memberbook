import { eq } from "drizzle-orm";

// Mark an owner's WhatsApp setup-help request as handled (or back to new).
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);

  const orgId = Number(getRouterParam(event, "orgId"));
  if (!Number.isInteger(orgId) || orgId < 1) {
    throw createError({ statusCode: 400, statusMessage: "Invalid organization" });
  }

  const body = await readBody(event).catch(() => ({}));
  const handled = body?.handled !== false;

  const [updated] = await db
    .update(schema.organizations)
    .set({ setupHelpHandledAt: handled ? new Date().toISOString() : null })
    .where(eq(schema.organizations.id, orgId))
    .returning({ id: schema.organizations.id, setupHelpHandledAt: schema.organizations.setupHelpHandledAt });

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" });
  }

  await recordAdminAuditLog(event, handled ? "setup_help_handled" : "setup_help_reopened", { targetOrgId: orgId });

  return { ok: true, setupHelpHandledAt: updated.setupHelpHandledAt };
});
