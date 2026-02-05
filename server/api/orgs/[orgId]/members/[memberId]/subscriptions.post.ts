import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  const body = await readBody(event);
  const { planId, startDate, changePlan, payment } = body;

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

  // Check for existing active subscription
  const today = new Date().toISOString().split("T")[0];
  const activeSubs = await db
    .select()
    .from(schema.memberSubscriptions)
    .where(
      and(
        eq(schema.memberSubscriptions.orgId, access.orgId),
        eq(schema.memberSubscriptions.memberId, memberId),
        eq(schema.memberSubscriptions.status, "active"),
      ),
    );
  const activeSubscription = activeSubs.find(s => s.endDate >= today);

  // Allow renewal if the new subscription starts on or after the active one ends
  if (activeSubscription && !changePlan && startDate < activeSubscription.endDate) {
    throw createError({ statusCode: 409, statusMessage: "Member already has an active subscription. Use change plan instead." });
  }

  // If changing plan, cancel the current active subscription
  if (activeSubscription && changePlan) {
    await db
      .update(schema.memberSubscriptions)
      .set({ status: "cancelled" })
      .where(eq(schema.memberSubscriptions.id, activeSubscription.id));
  }

  const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);

  // Determine payment status based on inline payment
  let paymentStatus = "unpaid";
  if (payment?.amount) {
    paymentStatus = payment.amount >= plan.price ? "paid" : "partial";
  }

  const result = await db.insert(schema.memberSubscriptions).values({
    orgId: access.orgId,
    memberId,
    planId: plan.id,
    startDate,
    endDate,
    amount: plan.price,
    autoRenew: true,
    paymentStatus,
  }).returning();

  const subscription = result[0];

  // Record payment if provided
  if (payment?.amount) {
    await db.insert(schema.payments).values({
      orgId: access.orgId,
      memberId,
      amount: Number(payment.amount),
      date: payment.date || startDate,
      method: payment.method || "cash",
      notes: payment.notes || null,
      subscriptionId: subscription.id,
    });
    await invalidateCache(access.orgId, "payments");
  }

  await invalidateCache(access.orgId, "subscriptions");
  return { subscription };
});
