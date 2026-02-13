import { eq, max } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);

  // Validation
  if (!body.prefix?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Prefix is required",
    });
  }

  const startNumber = parseInt(body.startNumber);
  const endNumber = parseInt(body.endNumber);

  if (!Number.isInteger(startNumber) || !Number.isInteger(endNumber)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start and end numbers must be integers",
    });
  }

  if (startNumber > endNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: "Start number must be less than or equal to end number",
    });
  }

  if (endNumber - startNumber > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot create more than 100 seats at once",
    });
  }

  // Get next display order
  const [result] = await db
    .select({ maxOrder: max(schema.librarySeats.displayOrder) })
    .from(schema.librarySeats)
    .where(eq(schema.librarySeats.orgId, access.orgId));
  let displayOrder = (result.maxOrder || 0) + 1;

  // Generate seats
  const seatsToCreate = [];
  for (let i = startNumber; i <= endNumber; i++) {
    seatsToCreate.push({
      orgId: access.orgId,
      seatNumber: `${body.prefix.trim()}${i}`,
      seatLabel: null,
      timePreference: body.timePreference || null,
      genderPreference: body.genderPreference || null,
      displayOrder: displayOrder++,
      notes: null,
      createdAt: new Date().toISOString(),
    });
  }

  // Bulk insert
  const seats = await db
    .insert(schema.librarySeats)
    .values(seatsToCreate)
    .returning();

  // Invalidate cache
  await invalidateCache(access.orgId);

  return { seats, count: seats.length };
});
