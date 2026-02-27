import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = getRouterParam(event, "memberId");
  const body = await readBody(event);

  if (!memberId || !Number.isInteger(Number(memberId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid member ID",
    });
  }

  if (!body.seatId || !Number.isInteger(body.seatId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid seat ID",
    });
  }

  const batchId = body.batchId ? Number(body.batchId) : null;

  // Verify member exists and belongs to org
  const [member] = await db
    .select()
    .from(schema.members)
    .where(
      and(
        eq(schema.members.id, Number(memberId)),
        eq(schema.members.orgId, access.orgId),
      ),
    )
    .limit(1);

  if (!member) {
    throw createError({
      statusCode: 404,
      statusMessage: "Member not found",
    });
  }

  // Verify seat exists, is active, and belongs to org
  const [seat] = await db
    .select()
    .from(schema.librarySeats)
    .where(
      and(
        eq(schema.librarySeats.id, body.seatId),
        eq(schema.librarySeats.orgId, access.orgId),
        eq(schema.librarySeats.isActive, true),
      ),
    )
    .limit(1);

  if (!seat) {
    throw createError({
      statusCode: 404,
      statusMessage: "Seat not found or inactive",
    });
  }

  // If batchId provided, validate batch exists and belongs to org
  if (batchId) {
    const [batch] = await db
      .select()
      .from(schema.seatBatches)
      .where(
        and(
          eq(schema.seatBatches.id, batchId),
          eq(schema.seatBatches.orgId, access.orgId),
          eq(schema.seatBatches.isActive, true),
        ),
      )
      .limit(1);

    if (!batch) {
      throw createError({
        statusCode: 404,
        statusMessage: "Batch not found or inactive",
      });
    }
  }

  // Check if same seat is already assigned to a different member in same batch
  const batchCondition = batchId
    ? eq(schema.memberSeatAssignments.batchId, batchId)
    : isNull(schema.memberSeatAssignments.batchId);

  const [conflicting] = await db
    .select()
    .from(schema.memberSeatAssignments)
    .where(
      and(
        eq(schema.memberSeatAssignments.seatId, body.seatId),
        eq(schema.memberSeatAssignments.orgId, access.orgId),
        batchCondition,
      ),
    )
    .limit(1);

  if (conflicting && conflicting.memberId !== Number(memberId)) {
    throw createError({
      statusCode: 409,
      statusMessage: `Seat ${seat.seatNumber} is already assigned to another member in this batch`,
    });
  }

  // Check if member already has an assignment for this batch
  const memberBatchCondition = batchId
    ? eq(schema.memberSeatAssignments.batchId, batchId)
    : isNull(schema.memberSeatAssignments.batchId);

  const [existingAssignment] = await db
    .select()
    .from(schema.memberSeatAssignments)
    .where(
      and(
        eq(schema.memberSeatAssignments.memberId, Number(memberId)),
        eq(schema.memberSeatAssignments.orgId, access.orgId),
        memberBatchCondition,
      ),
    )
    .limit(1);

  let assignment;

  if (existingAssignment) {
    // Update existing assignment
    [assignment] = await db
      .update(schema.memberSeatAssignments)
      .set({
        seatId: body.seatId,
        assignedAt: new Date().toISOString(),
        assignedBy: access.userId,
        notes: body.notes?.trim() || null,
      })
      .where(eq(schema.memberSeatAssignments.id, existingAssignment.id))
      .returning();
  } else {
    // Create new assignment
    [assignment] = await db
      .insert(schema.memberSeatAssignments)
      .values({
        orgId: access.orgId,
        memberId: Number(memberId),
        seatId: body.seatId,
        batchId,
        assignedAt: new Date().toISOString(),
        assignedBy: access.userId,
        notes: body.notes?.trim() || null,
        createdAt: new Date().toISOString(),
      })
      .returning();
  }

  // Invalidate cache
  await invalidateCache(access.orgId);

  return assignment;
});
