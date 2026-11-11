export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email and password are required",
    });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const ip = getClientIp(event);
  await enforceRateLimit(`login:ip:${ip}`, { limit: 20, windowSeconds: 900 });
  await enforceRateLimit(`login:email:${normalizedEmail}`, { limit: 10, windowSeconds: 900 });

  const user = await findUserByEmail(normalizedEmail);
  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  const orgs = await getUserOrgs(user.id);
  const currentOrg = orgs.length > 0 ? orgs[0] : undefined;

  // Replace (not merge) so nothing from a previous user's session survives.
  const previous = await getUserSession(event);
  await replaceUserSession(event, {
    admin: previous.admin,
    user: { id: user.id, email: user.email, name: user.name },
    currentOrg,
    sessionVersion: user.sessionVersion,
  });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    orgCount: orgs.length,
  };
});
