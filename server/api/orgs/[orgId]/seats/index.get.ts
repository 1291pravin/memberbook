import { eq, and, isNull, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const query = getQuery(event);
  const status = query.status as string | undefined;
  const timeFilter = query.timeFilter as string | undefined;
  const genderFilter = query.genderFilter as string | undefined;

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

  // Transform to include isOccupied flag
  const seats = seatsWithOccupancy.map((seat) => ({
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
  }));

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
    maleOccupied: seats.filter(
      (s) => s.isOccupied && s.currentOccupant?.memberGender === "male",
    ).length,
    femaleOccupied: seats.filter(
      (s) => s.isOccupied && s.currentOccupant?.memberGender === "female",
    ).length,
  };

  return { seats: filteredSeats, stats };
}, {
  maxAge: 60, // Cache for 60 seconds for real-time feel
  getKey: (event) => orgCacheKey(event, "seats"),
});
