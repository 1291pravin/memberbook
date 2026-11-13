import { and, eq, gt, lt, ne, sql } from "drizzle-orm";

/**
 * One-tap "mark paid" from the collections list.
 * Body: { subscriptionId, kind: "due" | "renewal", method?, date?, startDate? }
 *
 * - due: records a payment for the whole remaining balance.
 * - renewal: creates the next period on the same plan (starting the day after
 *   the current one ends, unless startDate is given) and records it as paid.
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event) ?? {};
  const subscriptionId = Number(body.subscriptionId);
  const kind = body.kind;
  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0 || (kind !== "due" && kind !== "renewal")) {
    throw createError({ statusCode: 400, statusMessage: "Subscription and kind are required" });
  }
  const method = body.method ?? "upi";
  if (!isPaymentMethod(method)) throw createError({ statusCode: 400, statusMessage: "Invalid payment method" });
  const date = body.date ?? todayIST();
  if (!isIsoDate(date)) throw createError({ statusCode: 400, statusMessage: "Invalid payment date" });

  const [sub] = await db.select().from(schema.memberSubscriptions).where(and(
    eq(schema.memberSubscriptions.id, subscriptionId),
    eq(schema.memberSubscriptions.orgId, access.orgId),
  )).limit(1);
  if (!sub || sub.status === "cancelled") throw createError({ statusCode: 404, statusMessage: "Subscription not found" });

  if (kind === "due") {
    const paid = await getSubscriptionPaidTotal(sub.id, access.orgId);
    const pending = sub.amount - paid;
    if (pending <= 0) throw createError({ statusCode: 400, statusMessage: "This subscription is already fully paid" });

    // Same guard as recording a payment: re-check the balance inside the insert.
    const inserted = await db.all<{ id: number }>(sql`
      INSERT INTO payments (org_id, member_id, subscription_id, amount, method, date, notes, created_at)
      SELECT ${access.orgId}, ${sub.memberId}, ${sub.id}, ${pending}, ${method}, ${date}, ${"Marked paid from Collections"}, ${new Date().toISOString()}
      WHERE (
        SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE subscription_id = ${sub.id} AND org_id = ${access.orgId}
      ) + ${pending} <= ${sub.amount}
      RETURNING id
    `);
    if (!inserted[0]) throw createError({ statusCode: 409, statusMessage: "A payment was just recorded for this member. Refresh and try again." });

    await recalculateSubscriptionPaymentStatus(sub.id, access.orgId);
    await closePaymentLink(access.orgId, sub.id, "due");
    queueThankYouReceipt(event, access.orgId, inserted[0].id);
    return { ok: true, paymentId: inserted[0].id };
  }

  // Renewal: only from the member's latest subscription, so a double tap can't stack periods.
  const [latest] = await db.select({ id: sql<number>`MAX(${schema.memberSubscriptions.id})` })
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.orgId, access.orgId),
      eq(schema.memberSubscriptions.memberId, sub.memberId),
      ne(schema.memberSubscriptions.status, "cancelled"),
    ));
  if (Number(latest?.id) !== sub.id) {
    throw createError({ statusCode: 409, statusMessage: "This member has already been renewed. Refresh the list." });
  }

  const [plan] = await db.select().from(schema.subscriptionPlans).where(and(
    eq(schema.subscriptionPlans.id, sub.planId),
    eq(schema.subscriptionPlans.orgId, access.orgId),
  )).limit(1);
  if (!plan) throw createError({ statusCode: 404, statusMessage: "Plan not found" });

  const startDate = body.startDate ?? addDaysToDate(sub.endDate, 1);
  if (!isIsoDate(startDate)) throw createError({ statusCode: 400, statusMessage: "Invalid start date" });
  const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);
  const amount = plan.active && plan.price > 0 ? plan.price : sub.amount;
  if (amount <= 0) throw createError({ statusCode: 400, statusMessage: "This plan is free, so there is nothing to collect" });

  const [overlap] = await db.select({ id: schema.memberSubscriptions.id })
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.orgId, access.orgId),
      eq(schema.memberSubscriptions.memberId, sub.memberId),
      ne(schema.memberSubscriptions.status, "cancelled"),
      lt(schema.memberSubscriptions.startDate, endDate),
      gt(schema.memberSubscriptions.endDate, startDate),
    ))
    .limit(1);
  if (overlap) throw createError({ statusCode: 409, statusMessage: "The new period would overlap an existing subscription. Pick a later start date." });

  const [renewed] = await db.insert(schema.memberSubscriptions).values({
    orgId: access.orgId,
    memberId: sub.memberId,
    planId: plan.id,
    startDate,
    endDate,
    amount,
    status: endDate >= todayIST() ? "active" : "expired",
    autoRenew: true,
    paymentStatus: "paid",
  }).returning();

  const [renewalPayment] = await db.insert(schema.payments).values({
    orgId: access.orgId,
    memberId: sub.memberId,
    subscriptionId: renewed!.id,
    amount,
    method,
    date,
    notes: "Renewal marked paid from Collections",
  }).returning({ id: schema.payments.id });
  await closePaymentLink(access.orgId, sub.id, "renewal");
  queueThankYouReceipt(event, access.orgId, renewalPayment?.id);

  return { ok: true, subscriptionId: renewed!.id };
});
