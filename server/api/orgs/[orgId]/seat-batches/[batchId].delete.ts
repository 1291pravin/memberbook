import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const batchId = parseInt(getRouterParam(event, "batchId")!);

  // Fetch the batch
  const [batch] = await db
    .select()
    .from(schema.seatBatches)
    .where(
      and(
        eq(schema.seatBatches.id, batchId),
        eq(schema.seatBatches.orgId, access.orgId),
      ),
    )
    .limit(1);

  if (!batch) {
    throw createError({ statusCode: 404, statusMessage: "Batch not found" });
  }

  // Soft delete by setting isActive to false, and drop seat assignments for
  // this batch so they don't linger against a batch nobody can see.
  await db.batch([
    db
      .delete(schema.memberSeatAssignments)
      .where(and(
        eq(schema.memberSeatAssignments.batchId, batchId),
        eq(schema.memberSeatAssignments.orgId, access.orgId),
      )),
    db
      .update(schema.seatBatches)
      .set({ isActive: false })
      .where(and(eq(schema.seatBatches.id, batchId), eq(schema.seatBatches.orgId, access.orgId))),
  ]);


  return { success: true };
});
