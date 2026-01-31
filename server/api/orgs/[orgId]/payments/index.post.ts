export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const { memberId, amount, date, method, notes, subscriptionId } = body;

  if (!memberId || !amount || !date) {
    throw createError({ statusCode: 400, statusMessage: "Member, amount, and date are required" });
  }

  const result = await db.insert(schema.payments).values({
    orgId: access.orgId,
    memberId: Number(memberId),
    amount: Number(amount),
    date,
    method: method || "cash",
    notes: notes || null,
    subscriptionId: subscriptionId ? Number(subscriptionId) : null,
  }).returning();

  await invalidateCache(access.orgId, "payments");
  return { payment: result[0] };
});
