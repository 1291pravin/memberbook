export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  await setUserSession(event, {
    user: session.user,
    currentOrg: session.currentOrg,
    admin: undefined,
  });

  await recordAdminAuditLog(event, "admin_logout");

  return { success: true };
});
