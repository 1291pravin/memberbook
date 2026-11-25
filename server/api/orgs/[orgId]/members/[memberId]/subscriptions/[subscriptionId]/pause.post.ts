import { and, eq, gt, ne } from "drizzle-orm";

/**
 * Pause (freeze) a membership, or resume it early.
 * Body { from, until } (YYYY-MM-DD, until inclusive): pushes the end date out
 * by the paused days. Body { resume: true }: ends the pause today and takes
 * back the paused days not used.
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  const subscriptionId = Number(getRouterParam(event, "subscriptionId"));
  const body = await readBody<{ from?: string; until?: string; resume?: boolean }>(event) ?? {};

  const [sub] = await db.select().from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.id, subscriptionId),
      eq(schema.memberSubscriptions.memberId, memberId),
      eq(schema.memberSubscriptions.orgId, access.orgId),
    )).limit(1);
  if (!sub) throw createError({ statusCode: 404, statusMessage: "Subscription not found" });
  const where = and(eq(schema.memberSubscriptions.id, subscriptionId), eq(schema.memberSubscriptions.orgId, access.orgId));
  const today = todayIST();
  const days = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

  if (body.resume) {
    if (!sub.pauseStart || !sub.pauseEnd) throw createError({ statusCode: 400, statusMessage: "This membership isn't paused" });
    // Not started yet: cancel the whole pause. Running: unused days come off the end date.
    const resumeOn = sub.pauseStart > today ? sub.pauseStart : today;
    const unused = Math.max(0, days(resumeOn, sub.pauseEnd) + 1);
    const pausedAny = resumeOn > sub.pauseStart;
    await db.update(schema.memberSubscriptions).set({
      endDate: addDaysToDate(sub.endDate, -unused),
      pauseStart: pausedAny ? sub.pauseStart : null,
      pauseEnd: pausedAny ? addDaysToDate(resumeOn, -1) : null,
    }).where(where);
    return { ok: true, endDate: addDaysToDate(sub.endDate, -unused) };
  }

  if (!isIsoDate(body.from) || !isIsoDate(body.until) || body.until! < body.from!) {
    throw createError({ statusCode: 400, statusMessage: "Pick the first and last day of the pause" });
  }
  if (sub.status === "cancelled") throw createError({ statusCode: 400, statusMessage: "This subscription is cancelled" });
  if (sub.pauseEnd && sub.pauseEnd >= today) throw createError({ statusCode: 400, statusMessage: "Already paused. Resume it first." });
  if (body.from! < today && body.from! < sub.startDate) throw createError({ statusCode: 400, statusMessage: "The pause must start during the membership" });
  if (body.from! > sub.endDate) throw createError({ statusCode: 400, statusMessage: "The pause must start before the membership ends" });
  const length = days(body.from!, body.until!) + 1;
  if (length > 90) throw createError({ statusCode: 400, statusMessage: "A pause can be at most 90 days" });

  // Pushing the end date out would run into a renewal that's already added.
  const [later] = await db.select({ id: schema.memberSubscriptions.id }).from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.orgId, access.orgId),
      eq(schema.memberSubscriptions.memberId, memberId),
      ne(schema.memberSubscriptions.id, subscriptionId),
      ne(schema.memberSubscriptions.status, "cancelled"),
      gt(schema.memberSubscriptions.startDate, sub.startDate),
    )).limit(1);
  if (later) throw createError({ statusCode: 400, statusMessage: "A renewal is already added after this one. Pause the latest subscription instead." });

  const endDate = addDaysToDate(sub.endDate, length);
  await db.update(schema.memberSubscriptions).set({ endDate, pauseStart: body.from!, pauseEnd: body.until! }).where(where);
  return { ok: true, endDate, days: length };
});
