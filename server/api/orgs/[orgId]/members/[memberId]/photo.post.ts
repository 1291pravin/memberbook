import { and, eq } from "drizzle-orm";
import { blob, ensureBlob } from "@nuxthub/blob";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  }

  const [member] = await db
    .select({ id: schema.members.id, photoKey: schema.members.photoKey })
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
    .limit(1);

  if (!member) {
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  }

  const form = await readFormData(event);
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw createError({ statusCode: 400, statusMessage: "No image file provided" });
  }

  // Validate type + size (client resizes to webp, but accept common image types too)
  ensureBlob(file, {
    maxSize: "2MB",
    types: ["image/jpeg", "image/png", "image/webp"],
  });

  // Upload under a per-org/per-member prefix; random suffix busts CDN/browser cache on replace
  const uploaded = await blob.put(`members/${access.orgId}/${memberId}`, file, {
    addRandomSuffix: true,
    contentType: file.type,
  });

  await db
    .update(schema.members)
    .set({ photoKey: uploaded.pathname })
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)));

  // Remove the previous photo after the new one is committed
  if (member.photoKey && member.photoKey !== uploaded.pathname) {
    try {
      await blob.del(member.photoKey);
    } catch {
      // Old object already gone — ignore
    }
  }

  return { photoKey: uploaded.pathname };
});
