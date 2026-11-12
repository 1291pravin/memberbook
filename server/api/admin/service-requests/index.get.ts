import { desc, eq, inArray } from "drizzle-orm";

/**
 * The add-on work queue. `?status=new` (or a comma list) filters. The delivery
 * routine calls this with the admin API token.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const query = getQuery(event);
  const statuses = typeof query.status === "string" && query.status
    ? query.status.split(",").map(s => s.trim()).filter(Boolean)
    : null;

  const rows = await db.select({ req: schema.serviceRequests, orgName: schema.organizations.name, orgType: schema.organizations.type })
    .from(schema.serviceRequests)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.serviceRequests.orgId))
    .where(statuses ? inArray(schema.serviceRequests.status, statuses) : undefined)
    .orderBy(desc(schema.serviceRequests.id))
    .limit(100);

  return rows.map(({ req, orgName, orgType }) => ({ ...serializeRequest(req), orgName, orgType }));
});
