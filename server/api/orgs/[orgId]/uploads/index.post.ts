import { and, eq, gt, sql } from "drizzle-orm";

/** Owner sends their data once: files and/or a pasted list, plus their UPI ID. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;

  // A handful of uploads a day is plenty; this stops accidental repeat submits filling storage.
  const since = new Date(Date.now() - 86400000).toISOString();
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.dataUploads)
    .where(and(eq(schema.dataUploads.orgId, access.orgId), gt(schema.dataUploads.createdAt, since))) as [{ count: number }];
  if (Number(count) >= 10) {
    throw createError({ statusCode: 429, statusMessage: "You've sent a lot today. Message us on WhatsApp if something is missing." });
  }

  const upload = await queueUploadFromForm(event, { orgId: access.orgId, uploadedBy: access.userId, source: "owner" });
  await alertNewUpload(event, upload);
  return { id: upload.id, status: upload.status };
});
