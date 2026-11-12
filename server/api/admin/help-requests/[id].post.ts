import { eq } from "drizzle-orm";

/** Mark a help-form / contact-form message as new, contacted or resolved. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: "Invalid request" });

  const body = await readBody<{ status?: string }>(event).catch(() => ({} as { status?: string }));
  const status = String(body?.status ?? "");
  if (!["new", "contacted", "resolved"].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: "Status must be new, contacted or resolved" });
  }

  const [row] = await db.update(schema.contactSubmissions).set({ status })
    .where(eq(schema.contactSubmissions.id, id)).returning({ id: schema.contactSubmissions.id });
  if (!row) throw createError({ statusCode: 404, statusMessage: "Help request not found" });

  await recordAdminAuditLog(event, "help_request_status", { metadata: { id, status } });
  return { ok: true };
});
