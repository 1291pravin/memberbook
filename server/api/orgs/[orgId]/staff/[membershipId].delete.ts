import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const membershipId = Number(getRouterParam(event, "membershipId"));

  // Prevent deleting the owner
  const rows = await db
    .select()
    .from(schema.orgMemberships)
    .where(and(eq(schema.orgMemberships.id, membershipId), eq(schema.orgMemberships.orgId, access.orgId)))
    .limit(1);

  if (!rows[0]) {
    throw createError({ statusCode: 404, statusMessage: "Membership not found" });
  }
  if (rows[0].role === "owner") {
    throw createError({ statusCode: 400, statusMessage: "Cannot remove the owner" });
  }

  await db
    .delete(schema.orgMemberships)
    .where(and(eq(schema.orgMemberships.id, membershipId), eq(schema.orgMemberships.orgId, access.orgId)));

  await invalidateCache(access.orgId);
  return { success: true };
});
