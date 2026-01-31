import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const body = await readBody(event);
  const { name, type } = body;

  const updates: Record<string, string> = {};
  if (name) updates.name = name.trim();
  if (type) updates.type = type;

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

  await invalidateCache(access.orgId, "org");
  return { org: rows[0] };
});
