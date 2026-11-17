import { and, eq } from "drizzle-orm";
import { blob } from "@nuxthub/blob";

/** For the AI task: download a photo or file this contact sent. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const id = Number(getRouterParam(event, "messageId"));
  if (!phone || !Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: "Invalid request" });
  const [row] = await db.select({ media: schema.whatsappMessages.media }).from(schema.whatsappMessages)
    .where(and(eq(schema.whatsappMessages.id, id), eq(schema.whatsappMessages.phone, phone))).limit(1);
  const media = row?.media ? JSON.parse(row.media) as { key?: string; name?: string } : null;
  if (!media?.key) throw createError({ statusCode: 404, statusMessage: "No saved file in that message" });
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "Content-Disposition", `attachment; filename="${String(media.name ?? "file").replace(/[^\w.\- ]+/g, "_")}"`);
  return blob.serve(event, media.key);
});
