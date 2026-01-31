export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);
  const { name, phone, email, notes } = body;

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }

  const result = await db.insert(schema.members).values({
    orgId: access.orgId,
    name: name.trim(),
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    notes: notes?.trim() || null,
  }).returning();

  await invalidateCache(access.orgId, "members");
  return { member: result[0] };
});
