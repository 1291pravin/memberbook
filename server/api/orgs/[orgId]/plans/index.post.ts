export default defineEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const body = await readBody(event);
  const { name, price, durationDays } = body;

  if (!name || !price || !durationDays) {
    throw createError({ statusCode: 400, statusMessage: "Name, price, and duration are required" });
  }

  const result = await db.insert(schema.subscriptionPlans).values({
    orgId: access.orgId,
    name: name.trim(),
    price: Number(price),
    durationDays: Number(durationDays),
  }).returning();

  await invalidateCache(access.orgId, "plans");
  return { plan: result[0] };
});
