import { desc, eq, inArray } from "drizzle-orm";

/**
 * The upload queue. `?status=pending` (or a comma list) filters; the AI loading
 * routine calls this with the admin API token.
 */
export default defineEventHandler(async (event) => {
  await requireAdminOrAiWorker(event, "uploads");
  const query = getQuery(event);
  const statuses = typeof query.status === "string" && query.status
    ? query.status.split(",").map(s => s.trim()).filter(Boolean)
    : null;

  const rows = await db
    .select({
      upload: schema.dataUploads,
      orgName: schema.organizations.name,
      orgType: schema.organizations.type,
    })
    .from(schema.dataUploads)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.dataUploads.orgId))
    .where(statuses ? inArray(schema.dataUploads.status, statuses) : undefined)
    .orderBy(desc(schema.dataUploads.id))
    .limit(100);

  return rows.map(({ upload: u, orgName, orgType }) => ({
    id: u.id,
    orgId: u.orgId,
    orgName,
    orgType,
    source: u.source,
    status: u.status,
    files: parseUploadFiles(u.files).map(({ name, type, size }) => ({ name, type, size })),
    hasText: Boolean(u.text),
    note: u.note,
    result: parseUploadResult(u.result),
    message: u.message,
    createdAt: u.createdAt,
    claimedAt: u.claimedAt,
    processedAt: u.processedAt,
  }));
});
