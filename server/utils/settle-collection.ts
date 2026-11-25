import type { H3Event } from "h3";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Record that a collection item was paid: a due balance, or the next renewal
 * period. Used by the owner's one-tap "mark paid" and by online payments that
 * confirm themselves (owner's own Razorpay).
 *
 * - due: records a payment for the remaining balance (or `amount`, if given).
 * - renewal: creates the next period on the same plan (starting the day after
 *   the current one ends, unless startDate is given) and records it as paid.
 *
 * `online` means the money has already reached the owner: if the balance was
 * settled some other way in the meantime, the payment is still recorded so
 * nothing received goes missing, instead of failing. `externalRef` makes a
 * repeat call (callback and webhook for the same payment) a no-op.
 */
export async function settleCollection(event: H3Event, opts: {
  orgId: number;
  subscriptionId: number;
  kind: "due" | "renewal";
  method: string;
  date: string;
  notes: string;
  amount?: number;
  startDate?: string;
  online?: boolean;
  externalRef?: string;
}): Promise<{ ok: true; paymentId?: number; subscriptionId?: number; duplicate?: boolean }> {
  const { orgId, kind, method, date, notes, online, externalRef } = opts;

  if (externalRef) {
    const [existing] = await db.select({ id: schema.payments.id }).from(schema.payments)
      .where(eq(schema.payments.externalRef, externalRef)).limit(1);
    if (existing) return { ok: true, paymentId: existing.id, duplicate: true };
  }

  const [sub] = await db.select().from(schema.memberSubscriptions).where(and(
    eq(schema.memberSubscriptions.id, opts.subscriptionId),
    eq(schema.memberSubscriptions.orgId, orgId),
  )).limit(1);
  if (!sub || (sub.status === "cancelled" && !online)) throw createError({ statusCode: 404, statusMessage: "Subscription not found" });

  // Money already received but nothing left to settle: keep the record, unlinked from any period's balance.
  async function recordLoose(amount: number, why: string) {
    const [p] = await db.insert(schema.payments).values({
      orgId, memberId: sub!.memberId, subscriptionId: null, amount, method, date, notes: `${notes} (${why})`, externalRef: externalRef ?? null,
    }).returning({ id: schema.payments.id });
    queueThankYouReceipt(event, orgId, p?.id);
    return { ok: true as const, paymentId: p?.id };
  }

  if (kind === "due") {
    const paid = await getSubscriptionPaidTotal(sub.id, orgId);
    const pending = sub.amount - paid;
    if (pending <= 0) {
      if (online && opts.amount) return recordLoose(opts.amount, "balance was already paid");
      throw createError({ statusCode: 400, statusMessage: "This subscription is already fully paid" });
    }
    const amount = opts.amount ? Math.min(opts.amount, pending) : pending;

    // Same guard as recording a payment: re-check the balance inside the insert.
    const inserted = await db.all<{ id: number }>(sql`
      INSERT INTO payments (org_id, member_id, subscription_id, amount, method, date, notes, external_ref, created_at)
      SELECT ${orgId}, ${sub.memberId}, ${sub.id}, ${amount}, ${method}, ${date}, ${notes}, ${externalRef ?? null}, ${new Date().toISOString()}
      WHERE (
        SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE subscription_id = ${sub.id} AND org_id = ${orgId}
      ) + ${amount} <= ${sub.amount}
      RETURNING id
    `);
    if (!inserted[0]) {
      if (online && opts.amount) return recordLoose(opts.amount, "balance was paid at the same time");
      throw createError({ statusCode: 409, statusMessage: "A payment was just recorded for this member. Refresh and try again." });
    }
    // Paid more than the balance online: the extra is recorded too.
    if (online && opts.amount && opts.amount > amount) await recordLoose(opts.amount - amount, "extra over the balance");

    await recalculateSubscriptionPaymentStatus(sub.id, orgId);
    if (amount >= pending) await closePaymentLink(orgId, sub.id, "due");
    queueThankYouReceipt(event, orgId, inserted[0].id);
    return { ok: true, paymentId: inserted[0].id };
  }

  // Renewal: only from the member's latest subscription, so a double tap can't stack periods.
  const [latest] = await db.select({ id: sql<number>`MAX(${schema.memberSubscriptions.id})` })
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.orgId, orgId),
      eq(schema.memberSubscriptions.memberId, sub.memberId),
      ne(schema.memberSubscriptions.status, "cancelled"),
    ));
  if (Number(latest?.id) !== sub.id) {
    if (online && opts.amount) return recordLoose(opts.amount, "member was already renewed");
    throw createError({ statusCode: 409, statusMessage: "This member has already been renewed. Refresh the list." });
  }

  const [plan] = await db.select().from(schema.subscriptionPlans).where(and(
    eq(schema.subscriptionPlans.id, sub.planId),
    eq(schema.subscriptionPlans.orgId, orgId),
  )).limit(1);
  if (!plan) {
    if (online && opts.amount) return recordLoose(opts.amount, "plan not found");
    throw createError({ statusCode: 404, statusMessage: "Plan not found" });
  }

  const startDate = opts.startDate ?? addDaysToDate(sub.endDate, 1);
  if (!isIsoDate(startDate)) throw createError({ statusCode: 400, statusMessage: "Invalid start date" });
  const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);
  const amount = plan.active && plan.price > 0 ? plan.price : sub.amount;
  if (amount <= 0) {
    if (online && opts.amount) return recordLoose(opts.amount, "plan is free");
    throw createError({ statusCode: 400, statusMessage: "This plan is free, so there is nothing to collect" });
  }

  const [overlap] = await db.select({ id: schema.memberSubscriptions.id })
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.orgId, orgId),
      eq(schema.memberSubscriptions.memberId, sub.memberId),
      ne(schema.memberSubscriptions.status, "cancelled"),
      lt(schema.memberSubscriptions.startDate, endDate),
      gt(schema.memberSubscriptions.endDate, startDate),
    ))
    .limit(1);
  if (overlap) {
    if (online && opts.amount) return recordLoose(opts.amount, "new period would overlap");
    throw createError({ statusCode: 409, statusMessage: "The new period would overlap an existing subscription. Pick a later start date." });
  }

  const paidAmount = online && opts.amount ? opts.amount : amount;
  const [renewed] = await db.insert(schema.memberSubscriptions).values({
    orgId,
    memberId: sub.memberId,
    planId: plan.id,
    startDate,
    endDate,
    amount,
    status: endDate >= todayIST() ? "active" : "expired",
    autoRenew: true,
    paymentStatus: paidAmount >= amount ? "paid" : "partial",
  }).returning();

  const [renewalPayment] = await db.insert(schema.payments).values({
    orgId,
    memberId: sub.memberId,
    subscriptionId: renewed!.id,
    amount: paidAmount,
    method,
    date,
    notes,
    externalRef: externalRef ?? null,
  }).returning({ id: schema.payments.id });
  if (paidAmount !== amount) await recalculateSubscriptionPaymentStatus(renewed!.id, orgId);
  await closePaymentLink(orgId, sub.id, "renewal");
  queueThankYouReceipt(event, orgId, renewalPayment?.id);

  return { ok: true, subscriptionId: renewed!.id, paymentId: renewalPayment?.id };
}
