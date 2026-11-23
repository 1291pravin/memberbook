/** Save the business's Google review link. Body: { googleReviewUrl }. Owner only. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  if (!(await isReviewPosterActive(access.orgId))) {
    throw createError({ statusCode: 403, statusMessage: "Switch on the Google review poster first" });
  }
  const body = await readBody<{ googleReviewUrl?: string }>(event);
  const result = normaliseGoogleReviewUrl(String(body?.googleReviewUrl ?? ""));
  if ("error" in result) throw createError({ statusCode: 400, statusMessage: result.error });
  await saveGoogleReviewUrl(access.orgId, result.url);
  return { ok: true, googleReviewUrl: result.url };
});
