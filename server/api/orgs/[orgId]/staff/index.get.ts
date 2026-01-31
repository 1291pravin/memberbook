import { eq } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const staff = await db
    .select({
      id: schema.orgMemberships.id,
      userId: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.orgMemberships.role,
    })
    .from(schema.orgMemberships)
    .innerJoin(schema.users, eq(schema.orgMemberships.userId, schema.users.id))
    .where(eq(schema.orgMemberships.orgId, access.orgId));

  return { staff };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "staff"),
});
