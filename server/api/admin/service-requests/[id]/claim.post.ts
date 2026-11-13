import { and, eq, isNull, lt, or } from "drizzle-orm";

/** Mark a request as being worked on. A claim older than two hours counts as abandoned. */
export default defineEventHandler(async (event) => {
  await requireAdminOrAiWorker(event, "services");
  const req = await getServiceRequestOr404(event);
  const now = new Date().toISOString();
  const stale = new Date(Date.now() - 2 * 3600000).toISOString();
  const updated = await db.update(schema.serviceRequests)
    .set({ status: "working", claimedAt: now, updatedAt: now })
    .where(and(
      eq(schema.serviceRequests.id, req.id),
      or(
        eq(schema.serviceRequests.status, "new"),
        and(eq(schema.serviceRequests.status, "working"), or(isNull(schema.serviceRequests.claimedAt), lt(schema.serviceRequests.claimedAt, stale))),
      ),
    ))
    .returning({ id: schema.serviceRequests.id });
  if (!updated.length) throw createError({ statusCode: 409, statusMessage: `Request is ${req.status}, not new` });
  return { ok: true };
});
