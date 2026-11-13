import { and, eq } from "drizzle-orm";
import { blob } from "@nuxthub/blob";

// Photos are requested with ?v=<photo key> (and ?size=thumb for the small one).
// The key is unique per upload, so the response can be cached by the browser
// for good, and we can skip the database: the org-access middleware has
// already checked the user belongs to this org, and keys are created under
// members/<orgId>/<memberId>-..., so a key for another org is refused.
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  }
  const query = getQuery(event);
  const wantThumb = query.size === "thumb";

  let photoKey = typeof query.v === "string" && query.v ? query.v : null;
  if (photoKey && !isMemberPhotoKey(photoKey, access.orgId, memberId)) {
    throw createError({ statusCode: 404, statusMessage: "No photo" });
  }
  const versioned = !!photoKey;
  if (!photoKey) {
    const [member] = await db
      .select({ photoKey: schema.members.photoKey })
      .from(schema.members)
      .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
      .limit(1);
    photoKey = member?.photoKey ?? null;
  }
  if (!photoKey) {
    throw createError({ statusCode: 404, statusMessage: "No photo" });
  }

  let file = wantThumb ? await blob.get(memberThumbKey(photoKey)) : null;
  const isFallback = wantThumb && !file;
  if (!file) file = await blob.get(photoKey);
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: "No photo" });
  }

  // Private: photos are member data, only for the signed-in business.
  // A thumbnail request that fell back to the full photo (older uploads) is
  // not cached, so the page picks up the thumbnail once it has been made.
  setHeader(event, "Cache-Control", versioned && !isFallback
    ? "private, max-age=31536000, immutable"
    : "private, no-cache");
  setHeader(event, "Content-Type", file.type || "image/webp");
  if (isFallback) setHeader(event, "X-Photo-Thumb", "missing");
  return new Uint8Array(await file.arrayBuffer());
});
