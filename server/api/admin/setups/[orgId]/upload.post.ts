import { eq } from "drizzle-orm";

/** Queue data for a business from admin, e.g. register photos the owner sent on WhatsApp. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const orgId = Number(getRouterParam(event, "orgId"));
  const [org] = Number.isInteger(orgId)
    ? await db.select({ id: schema.organizations.id }).from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1)
    : [];
  if (!org) throw createError({ statusCode: 404, statusMessage: "Business not found" });

  const upload = await queueUploadFromForm(event, { orgId, uploadedBy: null, source: "admin" });
  await recordAdminAuditLog(event, "data_upload_added", { targetOrgId: orgId, metadata: { uploadId: upload.id } });
  return { id: upload.id, status: upload.status };
});
