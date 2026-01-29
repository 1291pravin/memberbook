export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password, name } = body;

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, statusMessage: "Email, password, and name are required" });
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 6 characters" });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const result = await db.insert(schema.users).values({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
  }).returning();

  const user = result[0];
  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
});
