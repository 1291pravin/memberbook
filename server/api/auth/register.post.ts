export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password, name } = body;

  if (!email || !password || !name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email, password, and name are required",
    });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Please enter a valid email address",
    });
  }
  await enforceRateLimit(`register:ip:${getClientIp(event)}`, { limit: 10, windowSeconds: 3600 });

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must be at least 6 characters",
    });
  }

  // Look up with the same normalization used for the insert, so "A@x.com"
  // is caught as a duplicate of "a@x.com" instead of failing the unique index.
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email already registered",
    });
  }

  const passwordHash = await hashPassword(password);
  const attribution = await signupAttribution(event);
  const result = await db
    .insert(schema.users)
    .values({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      ...attribution,
    })
    .returning();

  const user = result[0];
  const previous = await getUserSession(event);
  await replaceUserSession(event, {
    admin: previous.admin,
    user: { id: user.id, email: user.email, name: user.name },
    sessionVersion: user.sessionVersion,
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
});
