import { eq } from "drizzle-orm";

/** Add a note about a business (a call, a promise, context for later). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const orgId = readOrgIdParam(event);
  const body = await readBody<{ body?: string }>(event).catch(() => ({} as { body?: string }));
  const text = String(body?.body ?? "").trim().slice(0, 2000);
  if (!text) throw createError({ statusCode: 400, statusMessage: "Write a note first" });

  const [org] = await db.select({ id: schema.organizations.id }).from(schema.organizations)
    .where(eq(schema.organizations.id, orgId)).limit(1);
  if (!org) throw createError({ statusCode: 404, statusMessage: "Business not found" });

  const [note] = await db.insert(schema.adminOrgNotes).values({ orgId, body: text }).returning();
  return { id: note!.id, body: note!.body, createdAt: note!.createdAt };
});
