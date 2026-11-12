/**
 * Ask for a reply to a Google review, or a summary of many reviews.
 * Body: { type: "review_reply" | "review_summary", text, reviewer?, rating?, tone? }
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  await requireAddOn(access.orgId, "reviews");
  const body = await readBody<{ type?: string; text?: string; reviewer?: string; rating?: number; tone?: string }>(event);
  const type = body?.type === "review_summary" ? "review_summary" : "review_reply";
  const text = String(body?.text || "").trim();
  const max = type === "review_summary" ? 50_000 : 5_000;
  if (text.length < 3) throw createError({ statusCode: 400, statusMessage: type === "review_summary" ? "Paste your reviews" : "Paste the review" });
  if (text.length > max) throw createError({ statusCode: 400, statusMessage: "That's too long. Paste fewer reviews at a time." });

  const rating = Number(body?.rating);
  const input: Record<string, unknown> = { text };
  if (type === "review_reply") {
    if (body?.reviewer) input.reviewer = String(body.reviewer).trim().slice(0, 100);
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) input.rating = rating;
    if (body?.tone) input.tone = String(body.tone).trim().slice(0, 200);
  }

  const req = await queueServiceRequest({ orgId: access.orgId, type, input, requestedBy: access.userId });
  return serializeRequest(req);
});
