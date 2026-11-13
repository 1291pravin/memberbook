import { and, eq } from "drizzle-orm";
import { blob, ensureBlob } from "@nuxthub/blob";

// Saves the small thumbnail for a photo uploaded before thumbnails existed.
// The browser makes it from the full photo it already downloaded.
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  }

  const form = await readFormData(event);
  const file = form.get("file");
  const photoKey = form.get("photoKey");
  if (!(file instanceof File) || file.size === 0 || typeof photoKey !== "string") {
    throw createError({ statusCode: 400, statusMessage: "No thumbnail provided" });
  }
  ensureBlob(file, { maxSize: "128KB", types: ["image/jpeg", "image/png", "image/webp"] });

  // Only for the member's current photo
  const [member] = await db
    .select({ photoKey: schema.members.photoKey })
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
    .limit(1);
  if (!member?.photoKey || member.photoKey !== photoKey) {
    throw createError({ statusCode: 409, statusMessage: "Photo has changed" });
  }

  await blob.put(memberThumbKey(photoKey), file, { contentType: file.type });
  return { ok: true };
});
