import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const batchId = parseInt(getRouterParam(event, "batchId")!);
  const body = await readBody(event);
  const { name, startTime, endTime, isActive, displayOrder } = body;

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

  // Check for duplicate name if name is changing
  if (name && name.trim() !== batch.name) {
    const existing = await db
      .select()
      .from(schema.seatBatches)
      .where(
        and(
          eq(schema.seatBatches.orgId, access.orgId),
          eq(schema.seatBatches.name, name.trim()),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: "A batch with this name already exists",
      });
    }
  }

  const result = await db
    .update(schema.seatBatches)
    .set({
      name: name?.trim() || batch.name,
      startTime: startTime !== undefined ? (startTime?.trim() || null) : batch.startTime,
      endTime: endTime !== undefined ? (endTime?.trim() || null) : batch.endTime,
      isActive: isActive !== undefined ? isActive : batch.isActive,
      displayOrder: displayOrder !== undefined ? displayOrder : batch.displayOrder,
    })
    .where(eq(schema.seatBatches.id, batchId))
    .returning();

  await invalidateCache(access.orgId);

  return { batch: result[0] };
});
