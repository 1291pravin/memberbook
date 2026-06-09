import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const memberId = Number(getRouterParam(event, "memberId"));
  const subscriptionId = Number(getRouterParam(event, "subscriptionId"));

  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  }
  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid subscription ID" });
  }

  const [subscription] = await db.select().from(schema.memberSubscriptions).where(and(
    eq(schema.memberSubscriptions.id, subscriptionId),
    eq(schema.memberSubscriptions.memberId, memberId),
    eq(schema.memberSubscriptions.orgId, access.orgId),
  )).limit(1);
  if (!subscription) throw createError({ statusCode: 404, statusMessage: "Subscription not found" });

  await db.update(schema.payments).set({ subscriptionId: null }).where(and(
    eq(schema.payments.subscriptionId, subscriptionId),
    eq(schema.payments.orgId, access.orgId),
  ));
  await db.delete(schema.memberSubscriptions).where(and(
    eq(schema.memberSubscriptions.id, subscriptionId),
    eq(schema.memberSubscriptions.orgId, access.orgId),
  ));
  return { success: true };
});
