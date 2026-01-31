import { eq, and, like, or } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const query = getQuery(event);
  const search = query.search as string | undefined;
  const status = query.status as string | undefined;

  const conditions = [eq(schema.members.orgId, access.orgId)];

  if (status && status !== "all") {
    conditions.push(eq(schema.members.status, status));
  }

  if (search) {
    conditions.push(
      or(
        like(schema.members.name, `%${search}%`),
        like(schema.members.phone, `%${search}%`),
      )!,
    );
  }

  const memberList = await db
    .select()
    .from(schema.members)
    .where(and(...conditions))
    .orderBy(schema.members.name);

  return { members: memberList };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "members"),
});
