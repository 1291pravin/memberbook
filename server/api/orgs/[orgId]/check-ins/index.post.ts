import { eq, and, isNull, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const { memberId, notes } = body;

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
    notes: notes || null,
  }).returning();

  await invalidateCache(access.orgId, "checkIns");
  return { checkIn: result[0], warning };
});
