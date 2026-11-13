/**
 * Record (tap-to-send) or send (Cloud API) one reminder.
 * Body: { subscriptionId, kind: "due" | "renewal" }
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const session = await getUserSession(event);
  const body = await readBody(event) ?? {};
  const subscriptionId = Number(body.subscriptionId);
  const kind = body.kind;
  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0 || (kind !== "due" && kind !== "renewal")) {
    throw createError({ statusCode: 400, statusMessage: "Subscription and kind are required" });
  }

  const org = await getOrgCollectionSettings(access.orgId);
  if (!org) throw createError({ statusCode: 404, statusMessage: "Organization not found" });

  const items = await getCollections(access.orgId, org.reminderDaysBefore);
  const item = items.find(i => i.subscriptionId === subscriptionId && i.kind === kind);
  if (!item) throw createError({ statusCode: 404, statusMessage: "Nothing is due for this member any more" });
  await ensurePaymentLinks(access.orgId, [item]);

  const sending = await reminderSending(access.orgId);
  // Paused (monthly limit or unpaid bill): fall back to tap-to-send from the owner's phone.
  const sendsViaCloud = sending.available && !sending.blocked && org.autoRemindersEnabled && !!org.upiId;
  if (sendsViaCloud && body.channel !== "link") {
    const result = await sendCloudReminder(item, org, session.user?.id ?? null, sending.sender);
    if (!result.ok) {
      throw createError({ statusCode: 502, statusMessage: `WhatsApp could not send the message (${result.error}). Try the tap-to-send option.` });
    }
    return { channel: "whatsapp_api", sent: true };
  }

  // Tap-to-send: the browser opens WhatsApp with this message from the owner's phone.
  await logReminder({
    orgId: access.orgId,
    memberId: item.memberId,
    subscriptionId: item.subscriptionId,
    kind: item.kind,
    channel: "whatsapp_link",
    status: "opened",
    amount: item.amount,
    sentBy: session.user?.id ?? null,
  });
  return { channel: "whatsapp_link", sent: false, message: buildReminderMessage(item, org) };
});
