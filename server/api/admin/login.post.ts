type AdminLoginBody = {
  password?: string;
};

export default defineEventHandler(async (event) => {
  const passwords = getConfiguredAdminPasswords(event);
  if (!passwords.length) {
    throw createError({
      statusCode: 500,
      statusMessage: "Admin password is not configured",
    });
  }

  const body = await readBody<AdminLoginBody>(event);
  const password = body.password || "";

  if (!isValidAdminPassword(event, password)) {
    await recordAdminAuditLog(event, "admin_login_failed", {
      metadata: { reason: "invalid_password" },
    });
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid admin password",
    });
  }

  const session = await getUserSession(event);
  await setUserSession(event, {
    ...session,
    admin: {
      authenticated: true,
      loggedInAt: new Date().toISOString(),
    },
  });

  await recordAdminAuditLog(event, "admin_login");

  return { success: true };
});
