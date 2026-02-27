import { eq } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;

  const batches = await db
    .select({
      id: schema.seatBatches.id,
      name: schema.seatBatches.name,
      startTime: schema.seatBatches.startTime,
      endTime: schema.seatBatches.endTime,
      isActive: schema.seatBatches.isActive,
      displayOrder: schema.seatBatches.displayOrder,
    })
    .from(schema.seatBatches)
    .where(eq(schema.seatBatches.orgId, access.orgId))
    .orderBy(schema.seatBatches.displayOrder, schema.seatBatches.name);

  return { batches };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "seat-batches"),
});
