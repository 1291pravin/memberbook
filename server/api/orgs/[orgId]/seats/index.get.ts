import { eq, and, isNull, inArray, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const query = getQuery(event);
  const status = query.status as string | undefined;
  const timeFilter = query.timeFilter as string | undefined;
  const genderFilter = query.genderFilter as string | undefined;
  const batchId = query.batchId ? Number(query.batchId) : undefined;

  // Base conditions
  const conditions = [
    eq(schema.librarySeats.orgId, access.orgId),
    eq(schema.librarySeats.isActive, true),
  ];

  // Filter by time preference
  if (timeFilter && timeFilter !== "all") {
    conditions.push(eq(schema.librarySeats.timePreference, timeFilter));
  }

  // Filter by gender preference
  if (genderFilter && genderFilter !== "all") {
    conditions.push(eq(schema.librarySeats.genderPreference, genderFilter));
  }

  const whereClause = and(...conditions);

  // Fetch all seats with current occupancy info
  const seatsWithOccupancy = await db
    .select({
      id: schema.librarySeats.id,
      orgId: schema.librarySeats.orgId,
      seatNumber: schema.librarySeats.seatNumber,
      seatLabel: schema.librarySeats.seatLabel,
      timePreference: schema.librarySeats.timePreference,
      genderPreference: schema.librarySeats.genderPreference,
      displayOrder: schema.librarySeats.displayOrder,
      notes: schema.librarySeats.notes,
      createdAt: schema.librarySeats.createdAt,
      // Current occupant info (if any active check-in)
      currentCheckInId: schema.checkIns.id,
      currentOccupantId: schema.members.id,
      currentOccupantName: schema.members.name,
      currentOccupantGender: schema.members.gender,
      checkedInAt: schema.checkIns.checkedInAt,
    })
    .from(schema.librarySeats)
    .leftJoin(
      schema.checkIns,
      and(
        eq(schema.checkIns.seatId, schema.librarySeats.id),
        isNull(schema.checkIns.checkedOutAt),
      ),
    )
    .leftJoin(schema.members, eq(schema.members.id, schema.checkIns.memberId))
    .where(whereClause)
    .orderBy(schema.librarySeats.displayOrder);

  // If batchId is provided, also fetch batch-based seat assignments
  let assignmentMap = new Map<number, { memberId: number; memberName: string; memberGender: string | null }>();

  if (batchId) {
    const batchAssignments = await db
      .select({
        seatId: schema.memberSeatAssignments.seatId,
        memberId: schema.members.id,
        memberName: schema.members.name,
        memberGender: schema.members.gender,
      })
      .from(schema.memberSeatAssignments)
      .innerJoin(schema.members, eq(schema.members.id, schema.memberSeatAssignments.memberId))
      .where(
        and(
          eq(schema.memberSeatAssignments.orgId, access.orgId),
          eq(schema.memberSeatAssignments.batchId, batchId),
        ),
      );

    for (const a of batchAssignments) {
      assignmentMap.set(a.seatId, {
        memberId: a.memberId,
        memberName: a.memberName,
        memberGender: a.memberGender,
      });
    }
  }

  // Collect all member IDs from occupants and assignments
  const memberIds = new Set<number>();
  for (const seat of seatsWithOccupancy) {
    if (seat.currentOccupantId) memberIds.add(seat.currentOccupantId);
  }
  for (const [, a] of assignmentMap) {
    memberIds.add(a.memberId);
  }

  // Batch query latest subscription status for all members on seats
  const memberAlertMap = new Map<number, { hasActiveSubscription: boolean; paymentStatus: string | null }>();
  if (memberIds.size > 0) {
    const today = new Date().toISOString().split("T")[0]!;
    const subscriptions = await db
      .select({
        memberId: schema.memberSubscriptions.memberId,
        status: schema.memberSubscriptions.status,
        endDate: schema.memberSubscriptions.endDate,
        paymentStatus: schema.memberSubscriptions.paymentStatus,
      })
      .from(schema.memberSubscriptions)
      .where(
        and(
          eq(schema.memberSubscriptions.orgId, access.orgId),
          inArray(schema.memberSubscriptions.memberId, [...memberIds]),
        ),
      )
      .orderBy(sql`${schema.memberSubscriptions.endDate} DESC`);

    // Group by memberId — first row per member is the latest subscription
    for (const sub of subscriptions) {
      if (!memberAlertMap.has(sub.memberId)) {
        const isActive = sub.status === "active" && sub.endDate >= today;
        memberAlertMap.set(sub.memberId, {
          hasActiveSubscription: isActive,
          paymentStatus: sub.paymentStatus,
        });
      }
    }

    // Members with no subscriptions at all
    for (const id of memberIds) {
      if (!memberAlertMap.has(id)) {
        memberAlertMap.set(id, { hasActiveSubscription: false, paymentStatus: null });
      }
    }
  }

  // Transform to include isOccupied flag and assigned member info
  const seats = seatsWithOccupancy.map((seat) => {
    const assigned = assignmentMap.get(seat.id) ?? null;
    const memberId = seat.currentOccupantId ?? assigned?.memberId ?? null;
    const alert = memberId ? memberAlertMap.get(memberId) ?? null : null;
    return {
      id: seat.id,
      orgId: seat.orgId,
      seatNumber: seat.seatNumber,
      seatLabel: seat.seatLabel,
      timePreference: seat.timePreference,
      genderPreference: seat.genderPreference,
      displayOrder: seat.displayOrder,
      notes: seat.notes,
      createdAt: seat.createdAt,
      isOccupied: !!seat.currentCheckInId,
      currentOccupant: seat.currentCheckInId
        ? {
            checkInId: seat.currentCheckInId,
            memberId: seat.currentOccupantId!,
            memberName: seat.currentOccupantName!,
            memberGender: seat.currentOccupantGender,
            checkedInAt: seat.checkedInAt!,
          }
        : null,
      assignedMember: assigned,
      memberAlert: alert,
    };
  });

  // Filter by occupancy status if requested
  const filteredSeats =
    status === "occupied"
      ? seats.filter((s) => s.isOccupied)
      : status === "vacant"
        ? seats.filter((s) => !s.isOccupied)
        : seats;

  // Calculate statistics
  const stats = {
    total: seats.length,
    occupied: seats.filter((s) => s.isOccupied).length,
    vacant: seats.filter((s) => !s.isOccupied).length,
    assigned: seats.filter((s) => s.assignedMember).length,
    unassigned: seats.filter((s) => !s.assignedMember).length,
    maleOccupied: seats.filter(
      (s) => s.isOccupied && s.currentOccupant?.memberGender === "male",
    ).length,
    femaleOccupied: seats.filter(
      (s) => s.isOccupied && s.currentOccupant?.memberGender === "female",
    ).length,
    needsAttention: seats.filter(
      (s) => s.memberAlert && (!s.memberAlert.hasActiveSubscription || s.memberAlert.paymentStatus === "unpaid" || s.memberAlert.paymentStatus === "partial"),
    ).length,
  };

  return { seats: filteredSeats, stats };
}, {
  maxAge: 60,
  getKey: (event) => {
    const query = getQuery(event);
    const batchSuffix = query.batchId ? `batch${query.batchId}` : "";
    return orgCacheKey(event, "seats") + batchSuffix;
  },
});
