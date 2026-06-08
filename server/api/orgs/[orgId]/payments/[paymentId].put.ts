import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const paymentId = Number(getRouterParam(event, "paymentId"));
  const body = await readBody(event);

  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid payment ID" });
  }

  const [payment] = await db.select().from(schema.payments).where(and(
    eq(schema.payments.id, paymentId),
    eq(schema.payments.orgId, access.orgId),
  )).limit(1);
  if (!payment) throw createError({ statusCode: 404, statusMessage: "Payment not found" });

  const amount = body.amount === undefined ? payment.amount : parsePaymentAmount(body.amount);
  const date = body.date === undefined ? payment.date : body.date;
  const method = body.method === undefined ? payment.method : body.method;
  if (!amount) throw createError({ statusCode: 400, statusMessage: "Amount must be a positive number of paise" });
  if (!isIsoDate(date)) throw createError({ statusCode: 400, statusMessage: "A valid date is required" });
  if (!isPaymentMethod(method)) throw createError({ statusCode: 400, statusMessage: "Invalid payment method" });

  let subscriptionId = payment.subscriptionId;
  if (Object.prototype.hasOwnProperty.call(body, "subscriptionId")) {
    subscriptionId = body.subscriptionId ? Number(body.subscriptionId) : null;
  }
  const subscription = subscriptionId ? await getPaymentSubscription(subscriptionId, payment.memberId, access.orgId) : null;
  if (subscriptionId && !subscription) {
    throw createError({ statusCode: 400, statusMessage: "Subscription does not belong to this member" });
  }
  if (subscription) {
    const otherPayments = await getSubscriptionPaidTotal(subscription.id, access.orgId, paymentId);
    if (otherPayments + amount > subscription.amount) {
      throw createError({ statusCode: 400, statusMessage: "Payment exceeds the remaining subscription balance" });
    }
  }

  const [updatedPayment] = await db.update(schema.payments).set({
    amount,
    date,
    method,
    notes: body.notes === undefined ? payment.notes : typeof body.notes === "string" ? body.notes.trim() || null : null,
    subscriptionId: subscription?.id ?? null,
  }).where(and(eq(schema.payments.id, paymentId), eq(schema.payments.orgId, access.orgId))).returning();

  await recalculateSubscriptionPaymentStatus(payment.subscriptionId, access.orgId);
  if (updatedPayment.subscriptionId !== payment.subscriptionId) {
    await recalculateSubscriptionPaymentStatus(updatedPayment.subscriptionId, access.orgId);
  }
  await invalidateCache(access.orgId);
  return { payment: updatedPayment };
});
