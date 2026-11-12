import { and, desc, eq, inArray } from "drizzle-orm";

/** This business's review requests (reply drafts and summaries) with their results. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const rows = await db.select().from(schema.serviceRequests)
    .where(and(eq(schema.serviceRequests.orgId, access.orgId), inArray(schema.serviceRequests.type, ["review_reply", "review_summary"])))
    .orderBy(desc(schema.serviceRequests.id)).limit(50);
  return rows.map(serializeRequest);
});
