import { eq } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const rows = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  return { org: rows[0], role: access.role };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "org"),
});
