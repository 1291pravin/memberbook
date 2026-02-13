import { eq, and, max } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);

  // Validation
  if (!body.seatNumber?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Seat number is required",
    });
  }

  // Check if seat number already exists for this org
  const existing = await db
    .select()
    .from(schema.librarySeats)
    .where(
      and(
        eq(schema.librarySeats.orgId, access.orgId),
        eq(schema.librarySeats.seatNumber, body.seatNumber.trim()),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Seat number already exists",
    });
  }

  // Get next display order if not provided
  let displayOrder = body.displayOrder;
  if (!displayOrder) {
    const [result] = await db
      .select({ maxOrder: max(schema.librarySeats.displayOrder) })
      .from(schema.librarySeats)
      .where(eq(schema.librarySeats.orgId, access.orgId));
    displayOrder = (result.maxOrder || 0) + 1;
  }

  // Create seat
  const [seat] = await db
    .insert(schema.librarySeats)
    .values({
      orgId: access.orgId,
      seatNumber: body.seatNumber.trim(),
      seatLabel: body.seatLabel?.trim() || null,
      timePreference: body.timePreference || null,
      genderPreference: body.genderPreference || null,
      displayOrder,
      notes: body.notes?.trim() || null,
      createdAt: new Date().toISOString(),
    })
    .returning();

  // Invalidate cache
  await invalidateCache(access.orgId);

  return seat;
});
