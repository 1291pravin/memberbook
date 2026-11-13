import { and, eq, isNull, lt, or } from "drizzle-orm";

/**
 * Mark an upload as being processed, so two runs never load it twice. A claim
 * older than two hours counts as abandoned and can be taken again.
 */
export default defineEventHandler(async (event) => {
  await requireAdminOrAiWorker(event, "uploads");
  const upload = await getUploadOr404(event);
  const now = new Date().toISOString();
  const stale = new Date(Date.now() - 2 * 3600000).toISOString();

  const updated = await db.update(schema.dataUploads)
    .set({ status: "processing", claimedAt: now })
    .where(and(
      eq(schema.dataUploads.id, upload.id),
      or(
        eq(schema.dataUploads.status, "pending"),
        and(eq(schema.dataUploads.status, "processing"), or(isNull(schema.dataUploads.claimedAt), lt(schema.dataUploads.claimedAt, stale))),
      ),
    ))
    .returning({ id: schema.dataUploads.id });

  if (!updated.length) {
    throw createError({ statusCode: 409, statusMessage: `Upload is ${upload.status}, not pending` });
  }
  return { ok: true };
});
