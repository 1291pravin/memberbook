import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const seatId = getRouterParam(event, "seatId");
  const body = await readBody(event);

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

  // If changing seat number, check for duplicates
  if (body.seatNumber && body.seatNumber !== existingSeat.seatNumber) {
    const [duplicate] = await db
      .select()
      .from(schema.librarySeats)
      .where(
        and(
          eq(schema.librarySeats.orgId, access.orgId),
          eq(schema.librarySeats.seatNumber, body.seatNumber.trim()),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw createError({
        statusCode: 409,
        statusMessage: "Seat number already exists",
      });
    }
  }

  // Update seat
  const [updatedSeat] = await db
    .update(schema.librarySeats)
    .set({
      seatNumber: body.seatNumber?.trim() || existingSeat.seatNumber,
      seatLabel: body.seatLabel !== undefined ? (body.seatLabel?.trim() || null) : existingSeat.seatLabel,
      timePreference: body.timePreference !== undefined ? body.timePreference : existingSeat.timePreference,
      genderPreference: body.genderPreference !== undefined ? body.genderPreference : existingSeat.genderPreference,
      displayOrder: body.displayOrder !== undefined ? body.displayOrder : existingSeat.displayOrder,
      notes: body.notes !== undefined ? (body.notes?.trim() || null) : existingSeat.notes,
      isActive: body.isActive !== undefined ? body.isActive : existingSeat.isActive,
    })
    .where(eq(schema.librarySeats.id, Number(seatId)))
    .returning();

  // Invalidate cache
  await invalidateCache(access.orgId);

  return updatedSeat;
});
