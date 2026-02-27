import { eq, and, isNull } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = getRouterParam(event, "memberId");
  const query = getQuery(event);
  const batchId = query.batchId ? Number(query.batchId) : undefined;

  if (!memberId || !Number.isInteger(Number(memberId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid member ID",
    });
  }

  const baseConditions = [
    eq(schema.memberSeatAssignments.memberId, Number(memberId)),
    eq(schema.memberSeatAssignments.orgId, access.orgId),
  ];

  // If batchId specified, filter to that batch; otherwise return all
  if (batchId !== undefined) {
    baseConditions.push(eq(schema.memberSeatAssignments.batchId, batchId));
  }

  const assignments = await db
    .select({
      id: schema.memberSeatAssignments.id,
      orgId: schema.memberSeatAssignments.orgId,
      memberId: schema.memberSeatAssignments.memberId,
      seatId: schema.memberSeatAssignments.seatId,
      batchId: schema.memberSeatAssignments.batchId,
      assignedAt: schema.memberSeatAssignments.assignedAt,
      assignedBy: schema.memberSeatAssignments.assignedBy,
      notes: schema.memberSeatAssignments.notes,
      createdAt: schema.memberSeatAssignments.createdAt,
      // Seat details
      seatNumber: schema.librarySeats.seatNumber,
      seatLabel: schema.librarySeats.seatLabel,
      timePreference: schema.librarySeats.timePreference,
      genderPreference: schema.librarySeats.genderPreference,
      // Assigner details
      assignedByName: schema.users.name,
      // Batch details
      batchName: schema.seatBatches.name,
    })
    .from(schema.memberSeatAssignments)
    .leftJoin(schema.librarySeats, eq(schema.librarySeats.id, schema.memberSeatAssignments.seatId))
    .leftJoin(schema.users, eq(schema.users.id, schema.memberSeatAssignments.assignedBy))
    .leftJoin(schema.seatBatches, eq(schema.seatBatches.id, schema.memberSeatAssignments.batchId))
    .where(and(...baseConditions));

  const mapped = assignments.map((a) => ({
    id: a.id,
    orgId: a.orgId,
    memberId: a.memberId,
    seatId: a.seatId,
    batchId: a.batchId,
    batchName: a.batchName,
    assignedAt: a.assignedAt,
    assignedBy: a.assignedBy,
    assignedByName: a.assignedByName,
    notes: a.notes,
    createdAt: a.createdAt,
    seat: {
      id: a.seatId,
      seatNumber: a.seatNumber,
      seatLabel: a.seatLabel,
      timePreference: a.timePreference,
      genderPreference: a.genderPreference,
    },
  }));

  // For backward compatibility: if no batchId filter, return first as "assignment"
  // Also return all as "assignments" array
  return {
    assignment: mapped[0] ?? null,
    assignments: mapped,
  };
}, {
  maxAge: 300,
  getKey: (event) => {
    const orgId = getRouterParam(event, "orgId");
    const memberId = getRouterParam(event, "memberId");
    const query = getQuery(event);
    const batchId = query.batchId || "all";
    return `org${orgId}memberseatassignment${memberId}batch${batchId}`;
  },
});
