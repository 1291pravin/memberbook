import { eq, and, isNull, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const { memberId, notes, seatId } = body;

  if (!memberId) {
    throw createError({ statusCode: 400, statusMessage: "Member ID is required" });
  }

  // Validate member exists in this org
  const memberRows = await db
    .select()
    .from(schema.members)
    .where(and(
      eq(schema.members.id, Number(memberId)),
      eq(schema.members.orgId, access.orgId),
    ))
    .limit(1);

  if (!memberRows[0]) {
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  }

  // Check no active check-in exists
  const activeCheckIn = await db
    .select()
    .from(schema.checkIns)
    .where(and(
      eq(schema.checkIns.memberId, Number(memberId)),
      eq(schema.checkIns.orgId, access.orgId),
      isNull(schema.checkIns.checkedOutAt),
    ))
    .limit(1);

  if (activeCheckIn[0]) {
    throw createError({ statusCode: 409, statusMessage: "Member is already checked in" });
  }

  // Handle seat allocation
  let finalSeatId = seatId;
  let seatNumber = null;

  // If no seat provided, check for default seat assignment
  if (!finalSeatId) {
    const [assignment] = await db
      .select({ seatId: schema.memberSeatAssignments.seatId })
      .from(schema.memberSeatAssignments)
      .where(and(
        eq(schema.memberSeatAssignments.memberId, Number(memberId)),
        eq(schema.memberSeatAssignments.orgId, access.orgId),
      ))
      .limit(1);

    if (assignment) {
      finalSeatId = assignment.seatId;
    }
  }

  // If we have a seat ID, validate and check availability
  if (finalSeatId) {
    // Validate seat exists, is active, and belongs to org
    const [seat] = await db
      .select()
      .from(schema.librarySeats)
      .where(and(
        eq(schema.librarySeats.id, finalSeatId),
        eq(schema.librarySeats.orgId, access.orgId),
        eq(schema.librarySeats.isActive, true),
      ))
      .limit(1);

    if (!seat) {
      throw createError({
        statusCode: 404,
        statusMessage: "Seat not found or inactive"
      });
    }

    seatNumber = seat.seatNumber;

    // Check if seat is already occupied
    const [occupiedCheckIn] = await db
      .select({
        id: schema.checkIns.id,
        memberName: schema.members.name,
      })
      .from(schema.checkIns)
      .leftJoin(schema.members, eq(schema.members.id, schema.checkIns.memberId))
      .where(and(
        eq(schema.checkIns.seatId, finalSeatId),
        isNull(schema.checkIns.checkedOutAt),
      ))
      .limit(1);

    if (occupiedCheckIn) {
      throw createError({
        statusCode: 409,
        statusMessage: `Seat ${seatNumber} is already occupied by ${occupiedCheckIn.memberName}`
      });
    }
  }

  // Determine subscription status
  const latestSub = await db
    .select({
      status: schema.memberSubscriptions.status,
      endDate: schema.memberSubscriptions.endDate,
    })
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.memberId, Number(memberId)),
      eq(schema.memberSubscriptions.orgId, access.orgId),
    ))
    .orderBy(desc(schema.memberSubscriptions.id))
    .limit(1);

  let subscriptionStatus = "none";
  let warning = "";
  const today = new Date().toISOString().split("T")[0]!;

  if (latestSub[0]) {
    if (latestSub[0].status === "active" && latestSub[0].endDate >= today) {
      subscriptionStatus = "active";
    } else if (latestSub[0].endDate < today) {
      subscriptionStatus = "expired";
      warning = "Member's subscription has expired";
    } else {
      subscriptionStatus = "inactive";
      warning = "Member's subscription is inactive";
    }
  } else {
    warning = "Member has no subscription";
  }

  const result = await db.insert(schema.checkIns).values({
    orgId: access.orgId,
    memberId: Number(memberId),
    checkedInBy: access.userId,
    subscriptionStatus,
    seatId: finalSeatId || null,
    seatNumber: seatNumber || null,
    notes: notes || null,
  }).returning();

  await invalidateCache(access.orgId, "checkIns");
  await invalidateCache(access.orgId, "seats");
  return { checkIn: result[0], warning };
});
