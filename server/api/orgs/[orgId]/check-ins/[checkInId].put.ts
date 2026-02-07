import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const checkInId = Number(getRouterParam(event, "checkInId"));

  const rows = await db
    .select()
    .from(schema.checkIns)
    .where(and(
      eq(schema.checkIns.id, checkInId),
      eq(schema.checkIns.orgId, access.orgId),
    ))
    .limit(1);

  const checkIn = rows[0];
  if (!checkIn) {
    throw createError({ statusCode: 404, statusMessage: "Check-in not found" });
  }

  if (checkIn.checkedOutAt) {
    throw createError({ statusCode: 400, statusMessage: "Already checked out" });
  }

  const now = new Date();
  const checkedInAt = new Date(checkIn.checkedInAt);
  const durationMinutes = Math.round((now.getTime() - checkedInAt.getTime()) / 60000);

  const result = await db
    .update(schema.checkIns)
    .set({
      checkedOutAt: now.toISOString(),
      checkedOutBy: access.userId,
      durationMinutes,
    })
    .where(eq(schema.checkIns.id, checkInId))
    .returning();

  await invalidateCache(access.orgId, "checkIns");
  return { checkIn: result[0] };
});
