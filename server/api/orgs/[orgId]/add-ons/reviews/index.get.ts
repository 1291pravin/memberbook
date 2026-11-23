/** Review poster settings: the saved Google link, the poster's short link and scan counts. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const active = await isReviewPosterActive(access.orgId);
  if (!active) return { active: false };
  const [org, scans] = await Promise.all([getReviewSettings(access.orgId), getReviewScanStats(access.orgId)]);
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in");
  const token = org?.googleReviewUrl ? org.reviewToken : null;
  return {
    active: true,
    googleReviewUrl: org?.googleReviewUrl ?? null,
    token,
    shortUrl: token ? reviewShortUrl(appUrl, token) : null,
    whatsappUrl: token ? reviewShortUrl(appUrl, token, "wa") : null,
    posterUrl: token ? `${appUrl.replace(/\/$/, "")}/review-poster/${token}` : null,
    scans,
  };
});
