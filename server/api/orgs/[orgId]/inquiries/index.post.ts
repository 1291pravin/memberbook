export default defineEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const body = await readBody(event);
  const { name, phone, email, interest, followUpDate, notes } = body;

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Name is required" });
  }

  const result = await db.insert(schema.inquiries).values({
    orgId: access.orgId,
    name: name.trim(),
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    interest: interest?.trim() || null,
    followUpDate: followUpDate || null,
    notes: notes?.trim() || null,
  }).returning();

  await invalidateCache(access.orgId, "inquiries");
  return { inquiry: result[0] };
});
