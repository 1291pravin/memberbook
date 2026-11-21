import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

const STATUSES = new Set(["replied", "unsubscribed", "bounced", "new"]);

/** Mark a lead { status: replied | unsubscribed | bounced | new, notes? }. Replied/unsubscribed stop all emails. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<{ status?: unknown; notes?: unknown }>(event).catch(() => ({} as { status?: unknown; notes?: unknown }));
  const status = String(body?.status ?? "");
  if (!Number.isInteger(id) || !STATUSES.has(status)) throw createError({ statusCode: 400, statusMessage: "status must be replied, unsubscribed, bounced or new" });
  const notes = body?.notes === undefined ? undefined : String(body.notes).slice(0, 500);
  const res = await db.update(schema.outreachLeads)
    .set({ status, ...(notes !== undefined ? { notes } : {}), updatedAt: new Date().toISOString() })
    .where(eq(schema.outreachLeads.id, id)).returning({ id: schema.outreachLeads.id });
  if (!res.length) throw createError({ statusCode: 404, statusMessage: "Lead not found" });
  return { id, status };
});
