import { eq, and, count } from "drizzle-orm";
import { normalizePhone, validatePhone } from "~~/shared/utils/phone";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const { name, phone, email, gender, notes, fatherName, address, batch, planId, startDate, payment } = body;

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

  if (gender && !["male", "female", "other"].includes(gender)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid gender" });
  }

  // Validate the plan and the optional first payment before inserting
  // anything, so a bad request can't leave a half-created member behind.
  let plan: typeof schema.subscriptionPlans.$inferSelect | undefined;
  let paymentAmount: number | null = null;
  if (planId) {
    if (!isIsoDate(startDate)) {
      throw createError({ statusCode: 400, statusMessage: "A valid start date is required with a plan" });
    }
    [plan] = await db
      .select()
      .from(schema.subscriptionPlans)
      .where(and(eq(schema.subscriptionPlans.id, Number(planId)), eq(schema.subscriptionPlans.orgId, access.orgId)))
      .limit(1);
    if (!plan) {
      throw createError({ statusCode: 404, statusMessage: "Plan not found" });
    }

    if (payment?.amount !== undefined && payment?.amount !== null && payment?.amount !== "" && payment?.amount !== 0) {
      paymentAmount = parsePaymentAmount(payment.amount);
      if (!paymentAmount) {
        throw createError({ statusCode: 400, statusMessage: "Payment amount must be a positive number of paise" });
      }
      if (paymentAmount > plan.price) {
        throw createError({ statusCode: 400, statusMessage: "Payment exceeds the subscription amount" });
      }
      if (payment.method !== undefined && !isPaymentMethod(payment.method)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid payment method" });
      }
      if (payment.date !== undefined && payment.date !== "" && !isIsoDate(payment.date)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid payment date" });
      }
    }
  }

  const result = await db.insert(schema.members).values({
    orgId: access.orgId,
    name: name.trim(),
    phone: normalizedPhone,
    email: email?.trim() || null,
    gender: gender || null,
    notes: notes?.trim() || null,
    fatherName: fatherName?.trim() || null,
    address: address?.trim() || null,
    batch: batch?.trim() || null,
  }).returning();

  const member = result[0];

  // If planId provided, create subscription
  let subscriptionInfo: { planName: string; endDate: string } | null = null;
  if (plan) {
    const endDate = calculateEndDate(startDate, plan.durationType, plan.durationValue);

    let paymentStatus = "unpaid";
    if (paymentAmount) {
      paymentStatus = paymentAmount >= plan.price ? "paid" : "partial";
    }

    subscriptionInfo = { planName: plan.name, endDate };

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
    if (paymentAmount) {
      const [p] = await db.insert(schema.payments).values({
        orgId: access.orgId,
        memberId: member.id,
        amount: paymentAmount,
        date: payment.date || startDate,
        method: payment.method || "cash",
        notes: typeof payment.notes === "string" ? payment.notes.trim() || null : null,
        subscriptionId: subscription.id,
      }).returning({ id: schema.payments.id });
      queueThankYouReceipt(event, access.orgId, p?.id);
    }

  }

  // Return total member count so frontend can detect first member
  const memberCount = await db.select({ count: count() }).from(schema.members).where(eq(schema.members.orgId, access.orgId));
  const totalMembers = memberCount[0]?.count ?? 0;

  return { member, totalMembers, subscription: subscriptionInfo };
});
