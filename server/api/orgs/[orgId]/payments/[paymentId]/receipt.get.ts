/**
 * PDF receipt for one payment, for the owner or staff to download or share.
 * ?format=link returns the public link and a WhatsApp message instead of the PDF.
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const paymentId = Number(getRouterParam(event, "paymentId"));
  if (!Number.isInteger(paymentId) || paymentId <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid payment" });

  const receipt = await getReceiptForPayment(access.orgId, paymentId);
  if (!receipt) throw createError({ statusCode: 404, statusMessage: "Payment not found" });

  if (getQuery(event).format === "link") {
    const url = receiptUrl(receipt.token);
    return {
      receiptNo: receipt.receiptNo,
      url,
      memberPhone: receipt.memberPhone,
      message: `Hi ${firstName(receipt.memberName)}, thank you for your payment of ${formatRupees(receipt.amount)} to ${receipt.businessName}. Your receipt: ${url}`,
    };
  }

  const pdf = await renderReceiptPdf(receipt);
  setHeaders(event, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${receiptFileName(receipt)}"`,
    "Cache-Control": "private, no-store",
  });
  return pdf;
});
