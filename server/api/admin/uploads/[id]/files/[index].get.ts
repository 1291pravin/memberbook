import { blob } from "@nuxthub/blob";

/** Download one file of an upload. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const upload = await getUploadOr404(event);
  const index = Number(getRouterParam(event, "index"));
  const file = parseUploadFiles(upload.files)[index];
  if (!Number.isInteger(index) || !file) {
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "Content-Disposition", `attachment; filename="${file.name.replace(/[^\w.\- ]+/g, "_")}"`);
  return blob.serve(event, file.key);
});
