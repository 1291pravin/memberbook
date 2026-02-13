import { eq, and } from "drizzle-orm";
import { normalizePhone, validatePhone } from "~~/shared/utils/phone";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const { name, phone, email, gender, notes, planId, startDate, payment } = body;

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }

  // Validate phone if provided
  if (phone) {
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      throw createError({ statusCode: 400, statusMessage: phoneErr });
    }
  }

  const normalizedPhone = phone ? normalizePhone(phone) : null;

  const result = await db.insert(schema.members).values({
    orgId: access.orgId,
    name: name.trim(),
    phone: normalizedPhone,
    email: email?.trim() || null,
    gender: gender || null,
    notes: notes?.trim() || null,
  }).returning();

  const member = result[0];
  await invalidateCache(access.orgId, "members");

  // If planId provided, create subscription
  if (planId && startDate) {
    const plans = await db
      .select()
      .from(schema.subscriptionPlans)
      .where(and(eq(schema.subscriptionPlans.id, Number(planId)), eq(schema.subscriptionPlans.orgId, access.orgId)))
      .limit(1);

    const plan = plans[0];
    if (plan) {
      const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);

      let paymentStatus = "unpaid";
      if (payment?.amount) {
        paymentStatus = payment.amount >= plan.price ? "paid" : "partial";
      }

      const subResult = await db.insert(schema.memberSubscriptions).values({
        orgId: access.orgId,
        memberId: member.id,
        planId: plan.id,
        startDate,
        endDate,
        amount: plan.price,
        autoRenew: true,
        paymentStatus,
      }).returning();

      const subscription = subResult[0];

      // Record payment if provided
      if (payment?.amount) {
        await db.insert(schema.payments).values({
          orgId: access.orgId,
          memberId: member.id,
          amount: Number(payment.amount),
          date: payment.date || startDate,
          method: payment.method || "cash",
          notes: payment.notes || null,
          subscriptionId: subscription.id,
        });
        await invalidateCache(access.orgId, "payments");
      }

      await invalidateCache(access.orgId, "subscriptions");
    }
  }

  return { member };
});
