import { eq } from "drizzle-orm";

/**
 * Finish "Connect with WhatsApp": the browser sends the one-time code and the
 * account and number the owner picked in Meta's popup.
 * Body: { code, wabaId, phoneNumberId, businessApp }
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  await requireAddOn(access.orgId, "own_number");
  if (!embeddedSignupConfig().ready) {
    throw createError({ statusCode: 503, statusMessage: "Connecting your own WhatsApp isn't open yet." });
  }

  const body = await readBody(event) ?? {};
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const wabaId = String(body.wabaId ?? "").trim();
  const phoneNumberId = String(body.phoneNumberId ?? "").trim();
  if (!code || code.length > 2000 || !/^\d{5,25}$/.test(wabaId) || !/^\d{5,25}$/.test(phoneNumberId)) {
    throw createError({ statusCode: 400, statusMessage: "Meta didn't send back your WhatsApp details. Please try again." });
  }

  // A number can only send for one business here.
  const [taken] = await db.select({ orgId: schema.orgWhatsappAccounts.orgId }).from(schema.orgWhatsappAccounts)
    .where(eq(schema.orgWhatsappAccounts.phoneNumberId, phoneNumberId)).limit(1);
  if (taken && taken.orgId !== access.orgId) {
    throw createError({ statusCode: 409, statusMessage: "This WhatsApp number is already connected to another business on MemberBook." });
  }
  if (phoneNumberId === getWhatsAppCloudConfig().phoneNumberId) {
    throw createError({ statusCode: 409, statusMessage: "That's MemberBook's own number." });
  }

  const session = await getUserSession(event);
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in").replace(/\/$/, "");
  const account = await connectOwnAccount({
    orgId: access.orgId,
    userId: session.user?.id ?? null,
    code,
    wabaId,
    phoneNumberId,
    businessApp: body.businessApp === true,
    appUrl,
  });
  await sendAdminEmail(
    event,
    `WhatsApp connected: business ${access.orgId} (${account.displayPhoneNumber ?? phoneNumberId})`,
    `Business ${access.orgId} connected its own WhatsApp number ${account.displayPhoneNumber ?? ""} `
    + `(${account.businessApp ? "keeps the Business app" : "new number"}). Template: ${account.templateStatus}.`
    + `${account.lastError ? `\n\nProblems: ${account.lastError}` : ""}\n`,
  ).catch(() => {});
  return { account: serializeOwnAccount(account) };
});
