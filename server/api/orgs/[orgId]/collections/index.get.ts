export default defineEventHandler(async (event) => {
  const access = event.context.access;
  // Settings and the WhatsApp sending state don't depend on each other: fetch together.
  const sendingPromise = reminderSending(access.orgId);
  const org = await getOrgCollectionSettings(access.orgId);
  if (!org) {
    await sendingPromise.catch(() => {});
    throw createError({ statusCode: 404, statusMessage: "Organization not found" });
  }

  const [items, sending] = await Promise.all([
    getCollections(access.orgId, org.reminderDaysBefore),
    sendingPromise,
  ]);
  await ensurePaymentLinks(access.orgId, items);

  const overdue = items.filter(i => i.overdue);
  const upcoming = items.filter(i => !i.overdue);

  return {
    settings: {
      upiId: org.upiId,
      upiPayeeName: org.upiPayeeName,
      autoRemindersEnabled: org.autoRemindersEnabled,
      reminderDaysBefore: org.reminderDaysBefore,
      thankYouReceipts: org.thankYouReceipts,
    },
    cloudAvailable: sending.available,
    // Reminders go out automatically only when both are on: from the business's
    // own WhatsApp number if it connected one, else from MemberBook's.
    sendsViaCloud: sending.available && !sending.blocked && org.autoRemindersEnabled && !!org.upiId,
    sendsFrom: sending.via,
    sendsFromNumber: sending.displayPhoneNumber,
    needsAddOn: sending.needsAddOn,
    reminderUsage: sending.usage,
    reminderBlocked: org.autoRemindersEnabled || sending.blocked === "unpaid" ? sending.blocked : null,
    reminderPaidUntil: sending.paidUntil,
    summary: {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
      upcomingCount: upcoming.length,
      upcomingAmount: upcoming.reduce((s, i) => s + i.amount, 0),
    },
    items: items.map(i => ({ ...i, message: buildReminderMessage(i, org) })),
  };
});
