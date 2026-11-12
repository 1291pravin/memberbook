import { eq } from "drizzle-orm";

/**
 * Admin checks a website draft. approve: the owner can publish it.
 * reject: back to the routine with { note } saying what to fix.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const req = await getServiceRequestOr404(event);
  if (req.status !== "needs_review") throw createError({ statusCode: 409, statusMessage: `Request is ${req.status}` });
  const body = await readBody<{ action?: string; note?: string; message?: string }>(event);
  const now = new Date().toISOString();

  if (body?.action === "approve") {
    await db.update(schema.orgWebsites).set({ draftApprovedAt: now, updatedAt: now }).where(eq(schema.orgWebsites.orgId, req.orgId));
    await db.update(schema.serviceRequests).set({
      status: "ready",
      reviewedAt: now,
      message: String(body.message || "").trim().slice(0, 500) || null,
      updatedAt: now,
    }).where(eq(schema.serviceRequests.id, req.id));
    return { status: "ready" };
  }
  if (body?.action === "reject") {
    const note = String(body.note || "").trim().slice(0, 2000);
    if (!note) throw createError({ statusCode: 400, statusMessage: "Say what to fix" });
    await db.update(schema.serviceRequests).set({
      status: "new",
      claimedAt: null,
      adminNote: [req.adminNote, `${now.slice(0, 10)}: ${note}`].filter(Boolean).join("\n"),
      reviewedAt: now,
      updatedAt: now,
    }).where(eq(schema.serviceRequests.id, req.id));
    return { status: "new" };
  }
  throw createError({ statusCode: 400, statusMessage: "action must be approve or reject" });
});
