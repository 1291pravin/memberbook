import { eq, and } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = getRouterParam(event, "memberId");

  if (!memberId || !Number.isInteger(Number(memberId))) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid member ID",
    });
  }

  // Get member's seat assignment with seat details
  const [assignment] = await db
    .select({
      id: schema.memberSeatAssignments.id,
      orgId: schema.memberSeatAssignments.orgId,
      memberId: schema.memberSeatAssignments.memberId,
      seatId: schema.memberSeatAssignments.seatId,
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
    })
    .from(schema.memberSeatAssignments)
    .leftJoin(schema.librarySeats, eq(schema.librarySeats.id, schema.memberSeatAssignments.seatId))
    .leftJoin(schema.users, eq(schema.users.id, schema.memberSeatAssignments.assignedBy))
    .where(
      and(
        eq(schema.memberSeatAssignments.memberId, Number(memberId)),
        eq(schema.memberSeatAssignments.orgId, access.orgId),
      ),
    )
    .limit(1);

  if (!assignment) {
    return { assignment: null };
  }

  return {
    assignment: {
      id: assignment.id,
      orgId: assignment.orgId,
      memberId: assignment.memberId,
      seatId: assignment.seatId,
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy,
      assignedByName: assignment.assignedByName,
      notes: assignment.notes,
      createdAt: assignment.createdAt,
      seat: {
        id: assignment.seatId,
        seatNumber: assignment.seatNumber,
        seatLabel: assignment.seatLabel,
        timePreference: assignment.timePreference,
        genderPreference: assignment.genderPreference,
      },
    },
  };
}, {
  maxAge: 300, // Cache for 5 minutes
  getKey: (event) => {
    const orgId = getRouterParam(event, "orgId");
    const memberId = getRouterParam(event, "memberId");
    return `org${orgId}memberseatassignment${memberId}`;
  },
});
