import { and, eq } from "drizzle-orm";

/**
 * Set (or clear) the instalment plan of a subscription.
 * Body: { count: 2-12, firstDueDate: YYYY-MM-DD, everyDays: 7-92 } splits the
 * fee equally; { count: 0 } removes the plan (the whole fee is due again).
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  const subscriptionId = Number(getRouterParam(event, "subscriptionId"));
  const body = await readBody<{ count?: number; firstDueDate?: string; everyDays?: number }>(event) ?? {};

  const [sub] = await db.select({ id: schema.memberSubscriptions.id, amount: schema.memberSubscriptions.amount })
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.id, subscriptionId),
      eq(schema.memberSubscriptions.memberId, memberId),
      eq(schema.memberSubscriptions.orgId, access.orgId),
    )).limit(1);
  if (!sub) throw createError({ statusCode: 404, statusMessage: "Subscription not found" });

  const count = Number(body.count ?? 0);
  const clear = db.delete(schema.subscriptionInstalments).where(and(
    eq(schema.subscriptionInstalments.orgId, access.orgId),
    eq(schema.subscriptionInstalments.subscriptionId, subscriptionId),
  ));
  if (count === 0) {
    await clear;
    return { instalments: [] };
  }

  const everyDays = Number(body.everyDays);
  if (!Number.isInteger(count) || count < 2 || count > 12) throw createError({ statusCode: 400, statusMessage: "Choose 2 to 12 instalments" });
  if (!isIsoDate(body.firstDueDate)) throw createError({ statusCode: 400, statusMessage: "Pick the first due date" });
  if (!Number.isInteger(everyDays) || everyDays < 7 || everyDays > 92) throw createError({ statusCode: 400, statusMessage: "Instalments must be 7 to 92 days apart" });
  if (sub.amount < count * 100) throw createError({ statusCode: 400, statusMessage: "The fee is too small to split" });

  const list = equalInstalments(sub.amount, count, body.firstDueDate!, everyDays);
  await db.batch([
    clear,
    db.insert(schema.subscriptionInstalments).values(list.map(i => ({ orgId: access.orgId, subscriptionId, dueDate: i.dueDate, amount: i.amount }))),
  ]);
  return { instalments: list };
});
