import { eq } from "drizzle-orm";
import { blob } from "@nuxthub/blob";

/** Add a logo or photos for the website (multipart: files[], kind=logo|photo). */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const site = await ensureWebsite(access.orgId);
  const form = await readFormData(event);
  const kind = form.get("kind") === "logo" ? "logo" : "photo";
  const incoming = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!incoming.length) throw createError({ statusCode: 400, statusMessage: "Choose a photo" });

  let files = parseJson<WebsiteFile[]>(site.files, []);
  for (const file of incoming) {
    if (!WEBSITE_IMAGE_TYPES[file.type]) {
      throw createError({ statusCode: 400, statusMessage: `"${file.name}" isn't a photo. Use JPG, PNG or WebP.` });
    }
    if (file.size > MAX_WEBSITE_FILE_BYTES) {
      throw createError({ statusCode: 400, statusMessage: `"${file.name}" is bigger than 8 MB` });
    }
  }
  if (kind === "photo" && files.filter(f => f.kind === "photo").length + incoming.length > MAX_WEBSITE_PHOTOS) {
    throw createError({ statusCode: 400, statusMessage: `Up to ${MAX_WEBSITE_PHOTOS} photos. Remove some first.` });
  }

  // One logo: a new one replaces the old.
  if (kind === "logo") files = files.filter(f => f.kind !== "logo");

  for (const file of kind === "logo" ? incoming.slice(0, 1) : incoming) {
    const saved = await blob.put(`websites/${access.orgId}/${kind}-${Date.now()}.${WEBSITE_IMAGE_TYPES[file.type]}`, file, {
      addRandomSuffix: true,
      contentType: file.type,
    });
    files.push({ key: saved.pathname, name: file.name.slice(0, 200), type: file.type, size: file.size, kind });
  }

  await db.update(schema.orgWebsites)
    .set({ files: JSON.stringify(files), updatedAt: new Date().toISOString() })
    .where(eq(schema.orgWebsites.orgId, access.orgId));
  return { count: files.length };
});
