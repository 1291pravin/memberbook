import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  const body = await readBody(event);
  const { planId, startDate } = body;

  if (!planId || !startDate) {
    throw createError({ statusCode: 400, statusMessage: "Plan and start date are required" });
  }

  // Fetch plan to compute end date
  const plans = await db
    .select()
    .from(schema.subscriptionPlans)
    .where(and(eq(schema.subscriptionPlans.id, Number(planId)), eq(schema.subscriptionPlans.orgId, access.orgId)))
    .limit(1);

  const plan = plans[0];
  if (!plan) {
    throw createError({ statusCode: 404, statusMessage: "Plan not found" });
  }

  const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);

  const result = await db.insert(schema.memberSubscriptions).values({
    orgId: access.orgId,
    memberId,
    planId: plan.id,
    startDate,
    endDate,
    amount: plan.price,
    autoRenew: true,
    paymentStatus: "unpaid",
  }).returning();

  await invalidateCache(access.orgId, "subscriptions");
  return { subscription: result[0] };
});
