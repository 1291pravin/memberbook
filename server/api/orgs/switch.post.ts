export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const { orgId } = await readBody<{ orgId: number }>(event);

  if (!orgId) {
    throw createError({
      statusCode: 400,
      statusMessage: "orgId is required",
    });
  }

  const orgs = await getUserOrgs(user.id);
  const targetOrg = orgs.find(o => o.orgId === orgId);

  if (!targetOrg) {
    throw createError({
      statusCode: 403,
      statusMessage: "You do not belong to this organization",
    });
  }

  const session = await getUserSession(event);
  await replaceUserSession(event, {
    ...session,
    currentOrg: targetOrg,
  });

  return { success: true, currentOrg: targetOrg };
});
