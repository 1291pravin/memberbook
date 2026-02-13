import { eq, and, isNull, lt } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const staleCheckIns = await db
    .select()
    .from(schema.checkIns)
    .where(and(
      eq(schema.checkIns.orgId, access.orgId),
      isNull(schema.checkIns.checkedOutAt),
      lt(schema.checkIns.checkedInAt, cutoff),
    ));

  for (const ci of staleCheckIns) {
    const checkedInAt = new Date(ci.checkedInAt);
    const durationMinutes = Math.round((now.getTime() - checkedInAt.getTime()) / 60000);

    await db
      .update(schema.checkIns)
      .set({
        checkedOutAt: now.toISOString(),
        checkedOutBy: access.userId,
        durationMinutes,
        autoCheckedOut: true,
      })
      .where(eq(schema.checkIns.id, ci.id));
  }

  await invalidateCache(access.orgId, "checkIns");
  await invalidateCache(access.orgId, "seats");
  return { checkedOutCount: staleCheckIns.length };
});
