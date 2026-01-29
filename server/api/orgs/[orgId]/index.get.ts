import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const rows = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  return { org: rows[0], role: access.role };
});
