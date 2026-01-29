export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readBody(event);
  const { name, type } = body;

  if (!name || !type) {
    throw createError({ statusCode: 400, statusMessage: "Name and type are required" });
  }

  const validTypes = ["gym", "library", "tuition", "other"];
  if (!validTypes.includes(type)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid organization type" });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);

  const orgResult = await db.insert(schema.organizations).values({
    name: name.trim(),
    slug,
    type,
  }).returning();

  const org = orgResult[0];

  await db.insert(schema.orgMemberships).values({
    userId: user.id,
    orgId: org.id,
    role: "owner",
  });

  return { org };
});
