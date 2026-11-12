import { desc, eq } from "drizzle-orm";

/** The owner's uploads and what we loaded from each. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const rows = await db.select().from(schema.dataUploads)
    .where(eq(schema.dataUploads.orgId, access.orgId))
    .orderBy(desc(schema.dataUploads.id))
    .limit(20);

  return rows.map(r => ({
    id: r.id,
    status: r.status,
    files: parseUploadFiles(r.files).map(f => f.name),
    hasText: Boolean(r.text),
    result: parseUploadResult(r.result),
    message: r.message,
    createdAt: r.createdAt,
    processedAt: r.processedAt,
  }));
});
