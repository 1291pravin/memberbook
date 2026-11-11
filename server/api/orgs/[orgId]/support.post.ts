import { eq } from "drizzle-orm";

// In-app help form. Stored with the public contact form submissions so the
// admin page shows both in one list (source_page tells them apart).
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const session = await requireUserSession(event);
  const body = await readBody(event);

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 30) : "";

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Please tell us what you need help with" });
  }
  if (message.length > 5000) {
    throw createError({ statusCode: 400, statusMessage: "Message is too long" });
  }

  await enforceRateLimit(`support:user:${session.user.id}`, { limit: 10, windowSeconds: 3600 });

  const [org] = await db
    .select({ name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  const inserted = await db.insert(schema.contactSubmissions).values({
    name: session.user.name,
    phone,
    email: session.user.email,
    businessName: org?.name ?? `Org ${access.orgId}`,
    message,
    sourcePage: "/dashboard/help",
  }).returning({ id: schema.contactSubmissions.id });

  return { ok: true, id: inserted[0]?.id };
});
