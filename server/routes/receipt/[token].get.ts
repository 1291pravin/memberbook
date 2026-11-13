/**
 * Public PDF receipt: /receipt/<token>. Linked from the WhatsApp thank-you
 * (Meta downloads it to attach) and shared by owners. The token is long and
 * random, like pay links.
 */
export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, "token") || "").replace(/\.pdf$/i, "");
  const receipt = await getReceiptByToken(token);
  if (!receipt) throw createError({ statusCode: 404, statusMessage: "Receipt not found" });
  const pdf = await renderReceiptPdf(receipt);
  setHeaders(event, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${receiptFileName(receipt)}"`,
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  });
  return pdf;
});
