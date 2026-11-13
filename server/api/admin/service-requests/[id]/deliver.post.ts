import { eq } from "drizzle-orm";

/**
 * The routine hands in its work.
 * Websites: { html, summary } becomes the draft and waits for the admin's OK.
 * Reviews: { text } goes straight to the owner.
 */
export default defineEventHandler(async (event) => {
  await requireAdminOrAiWorker(event, "services");
  const req = await getServiceRequestOr404(event);
  if (req.status !== "working") throw createError({ statusCode: 409, statusMessage: "Claim the request first" });
  const body = await readBody<{ html?: string; summary?: string; text?: string }>(event);
  const now = new Date().toISOString();

  if (req.type === "website_build" || req.type === "website_change") {
    const html = String(body?.html || "");
    if (!/<html[\s>]/i.test(html) || html.length < 500) throw createError({ statusCode: 400, statusMessage: "Send the whole page as html" });
    if (html.length > 900_000) throw createError({ statusCode: 400, statusMessage: "The page is too big (keep it under 900 KB; link photos, don't inline them)" });
    // JSON-LD is data for search engines and is allowed; anything else that runs is not.
    const withoutJsonLd = html.replace(/<script\s+type=["']application\/ld\+json["']\s*>[\s\S]*?<\/script>/gi, "");
    if (/<script[\s>]/i.test(withoutJsonLd) || /<[^>]+\son[a-z]+\s*=/i.test(withoutJsonLd) || /javascript:/i.test(withoutJsonLd)) {
      throw createError({ statusCode: 400, statusMessage: "No scripts or on* handlers: sites are served without JavaScript" });
    }
    await ensureWebsite(req.orgId);
    await db.update(schema.orgWebsites).set({ draftHtml: html, draftApprovedAt: null, updatedAt: now })
      .where(eq(schema.orgWebsites.orgId, req.orgId));
    await db.update(schema.serviceRequests).set({
      status: "needs_review",
      result: JSON.stringify({ summary: String(body?.summary || "").slice(0, 2000) }),
      deliveredAt: now,
      updatedAt: now,
    }).where(eq(schema.serviceRequests.id, req.id));
    await sendAdminEmail(event, "A website draft needs your OK", `Request #${req.id} for business ${req.orgId} is ready to check on /admin/services.`);
    return { status: "needs_review" };
  }

  const text = String(body?.text || "").trim();
  if (!text) throw createError({ statusCode: 400, statusMessage: "Send the text" });
  await db.update(schema.serviceRequests).set({
    status: "done",
    result: JSON.stringify({ text: text.slice(0, 20_000) }),
    deliveredAt: now,
    updatedAt: now,
  }).where(eq(schema.serviceRequests.id, req.id));
  return { status: "done" };
});
