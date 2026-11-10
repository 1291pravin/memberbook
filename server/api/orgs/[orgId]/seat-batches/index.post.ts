import { eq, and, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const body = await readBody(event);
  const { name, startTime, endTime } = body;

  if (!name || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Batch name is required" });
  }

  // Check for duplicate batch name
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

  // A deleted (inactive) batch with this name still holds the unique name,
  // so bring it back instead of failing.
  if (existing[0] && !existing[0].isActive) {
    const [restored] = await db
      .update(schema.seatBatches)
      .set({
        isActive: true,
        startTime: startTime?.trim() || null,
        endTime: endTime?.trim() || null,
      })
      .where(and(eq(schema.seatBatches.id, existing[0].id), eq(schema.seatBatches.orgId, access.orgId)))
      .returning();
    return { batch: restored };
  }

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "A batch with this name already exists",
    });
  }

  // Get max display order
  const maxOrderResult = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${schema.seatBatches.displayOrder}), 0)` })
    .from(schema.seatBatches)
    .where(eq(schema.seatBatches.orgId, access.orgId));

  const displayOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

  const result = await db
    .insert(schema.seatBatches)
    .values({
      orgId: access.orgId,
      name: name.trim(),
      startTime: startTime?.trim() || null,
      endTime: endTime?.trim() || null,
      isActive: true,
      displayOrder,
    })
    .returning();


  return { batch: result[0] };
});
