import { and, eq, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const memberId = Number(body.memberId);
  const amount = parsePaymentAmount(body.amount);

  if (!Number.isInteger(memberId) || memberId <= 0 || !amount || !isIsoDate(body.date)) {
    throw createError({ statusCode: 400, statusMessage: "Member, positive amount, and valid date are required" });
  }
  if (body.method !== undefined && !isPaymentMethod(body.method)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid payment method" });
  }

  const [member] = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
    .limit(1);
  if (!member) throw createError({ statusCode: 404, statusMessage: "Member not found" });

  const subscription = body.subscriptionId ? await getPaymentSubscription(body.subscriptionId, memberId, access.orgId) : null;
  if (body.subscriptionId && !subscription) {
    throw createError({ statusCode: 400, statusMessage: "Subscription does not belong to this member" });
  }
  if (subscription) {
    const totalPaid = await getSubscriptionPaidTotal(subscription.id, access.orgId);
    if (totalPaid + amount > subscription.amount) {
      throw createError({ statusCode: 400, statusMessage: "Payment exceeds the remaining subscription balance" });
    }
  }

  const values = {
    orgId: access.orgId,
    memberId,
    amount,
    date: body.date,
    method: body.method || "cash",
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    subscriptionId: subscription?.id ?? null,
  };

  let payment: typeof schema.payments.$inferSelect | undefined;
  if (subscription) {
    // Re-check the balance inside the insert itself, so two payments recorded
    // at the same moment can't together go over the subscription amount.
    const now = new Date().toISOString();
    const inserted = await db.all<{ id: number }>(sql`
      INSERT INTO payments (org_id, member_id, subscription_id, amount, method, date, notes, created_at)
      SELECT ${values.orgId}, ${values.memberId}, ${subscription.id}, ${values.amount},
        ${values.method}, ${values.date}, ${values.notes}, ${now}
      WHERE (
        SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE subscription_id = ${subscription.id} AND org_id = ${access.orgId}
      ) + ${values.amount} <= ${subscription.amount}
      RETURNING id
    `);
    if (!inserted[0]) {
      throw createError({ statusCode: 400, statusMessage: "Payment exceeds the remaining subscription balance" });
    }
    [payment] = await db.select().from(schema.payments).where(eq(schema.payments.id, inserted[0].id)).limit(1);
  } else {
    [payment] = await db.insert(schema.payments).values(values).returning();
  }

  await recalculateSubscriptionPaymentStatus(payment!.subscriptionId, access.orgId);
  queueThankYouReceipt(event, access.orgId, payment!.id);
  return { payment };
});
