import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = getRouterParam(event, "memberId");
  const query = getQuery(event);
  const batchId = query.batchId ? Number(query.batchId) : undefined;

  if (!memberId || !Number.isInteger(Number(memberId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid member ID",
    });
  }

  const conditions = [
    eq(schema.memberSeatAssignments.memberId, Number(memberId)),
    eq(schema.memberSeatAssignments.orgId, access.orgId),
  ];

  // If batchId specified, delete only that batch's assignment
  if (batchId !== undefined) {
    conditions.push(eq(schema.memberSeatAssignments.batchId, batchId));
  } else {
    // Delete assignment with no batch (legacy/default)
    conditions.push(isNull(schema.memberSeatAssignments.batchId));
  }

  const result = await db
    .delete(schema.memberSeatAssignments)
    .where(and(...conditions))
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
