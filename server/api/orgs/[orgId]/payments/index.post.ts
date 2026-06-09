import { and, eq } from "drizzle-orm";

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

  const [payment] = await db.insert(schema.payments).values({
    orgId: access.orgId,
    memberId,
    amount,
    date: body.date,
    method: body.method || "cash",
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
    subscriptionId: subscription?.id ?? null,
  }).returning();

  await recalculateSubscriptionPaymentStatus(payment.subscriptionId, access.orgId);
  return { payment };
});
