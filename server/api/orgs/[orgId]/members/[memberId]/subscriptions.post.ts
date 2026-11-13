import { and, eq, gt, lt, ne } from "drizzle-orm";

// Any non-cancelled subscription of this member whose dates overlap
// [startDate, endDate], optionally ignoring one subscription. Sharing a single
// boundary day is allowed: subscriptions created before end dates became
// inclusive end on the day their renewal starts.
async function findOverlappingSubscription(orgId: number, memberId: number, startDate: string, endDate: string, excludeId?: number) {
  const conditions = [
    eq(schema.memberSubscriptions.orgId, orgId),
    eq(schema.memberSubscriptions.memberId, memberId),
    ne(schema.memberSubscriptions.status, "cancelled"),
    lt(schema.memberSubscriptions.startDate, endDate),
    gt(schema.memberSubscriptions.endDate, startDate),
  ];
  if (excludeId) conditions.push(ne(schema.memberSubscriptions.id, excludeId));
  const [overlap] = await db
    .select({ startDate: schema.memberSubscriptions.startDate, endDate: schema.memberSubscriptions.endDate })
    .from(schema.memberSubscriptions)
    .where(and(...conditions))
    .limit(1);
  return overlap ?? null;
}

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
    if (payment.date !== undefined && payment.date !== "" && !isIsoDate(payment.date)) {
      throw createError({ statusCode: 400, statusMessage: "Invalid payment date" });
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

    const overlap = await findOverlappingSubscription(access.orgId, memberId, startDate, endDate, existing.id);
    if (overlap) {
      throw createError({ statusCode: 409, statusMessage: `These dates overlap another subscription (${overlap.startDate} to ${overlap.endDate}).` });
    }

    const existingPaid = await getSubscriptionPaidTotal(existing.id, access.orgId);
    if (existingPaid + (inlinePaymentAmount ?? 0) > plan.price) {
      throw createError({ statusCode: 400, statusMessage: "Existing payments exceed the new plan amount. Edit or delete them first." });
    }

    const todayStr = todayIST();
    const [updated] = await db.update(schema.memberSubscriptions).set({
      planId: plan.id,
      startDate,
      endDate,
      amount: plan.price,
      status: existing.status === "cancelled" ? "cancelled" : (endDate >= todayStr ? "active" : "expired"),
    }).where(and(eq(schema.memberSubscriptions.id, existing.id), eq(schema.memberSubscriptions.orgId, access.orgId))).returning();

    if (inlinePaymentAmount) {
      const [p] = await db.insert(schema.payments).values({
        orgId: access.orgId,
        memberId,
        amount: inlinePaymentAmount,
        date: payment.date && isIsoDate(payment.date) ? payment.date : startDate,
        method: payment.method || "cash",
        notes: typeof payment.notes === "string" ? payment.notes.trim() || null : null,
        subscriptionId: updated.id,
      }).returning({ id: schema.payments.id });
      queueThankYouReceipt(event, access.orgId, p?.id);
    }
    await recalculateSubscriptionPaymentStatus(updated.id, access.orgId);
    return { subscription: updated };
  }

  // Check against every existing subscription (current, queued renewals and
  // past ones), not just the first active one, so renewals can't stack.
  const overlap = await findOverlappingSubscription(access.orgId, memberId, startDate, endDate);
  if (overlap) {
    throw createError({
      statusCode: 409,
      statusMessage: `These dates overlap an existing subscription (${overlap.startDate} to ${overlap.endDate}). Start after ${overlap.endDate} or change the current plan instead.`,
    });
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
    const [p] = await db.insert(schema.payments).values({
      orgId: access.orgId,
      memberId,
      amount: inlinePaymentAmount,
      date: payment.date && isIsoDate(payment.date) ? payment.date : startDate,
      method: payment.method || "cash",
      notes: typeof payment.notes === "string" ? payment.notes.trim() || null : null,
      subscriptionId: subscription.id,
    }).returning({ id: schema.payments.id });
    queueThankYouReceipt(event, access.orgId, p?.id);
  }

  return { subscription };
});
