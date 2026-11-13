import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Daily automatic fee reminders over the WhatsApp Cloud API (09:00 IST).
 *
 * Sends for orgs that switched on automatic reminders and set a UPI ID, from
 * the org's own connected WhatsApp number (own_number add-on) or, when the
 * Cloud API is switched on (NUXT_WHATSAPP_CLOUD_ENABLED), from MemberBook's.
 *
 * Per subscription: the first reminder goes `reminderDaysBefore` days before a
 * renewal (or as soon as a balance is due), then at most every
 * AUTO_REMINDER_GAP_DAYS days, up to MAX_AUTO_REMINDERS in total. Members who
 * tapped "I have paid" are skipped until the owner confirms.
 *
 * From MemberBook's number a business needs the auto_reminders add-on, gets
 * INCLUDED_REMINDERS a month, and pauses while an add-on bill is overdue.
 */
export default defineTask({
  meta: {
    name: "reminders:daily",
    description: "Send automatic WhatsApp fee reminders",
  },
  async run() {
    // Businesses with their own connected number send even while MemberBook's
    // number is switched off; reminderSending() decides per business.
    const orgs = await db.select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(and(eq(schema.organizations.autoRemindersEnabled, true), isNotNull(schema.organizations.upiId)));

    const gapMs = AUTO_REMINDER_GAP_DAYS * 86400000 - 3600000; // an hour of slack for cron jitter
    let sent = 0;
    let failed = 0;

    for (const { id } of orgs) {
      const org = await getOrgCollectionSettings(id);
      if (!org?.upiId) continue;
      const sending = await reminderSending(id);
      if (!sending.available || sending.blocked) continue;
      // Shared number: stop at the monthly allowance (Meta bills us per message).
      const cap = sending.usage ? Math.max(0, sending.usage.limit - sending.usage.used) : 200;

      const items = await getCollections(id, org.reminderDaysBefore);
      const toSend = items.filter(i =>
        normalizeIndianPhone(i.memberPhone)
        && !i.claimedAt
        && i.remindersSent < MAX_AUTO_REMINDERS
        && (!i.lastAttemptAt || Date.now() - new Date(i.lastAttemptAt).getTime() >= gapMs),
      ).slice(0, Math.min(200, cap));
      if (toSend.length === 0) continue;

      await ensurePaymentLinks(id, toSend);
      for (const item of toSend) {
        const result = await sendCloudReminder(item, org, null, sending.sender);
        if (result.ok) sent++;
        else failed++;
      }
    }

    console.log(`[reminders:daily] orgs=${orgs.length} sent=${sent} failed=${failed}`);
    return { result: `orgs=${orgs.length} sent=${sent} failed=${failed}` };
  },
});
