import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const inviteId = Number(getRouterParam(event, "inviteId"));

  // Validate inviteId
  if (!Number.isInteger(inviteId) || inviteId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid invitation ID",
    });
  }

  const now = new Date().toISOString();

  // Atomically revoke the invite - only succeeds if still pending
  const updated = await db
    .update(schema.orgInvites)
    .set({
      status: "revoked",
      revokedByUserId: access.userId,
      revokedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.orgInvites.id, inviteId),
        eq(schema.orgInvites.orgId, access.orgId),
        eq(schema.orgInvites.status, "pending")
      )
    )
    .returning();

  if (!updated.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invitation not found or is no longer pending",
    });
  }

  await invalidateCache(access.orgId);

  return { success: true };
});
