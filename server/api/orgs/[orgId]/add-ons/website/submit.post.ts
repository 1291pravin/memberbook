import { and, eq, inArray } from "drizzle-orm";

/**
 * Ask us to build the website (first time) or to make a change (after that).
 * Body: { change?: string }. Needs the website add-on switched on.
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  await requireAddOn(access.orgId, "website");
  const site = await ensureWebsite(access.orgId);
  const details = parseJson<WebsiteDetails>(site.details, {});
  const body = await readBody<{ change?: string }>(event);
  const change = String(body?.change || "").trim().slice(0, 2000);

  if (details.existingWebsite) {
    throw createError({ statusCode: 400, statusMessage: "You told us you already have a website. Clear that box to ask for a new one." });
  }
  if (!details.businessName || !(details.address || details.area) || !(details.phone || details.whatsapp)) {
    throw createError({ statusCode: 400, statusMessage: "Add your business name, address and a phone number first" });
  }

  const isChange = Boolean(site.draftHtml || site.liveHtml);
  if (isChange && !change) throw createError({ statusCode: 400, statusMessage: "Tell us what to change" });

  const [open] = await db.select({ id: schema.serviceRequests.id }).from(schema.serviceRequests)
    .where(and(
      eq(schema.serviceRequests.orgId, access.orgId),
      inArray(schema.serviceRequests.type, ["website_build", "website_change"]),
      inArray(schema.serviceRequests.status, ["new", "working"]),
    )).limit(1);
  if (open) {
    // Fold a second change into the waiting request instead of queueing another build.
    if (change) {
      const [row] = await db.select().from(schema.serviceRequests).where(eq(schema.serviceRequests.id, open.id)).limit(1);
      const input = parseJson<Record<string, unknown>>(row!.input, {});
      input.change = [input.change, change].filter(Boolean).join("\n\n");
      await db.update(schema.serviceRequests).set({ input: JSON.stringify(input), updatedAt: new Date().toISOString() })
        .where(eq(schema.serviceRequests.id, open.id));
    }
    return { id: open.id, queued: false };
  }

  const req = await queueServiceRequest({
    orgId: access.orgId,
    type: isChange ? "website_change" : "website_build",
    input: isChange ? { change } : {},
    requestedBy: access.userId,
  });
  await alertServiceRequest(event, req);
  return { id: req.id, queued: true };
});
