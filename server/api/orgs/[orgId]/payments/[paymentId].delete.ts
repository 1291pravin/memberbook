import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const paymentId = Number(getRouterParam(event, "paymentId"));

  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid payment ID" });
  }

  const [payment] = await db.select().from(schema.payments).where(and(
    eq(schema.payments.id, paymentId),
    eq(schema.payments.orgId, access.orgId),
  )).limit(1);
  if (!payment) throw createError({ statusCode: 404, statusMessage: "Payment not found" });

  await db.delete(schema.payments).where(and(eq(schema.payments.id, paymentId), eq(schema.payments.orgId, access.orgId)));
  await recalculateSubscriptionPaymentStatus(payment.subscriptionId, access.orgId);
  return { success: true };
});
