/**
 * WhatsApp templates on MemberBook's own account.
 * Body { action }: "list" (default) shows every template with its status,
 * "ensure" creates the v2 reminder and receipt templates if missing,
 * "delete" with { name } deletes one (not the live v1 reminder while v2 isn't approved).
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ action?: string; name?: string; check?: boolean }>(event).catch(() => ({} as { action?: string; name?: string }));
  const action = body?.action || "list";

  if (action === "list") return await listSharedTemplates();

  if (action === "ensure") {
    const sample = await renderReceiptPdf({
      paymentId: 0, orgId: 0, memberId: 0, receiptNo: 101, token: "sample",
      businessName: "Iron Temple Gym", businessType: "gym", businessPhone: "+91 98765 43210",
      memberName: "Rahul Sharma", memberPhone: "98765 12345",
      amount: 150000, method: "upi", date: todayIST(),
      planName: "Monthly membership", periodStart: todayIST(), periodEnd: addDaysToDate(todayIST(), 29),
      balanceDue: 0, subscriptionId: 1,
    });
    const pub = useRuntimeConfig().public as { appUrl?: string };
    const result = await ensureSharedTemplates(sample, (pub.appUrl || "https://memberbook.in").replace(/\/$/, ""));
    await recordAdminAuditLog(event, "whatsapp_templates_ensure", { metadata: result.results });
    return result;
  }

  if (action === "delete") {
    const name = String(body?.name || "");
    if (!/^[a-z0-9_]{1,512}$/.test(name)) throw createError({ statusCode: 400, statusMessage: "name is required" });
    if (name === REMINDER_TEMPLATE_V2) throw createError({ statusCode: 400, statusMessage: "That's the template in use" });
    if (name === (getWhatsAppCloudConfig().templateName || "fee_reminder") && !(await useReminderV2())) {
      throw createError({ statusCode: 409, statusMessage: "The new reminder isn't approved yet, so the old one is still in use" });
    }
    const result = await deleteSharedTemplate(name);
    await recordAdminAuditLog(event, "whatsapp_template_delete", { metadata: { name, ok: result.ok, error: result.error?.slice(0, 300) } });
    if (!result.ok) throw createError({ statusCode: 502, statusMessage: `Meta did not delete it: ${result.error}` });
    return result;
  }

  throw createError({ statusCode: 400, statusMessage: "action must be list, ensure or delete" });
});
