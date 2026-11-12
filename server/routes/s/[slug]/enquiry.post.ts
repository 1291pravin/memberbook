/**
 * Enquiry form on a business website (plain HTML form, no scripts). Saves an
 * enquiry for the business and shows a thank-you page.
 */
function page(title: string, body: string, back: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]!);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}
.c{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:28px;max-width:420px;text-align:center}a{display:inline-block;margin-top:16px;background:#0f766e;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:600}</style>
</head><body><div class="c"><h1 style="font-size:22px;margin:0 0 8px">${esc(title)}</h1><p style="color:#475569;margin:0">${esc(body)}</p><a href="${esc(back)}">Back to the website</a></div></body></html>`;
}

export default defineEventHandler(async (event) => {
  const site = await getWebsiteBySlug(String(getRouterParam(event, "slug") || ""));
  if (!site || site.status !== "live") throw createError({ statusCode: 404, statusMessage: "Not found" });
  const back = `/s/${site.slug}`;
  setWebsiteSecurityHeaders(event);
  setHeader(event, "Content-Type", "text/html; charset=utf-8");

  const form = await readFormData(event).catch(() => null);
  const get = (k: string) => String(form?.get(k) ?? "").trim();
  // Bots fill every field, people never see this one.
  if (get("company")) return page("Thank you!", "We'll be in touch soon.", back);

  await enforceRateLimit(`enquiry:${getClientIp(event)}`, { limit: 5, windowSeconds: 3600 });

  const name = get("name").slice(0, 100);
  const phone = normalizePhone(get("phone"));
  if (!name || !phone) {
    setResponseStatus(event, 400);
    return page("Please add your name and phone", "We need both to call you back. Go back and try again.", back);
  }

  await db.insert(schema.inquiries).values({
    orgId: site.orgId,
    name,
    phone,
    interest: get("interest").slice(0, 200) || null,
    notes: [get("message").slice(0, 1000), "From your website"].filter(Boolean).join("\n"),
    status: "new",
  });
  return page("Thank you!", "We got your message and will call you back soon.", back);
});
