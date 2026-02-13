import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const body = await readBody(event);
  const { name, type, gracePeriodDays } = body;

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name.trim();
  if (type) updates.type = type;
  if (gracePeriodDays !== undefined) {
    const days = Number(gracePeriodDays);
    if (!Number.isInteger(days) || days < 0) {
      throw createError({ statusCode: 400, statusMessage: "Grace period must be a non-negative integer" });
    }
    updates.gracePeriodDays = days;
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" });
  }

  await db
    .update(schema.organizations)
    .set(updates)
    .where(eq(schema.organizations.id, access.orgId));

  const rows = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  await invalidateCache(access.orgId);
  return { org: rows[0] };
});
