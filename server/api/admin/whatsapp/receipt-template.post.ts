/**
 * Create the "payment_receipt" WhatsApp template (utility, PDF header) on
 * MemberBook's account if it's missing, and return its status. Body
 * { check: true } only reads the status.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ check?: boolean }>(event).catch(() => ({} as { check?: boolean }));
  if (body?.check) return await getReceiptTemplateStatus();

  const sample = await renderReceiptPdf({
    paymentId: 0,
    orgId: 0,
    memberId: 0,
    receiptNo: 101,
    token: "sample",
    businessName: "Fit Zone Gym",
    businessPhone: "+91 98765 43210",
    memberName: "Rahul Sharma",
    memberPhone: "98765 12345",
    amount: 100000,
    method: "upi",
    date: todayIST(),
    planName: "Monthly membership",
    periodStart: todayIST(),
    periodEnd: addDaysToDate(todayIST(), 29),
    balanceDue: 0,
    subscriptionId: 1,
  });
  const result = await ensureReceiptTemplate(sample);
  await recordAdminAuditLog(event, "whatsapp_receipt_template", { metadata: { ok: result.ok, status: result.status, created: result.created, error: result.error?.slice(0, 300) } });
  if (!result.ok) throw createError({ statusCode: 502, statusMessage: `Meta did not accept the template: ${result.error}` });
  return result;
});
