import { eq, and, sql } from "drizzle-orm";

// Active member count only. Used by the dashboard layout to decide how much of
// the sidebar to show, so it must stay a single cheap query.
export default defineEventHandler(async (event) => {
  const access = event.context.access;

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.members)
    .where(and(eq(schema.members.orgId, access.orgId), eq(schema.members.status, "active")));

  return { activeMembers: result?.count ?? 0 };
});
