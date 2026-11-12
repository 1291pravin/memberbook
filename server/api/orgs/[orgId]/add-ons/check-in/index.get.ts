import { and, eq, sql } from "drizzle-orm";

/** Self check-in: the door QR link, today's self check-ins and who has stopped coming. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const active = await isAddOnActive(access.orgId, "self_check_in");
  if (!active) return { active: false };

  const token = await ensureCheckInToken(access.orgId);
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in").replace(/\/$/, "");
  const startIso = new Date(Date.parse(`${todayIST()}T00:00:00+05:30`)).toISOString();
  const [[today], stopped] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.checkIns)
      .where(and(eq(schema.checkIns.orgId, access.orgId), eq(schema.checkIns.source, "self"), sql`${schema.checkIns.checkedInAt} >= ${startIso}`)),
    getStoppedComing(access.orgId),
  ]);
  return {
    active: true,
    url: `${appUrl}/checkin/${token}`,
    selfCheckInsToday: Number(today?.count ?? 0),
    stoppedComingDays: STOPPED_COMING_DAYS,
    stoppedComing: stopped,
  };
});
