import { eq } from "drizzle-orm";

/** Give up on an upload, with a message the owner sees (what to send instead). */
export default defineEventHandler(async (event) => {
  await requireAdminOrAiWorker(event, "uploads");
  const upload = await getUploadOr404(event);
  const body = await readBody<{ message?: string }>(event);
  const message = String(body?.message || "").trim().slice(0, 500);
  if (!message) throw createError({ statusCode: 400, statusMessage: "Say what went wrong, for the owner" });

  await db.update(schema.dataUploads)
    .set({ status: "failed", message, processedAt: new Date().toISOString() })
    .where(eq(schema.dataUploads.id, upload.id));
  return { ok: true };
});
