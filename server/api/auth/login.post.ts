export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email and password are required",
    });
  }

  const user = await findUserByEmail(email.toLowerCase().trim());
  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  const hashedPassword = await hashPassword(password);

  const valid = await verifyPassword(hashedPassword, password);
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid email or password",
    });
  }

  const orgs = await getUserOrgs(user.id);
  const currentOrg = orgs.length > 0 ? orgs[0] : undefined;

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
    currentOrg,
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
});
