import { eq } from "drizzle-orm";

/** Give up on a request, with a message the owner sees (what to send instead). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const req = await getServiceRequestOr404(event);
  const body = await readBody<{ message?: string }>(event);
  const message = String(body?.message || "").trim().slice(0, 500);
  if (!message) throw createError({ statusCode: 400, statusMessage: "Say what went wrong, for the owner" });
  await db.update(schema.serviceRequests).set({ status: "failed", message, updatedAt: new Date().toISOString() })
    .where(eq(schema.serviceRequests.id, req.id));
  return { ok: true };
});
