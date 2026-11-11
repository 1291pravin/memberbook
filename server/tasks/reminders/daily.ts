import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Daily automatic fee reminders over the WhatsApp Cloud API (09:00 IST).
 *
 * Does nothing unless the Cloud API is configured (NUXT_WHATSAPP_CLOUD_ENABLED)
 * and the org has switched on automatic reminders and set a UPI ID.
 *
 * Per subscription: the first reminder goes `reminderDaysBefore` days before a
 * renewal (or as soon as a balance is due), then at most every
 * AUTO_REMINDER_GAP_DAYS days, up to MAX_AUTO_REMINDERS in total. Members who
 * tapped "I have paid" are skipped until the owner confirms.
 */
export default defineTask({
  meta: {
    name: "reminders:daily",
    description: "Send automatic WhatsApp fee reminders",
  },
  async run() {
    if (!isWhatsAppCloudEnabled()) {
      return { result: "skipped: WhatsApp Cloud API not configured" };
    }

    const orgs = await db.select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(and(eq(schema.organizations.autoRemindersEnabled, true), isNotNull(schema.organizations.upiId)));

    const gapMs = AUTO_REMINDER_GAP_DAYS * 86400000 - 3600000; // an hour of slack for cron jitter
    let sent = 0;
    let failed = 0;

    for (const { id } of orgs) {
      const org = await getOrgCollectionSettings(id);
      if (!org?.upiId) continue;

      const items = await getCollections(id, org.reminderDaysBefore);
      const toSend = items.filter(i =>
        normalizeIndianPhone(i.memberPhone)
        && !i.claimedAt
        && i.remindersSent < MAX_AUTO_REMINDERS
        && (!i.lastAttemptAt || Date.now() - new Date(i.lastAttemptAt).getTime() >= gapMs),
      ).slice(0, 200);
      if (toSend.length === 0) continue;

      await ensurePaymentLinks(id, toSend);
      for (const item of toSend) {
        const result = await sendCloudReminder(item, org, null);
        if (result.ok) sent++;
        else failed++;
      }
    }

    console.log(`[reminders:daily] orgs=${orgs.length} sent=${sent} failed=${failed}`);
    return { result: `orgs=${orgs.length} sent=${sent} failed=${failed}` };
  },
});
