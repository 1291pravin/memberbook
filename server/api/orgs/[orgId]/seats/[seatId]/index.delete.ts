import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const seatId = getRouterParam(event, "seatId");

  if (!seatId || !Number.isInteger(Number(seatId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid seat ID",
    });
  }

  // Verify seat exists and belongs to org
  const [existingSeat] = await db
    .select()
    .from(schema.librarySeats)
    .where(
      and(
        eq(schema.librarySeats.id, Number(seatId)),
        eq(schema.librarySeats.orgId, access.orgId),
      ),
    )
    .limit(1);

  if (!existingSeat) {
    throw createError({
      statusCode: 404,
      statusMessage: "Seat not found",
    });
  }

  // Check if seat is currently occupied
  const [activeCheckIn] = await db
    .select()
    .from(schema.checkIns)
    .where(
      and(
        eq(schema.checkIns.seatId, Number(seatId)),
        isNull(schema.checkIns.checkedOutAt),
      ),
    )
    .limit(1);

  if (activeCheckIn) {
    throw createError({
      statusCode: 409,
      statusMessage: "Cannot delete seat that is currently occupied",
    });
  }

  // Soft delete - set isActive to false
  await db
    .update(schema.librarySeats)
    .set({ isActive: false })
    .where(eq(schema.librarySeats.id, Number(seatId)));

  // Invalidate cache
  await invalidateCache(access.orgId);

  return { success: true, message: "Seat deleted successfully" };
});
