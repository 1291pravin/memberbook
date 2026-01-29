import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const query = getQuery(event);
  const status = query.status as string | undefined;

  const conditions = [eq(schema.inquiries.orgId, access.orgId)];
  if (status && status !== "all") {
    conditions.push(eq(schema.inquiries.status, status));
  }

  const inquiryList = await db
    .select()
    .from(schema.inquiries)
    .where(and(...conditions))
    .orderBy(schema.inquiries.createdAt);

  return { inquiries: inquiryList };
});
