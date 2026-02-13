import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = getRouterParam(event, "memberId");

  if (!memberId || !Number.isInteger(Number(memberId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid member ID",
    });
  }

  // Delete the assignment
  const result = await db
    .delete(schema.memberSeatAssignments)
    .where(
      and(
        eq(schema.memberSeatAssignments.memberId, Number(memberId)),
        eq(schema.memberSeatAssignments.orgId, access.orgId),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "No seat assignment found for this member",
    });
  }

  // Invalidate cache
  await invalidateCache(access.orgId);

  return { success: true, message: "Seat assignment removed successfully" };
});
