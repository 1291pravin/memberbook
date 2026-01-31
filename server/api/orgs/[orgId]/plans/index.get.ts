import { eq } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const plans = await db
    .select()
    .from(schema.subscriptionPlans)
    .where(eq(schema.subscriptionPlans.orgId, access.orgId))
    .orderBy(schema.subscriptionPlans.name);
  return { plans };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "plans"),
});
