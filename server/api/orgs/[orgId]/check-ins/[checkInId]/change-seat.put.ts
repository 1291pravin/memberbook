import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const checkInId = getRouterParam(event, "checkInId");
  const body = await readBody(event);

  if (!checkInId || !Number.isInteger(Number(checkInId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid check-in ID",
    });
  }

  if (!body.newSeatId || !Number.isInteger(body.newSeatId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid seat ID",
    });
  }

  // Verify check-in exists, belongs to org, and is active
  const [checkIn] = await db
    .select()
    .from(schema.checkIns)
    .where(
      and(
        eq(schema.checkIns.id, Number(checkInId)),
        eq(schema.checkIns.orgId, access.orgId),
        isNull(schema.checkIns.checkedOutAt),
      ),
    )
    .limit(1);

  if (!checkIn) {
    throw createError({
      statusCode: 404,
      statusMessage: "Active check-in not found",
    });
  }

  // Validate new seat exists, is active, and belongs to org
  const [newSeat] = await db
    .select()
    .from(schema.librarySeats)
    .where(
      and(
        eq(schema.librarySeats.id, body.newSeatId),
        eq(schema.librarySeats.orgId, access.orgId),
        eq(schema.librarySeats.isActive, true),
      ),
    )
    .limit(1);

  if (!newSeat) {
    throw createError({
      statusCode: 404,
      statusMessage: "Seat not found or inactive",
    });
  }

  // Check if new seat is already occupied (excluding current check-in)
  const [occupiedCheckIn] = await db
    .select({
      id: schema.checkIns.id,
      memberName: schema.members.name,
    })
    .from(schema.checkIns)
    .leftJoin(schema.members, eq(schema.members.id, schema.checkIns.memberId))
    .where(
      and(
        eq(schema.checkIns.seatId, body.newSeatId),
        isNull(schema.checkIns.checkedOutAt),
      ),
    )
    .limit(1);

  if (occupiedCheckIn && occupiedCheckIn.id !== Number(checkInId)) {
    throw createError({
      statusCode: 409,
      statusMessage: `Seat ${newSeat.seatNumber} is already occupied by ${occupiedCheckIn.memberName}`,
    });
  }

  // Update check-in with new seat
  const [updatedCheckIn] = await db
    .update(schema.checkIns)
    .set({
      seatId: body.newSeatId,
      seatNumber: newSeat.seatNumber,
    })
    .where(eq(schema.checkIns.id, Number(checkInId)))
    .returning();

  // Invalidate cache
  await invalidateCache(access.orgId);

  return updatedCheckIn;
});
