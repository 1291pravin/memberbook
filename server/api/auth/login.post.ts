export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }

  const user = await findUserByEmail(email.toLowerCase().trim());
  if (!user || !user.passwordHash) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
});
