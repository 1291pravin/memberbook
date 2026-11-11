export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const org = await getOrgCollectionSettings(access.orgId);
  if (!org) throw createError({ statusCode: 404, statusMessage: "Organization not found" });

  const items = await getCollections(access.orgId, org.reminderDaysBefore);
  await ensurePaymentLinks(access.orgId, items);

  const overdue = items.filter(i => i.overdue);
  const upcoming = items.filter(i => !i.overdue);

  return {
    settings: {
      upiId: org.upiId,
      upiPayeeName: org.upiPayeeName,
      autoRemindersEnabled: org.autoRemindersEnabled,
      reminderDaysBefore: org.reminderDaysBefore,
    },
    cloudAvailable: isWhatsAppCloudEnabled(),
    // Reminders go out from MemberBook's number only when both are on.
    sendsViaCloud: isWhatsAppCloudEnabled() && org.autoRemindersEnabled && !!org.upiId,
    summary: {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
      upcomingCount: upcoming.length,
      upcomingAmount: upcoming.reduce((s, i) => s + i.amount, 0),
    },
    items: items.map(i => ({ ...i, message: buildReminderMessage(i, org) })),
  };
});
