import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Unsubscribe from MemberBook outreach emails. GET shows a confirm button (so link
 * scanners don't unsubscribe people by opening the link); POST unsubscribes, which
 * is also what mail apps send for one-click List-Unsubscribe.
 */
export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, "token") || "").slice(0, 64);
  const method = event.method;
  setResponseHeader(event, "Cache-Control", "no-store");
  setResponseHeader(event, "X-Robots-Tag", "noindex");
  setResponseHeader(event, "Content-Type", "text/html; charset=utf-8");

  const page = (msg: string, form = false) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe | MemberBook</title><style>body{font-family:system-ui,Arial,sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:48px 16px}main{max-width:420px;margin:auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px #0001}button{background:#0f766e;color:#fff;border:0;border-radius:8px;padding:12px 20px;font-size:16px;cursor:pointer}p{line-height:1.5;color:#475569}</style></head><body><main><h1 style="font-size:20px">MemberBook emails</h1><p>${msg}</p>${form ? `<form method="post"><button type="submit">Unsubscribe</button></form>` : ""}</main></body></html>`;

  if (method !== "GET" && method !== "POST" && method !== "HEAD") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }
  const [lead] = token
    ? await db.select({ id: schema.outreachLeads.id, status: schema.outreachLeads.status })
      .from(schema.outreachLeads).where(eq(schema.outreachLeads.token, token)).limit(1)
    : [];
  if (!lead) return page("This link isn't valid any more. If you keep getting emails from us, reply with \"unsubscribe\" and we'll stop.");
  if (lead.status === "unsubscribed") return page("You're unsubscribed. You won't get any more emails from MemberBook.");
  if (method !== "POST") return page("Click below and you won't get any more emails from MemberBook.", true);

  await db.update(schema.outreachLeads)
    .set({ status: "unsubscribed", updatedAt: new Date().toISOString() })
    .where(eq(schema.outreachLeads.id, lead.id));
  return page("Done. You're unsubscribed and won't get any more emails from MemberBook.");
});
