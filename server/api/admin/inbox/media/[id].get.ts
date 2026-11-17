import { blob } from "@nuxthub/blob";
import { eq } from "drizzle-orm";

/** Open a photo/file someone sent to the MemberBook WhatsApp number. ?download=1 saves it. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id)) throw createError({ statusCode: 400, statusMessage: "Invalid id" });

  const [row] = await db.select({ media: schema.whatsappMessages.media })
    .from(schema.whatsappMessages)
    .where(eq(schema.whatsappMessages.id, id))
    .limit(1);
  let file: { key?: string; name?: string } | null = null;
  try {
    file = row?.media ? JSON.parse(row.media) : null;
  }
  catch { /* ignore */ }
  if (!file?.key) throw createError({ statusCode: 404, statusMessage: "File not found" });

  setHeader(event, "Cache-Control", "private, no-store");
  if (getQuery(event).download) {
    setHeader(event, "Content-Disposition", `attachment; filename="${String(file.name ?? "file").replace(/[^\w.\- ]+/g, "_")}"`);
  }
  return blob.serve(event, file.key);
});
