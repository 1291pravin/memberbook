import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  const body = await readBody(event);
  const { planId, startDate, changePlan, subscriptionId, payment } = body;

  if (!Number.isInteger(memberId) || memberId <= 0 || !planId || !isIsoDate(startDate)) {
    throw createError({ statusCode: 400, statusMessage: "Member, plan, and valid start date are required" });
  }

  const [member] = await db.select({ id: schema.members.id }).from(schema.members).where(and(
    eq(schema.members.id, memberId),
    eq(schema.members.orgId, access.orgId),
  )).limit(1);
  if (!member) throw createError({ statusCode: 404, statusMessage: "Member not found" });

  const [plan] = await db.select().from(schema.subscriptionPlans).where(and(
    eq(schema.subscriptionPlans.id, Number(planId)),
    eq(schema.subscriptionPlans.orgId, access.orgId),
  )).limit(1);
  if (!plan) throw createError({ statusCode: 404, statusMessage: "Plan not found" });

  let inlinePaymentAmount: number | null = null;
  if (payment?.amount !== undefined) {
    inlinePaymentAmount = parsePaymentAmount(payment.amount);
    if (!inlinePaymentAmount) throw createError({ statusCode: 400, statusMessage: "Payment amount must be positive" });
    if (inlinePaymentAmount > plan.price) throw createError({ statusCode: 400, statusMessage: "Payment exceeds the subscription amount" });
    if (payment.method !== undefined && !isPaymentMethod(payment.method)) {
      throw createError({ statusCode: 400, statusMessage: "Invalid payment method" });
    }
  }

  const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);

  if (changePlan) {
    const id = Number(subscriptionId);
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, statusMessage: "Select the subscription whose plan should be changed" });
    }

    const [existing] = await db.select().from(schema.memberSubscriptions).where(and(
      eq(schema.memberSubscriptions.id, id),
      eq(schema.memberSubscriptions.memberId, memberId),
      eq(schema.memberSubscriptions.orgId, access.orgId),
    )).limit(1);
    if (!existing) throw createError({ statusCode: 404, statusMessage: "Subscription not found" });

    const existingPaid = await getSubscriptionPaidTotal(existing.id, access.orgId);
    if (existingPaid + (inlinePaymentAmount ?? 0) > plan.price) {
      throw createError({ statusCode: 400, statusMessage: "Existing payments exceed the new plan amount. Edit or delete them first." });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const [updated] = await db.update(schema.memberSubscriptions).set({
      planId: plan.id,
      startDate,
      endDate,
      amount: plan.price,
      status: existing.status === "cancelled" ? "cancelled" : (endDate >= todayStr ? "active" : "expired"),
    }).where(and(eq(schema.memberSubscriptions.id, existing.id), eq(schema.memberSubscriptions.orgId, access.orgId))).returning();

    if (inlinePaymentAmount) {
      await db.insert(schema.payments).values({
        orgId: access.orgId,
        memberId,
        amount: inlinePaymentAmount,
        date: payment.date && isIsoDate(payment.date) ? payment.date : startDate,
        method: payment.method || "cash",
        notes: typeof payment.notes === "string" ? payment.notes.trim() || null : null,
        subscriptionId: updated.id,
      });
    }
    await recalculateSubscriptionPaymentStatus(updated.id, access.orgId);
    await invalidateCache(access.orgId);
    return { subscription: updated };
  }

  const today = new Date().toISOString().split("T")[0];
  const activeSubs = await db.select().from(schema.memberSubscriptions).where(and(
    eq(schema.memberSubscriptions.orgId, access.orgId),
    eq(schema.memberSubscriptions.memberId, memberId),
    eq(schema.memberSubscriptions.status, "active"),
  ));
  const activeSubscription = activeSubs.find(s => s.endDate >= today);
  if (activeSubscription && startDate < activeSubscription.endDate) {
    throw createError({ statusCode: 409, statusMessage: "Member already has an active subscription. Change the current plan instead." });
  }

  const [subscription] = await db.insert(schema.memberSubscriptions).values({
    orgId: access.orgId,
    memberId,
    planId: plan.id,
    startDate,
    endDate,
    amount: plan.price,
    autoRenew: true,
    paymentStatus: inlinePaymentAmount ? (inlinePaymentAmount >= plan.price ? "paid" : "partial") : "unpaid",
  }).returning();

  if (inlinePaymentAmount) {
    await db.insert(schema.payments).values({
      orgId: access.orgId,
      memberId,
      amount: inlinePaymentAmount,
      date: payment.date && isIsoDate(payment.date) ? payment.date : startDate,
      method: payment.method || "cash",
      notes: typeof payment.notes === "string" ? payment.notes.trim() || null : null,
      subscriptionId: subscription.id,
    });
  }

  await invalidateCache(access.orgId);
  return { subscription };
});
