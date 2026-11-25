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

  // Waiting for the ₹199 payment: hand the page the bill so the owner can pay right here.
  const reminderPlan = getAddOn("auto_reminders")!;
  // During the free trial the renewal bill appears a few days before the end, so
  // the owner can pay early and reminders never stop.
  const trialStart = sending.trialUntil || sending.trialEndedOn;
  const [bill, trialResults] = await Promise.all([
    sending.blocked === "unpaid"
      ? ensurePrepaidBill(access.orgId, "auto_reminders")
      : sending.trialUntil ? openPrepaidBill(access.orgId, "auto_reminders") : null,
    trialStart && (sending.trialUntil || sending.blocked === "unpaid")
      ? reminderResultsSince(access.orgId, addDaysToDate(trialStart, -((reminderPlan.trialDays ?? 14) - 1)))
      : null,
  ]);
  const billing = billingUpi(event);

  const overdue = items.filter(i => i.overdue);
  const upcoming = items.filter(i => !i.overdue);

  return {
    settings: {
      upiId: org.upiId,
      upiPayeeName: org.upiPayeeName,
      autoRemindersEnabled: org.autoRemindersEnabled,
      reminderDaysBefore: org.reminderDaysBefore,
      thankYouReceipts: org.thankYouReceipts,
      birthdayWishes: org.birthdayWishes,
      missYouMessages: org.missYouMessages,
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
    reminderTrialUntil: sending.trialUntil ?? null,
    reminderTrialEnded: Boolean(sending.trialEndedOn),
    // Switching on now starts the free trial (never had it, never paid).
    reminderTrialAvailable: sending.needsAddOn && !sending.trialEndedOn && !sending.paidUntil && Boolean(reminderPlan.trialDays),
    trialResults,
    // The owner can tick "Send reminders automatically": already set up, or by paying for the plan.
    canTurnOnReminders: sending.available || sending.needsAddOn,
    reminderPlan: { price: reminderPlan.price, included: INCLUDED_REMINDERS, trialDays: reminderPlan.trialDays ?? 0 },
    reminderBill: bill
      ? {
          id: bill.id,
          amount: bill.amount,
          status: bill.status,
          upiRef: bill.upiRef,
          upiLink: billing.upiId ? buildUpiLink({ upiId: billing.upiId, payeeName: billing.payeeName, amount: bill.amount, note: "MemberBook WhatsApp reminders" }) : null,
          payTo: billing.upiId || null,
          payeeName: billing.payeeName,
        }
      : null,
    summary: {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, i) => s + i.amount, 0),
      upcomingCount: upcoming.length,
      upcomingAmount: upcoming.reduce((s, i) => s + i.amount, 0),
    },
    items: items.map(i => ({ ...i, message: buildReminderMessage(i, org) })),
  };
});
