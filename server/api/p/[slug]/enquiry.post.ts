// Public: the enquiry form on a free business page. Saves an enquiry for the business.
export default defineEventHandler(async (event) => {
  const org = await getBusinessPageOrg(String(getRouterParam(event, "slug") || ""));
  if (!org) throw createError({ statusCode: 404, statusMessage: "Page not found" });
  const body = await readBody<{ name?: string; phone?: string; interest?: string; message?: string; company?: string }>(event).catch(() => null);
  // Bots fill every field; people never see this one.
  if (body?.company) return { ok: true };

  await enforceRateLimit(`enquiry:${getClientIp(event)}`, { limit: 5, windowSeconds: 3600 });
  const name = String(body?.name ?? "").trim().slice(0, 100);
  const phone = normalizePhone(String(body?.phone ?? ""));
  if (!name || !phone) throw createError({ statusCode: 400, statusMessage: "Please add your name and a 10-digit phone number" });

  await db.insert(schema.inquiries).values({
    orgId: org.id,
    name,
    phone,
    interest: String(body?.interest ?? "").trim().slice(0, 200) || null,
    notes: [String(body?.message ?? "").trim().slice(0, 1000), "From your free business page"].filter(Boolean).join("\n"),
    status: "new",
  });
  return { ok: true };
});
