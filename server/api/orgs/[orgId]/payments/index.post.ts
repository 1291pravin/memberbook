import { eq, and, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const { memberId, amount, date, method, notes, subscriptionId } = body;

  if (!memberId || !amount || !date) {
    throw createError({ statusCode: 400, statusMessage: "Member, amount, and date are required" });
  }

  const newAmount = Number(amount);

  // Validate against fully-paid subscriptions
  if (subscriptionId) {
    const subRows = await db
      .select()
      .from(schema.memberSubscriptions)
      .where(and(
        eq(schema.memberSubscriptions.id, Number(subscriptionId)),
        eq(schema.memberSubscriptions.orgId, access.orgId),
      ))
      .limit(1);

    const sub = subRows[0];
    if (!sub) {
      throw createError({ statusCode: 404, statusMessage: "Subscription not found" });
    }

    // Get total already paid for this subscription
    const [paidResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${schema.payments.amount}), 0)` })
      .from(schema.payments)
      .where(and(
        eq(schema.payments.subscriptionId, Number(subscriptionId)),
        eq(schema.payments.orgId, access.orgId),
      ));

    const totalPaid = paidResult.total;
    if (totalPaid >= sub.amount) {
      throw createError({ statusCode: 400, statusMessage: "This subscription is already fully paid" });
    }
  }

  const result = await db.insert(schema.payments).values({
    orgId: access.orgId,
    memberId: Number(memberId),
    amount: newAmount,
    date,
    method: method || "cash",
    notes: notes || null,
    subscriptionId: subscriptionId ? Number(subscriptionId) : null,
  }).returning();

  // Update subscription payment status if linked
  if (subscriptionId) {
    const subRows = await db
      .select()
      .from(schema.memberSubscriptions)
      .where(and(
        eq(schema.memberSubscriptions.id, Number(subscriptionId)),
        eq(schema.memberSubscriptions.orgId, access.orgId),
      ))
      .limit(1);

    const sub = subRows[0];
    if (sub) {
      const [paidResult] = await db
        .select({ total: sql<number>`COALESCE(SUM(${schema.payments.amount}), 0)` })
        .from(schema.payments)
        .where(and(
          eq(schema.payments.subscriptionId, Number(subscriptionId)),
          eq(schema.payments.orgId, access.orgId),
        ));

      const totalPaid = paidResult.total;
      const newStatus = totalPaid >= sub.amount ? "paid" : "partial";

      await db
        .update(schema.memberSubscriptions)
        .set({ paymentStatus: newStatus })
        .where(eq(schema.memberSubscriptions.id, Number(subscriptionId)));
    }
  }

  await invalidateCache(access.orgId);
  return { payment: result[0] };
});
