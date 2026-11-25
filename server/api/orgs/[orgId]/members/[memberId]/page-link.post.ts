// The member's own page link (/m/<token>), made the first time it's asked for.
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  const token = await ensureMemberPortalToken(access.orgId, memberId);
  if (!token) throw createError({ statusCode: 404, statusMessage: "Member not found" });
  return { url: memberPageUrl(token) };
});
