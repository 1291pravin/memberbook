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
 *
 * It also sends birthday wishes and "we miss you" notes (server/utils/member-messages.ts).
 *
 * Afterwards it starts the 14-day free trial for businesses that have loaded
 * their members (server/utils/reminder-trials.ts).
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
    let memberMessages = 0;

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

      let orgSent = 0;
      if (toSend.length > 0) {
        await ensurePaymentLinks(id, toSend);
        for (const item of toSend) {
          const result = await sendCloudReminder(item, org, null, sending.sender);
          if (result.ok) {
            sent++;
            orgSent++;
          }
          else failed++;
        }
      }

      // Birthday wishes and "we miss you" notes: MemberBook's number only (the
      // templates live there), within what's left of the month's allowance.
      if (sending.via === "memberbook" && (org.birthdayWishes || org.missYouMessages)) {
        const extra = await sendMemberMessages(org, Math.min(50, cap - orgSent)).catch((err) => {
          console.error(`[reminders:daily] member messages org=${id}`, err);
          return { sent: 0, failed: 0 };
        });
        memberMessages += extra.sent;
        failed += extra.failed;
      }
    }

    // After today's sends: start the free trial for businesses that have loaded
    // their members (first reminders go out tomorrow, so the owner can opt out).
    const trials = await autoStartReminderTrials().catch((err) => {
      console.error("[reminders:daily] auto trials", err);
      return { started: [], askedUpi: [] };
    });

    const summary = `orgs=${orgs.length} sent=${sent} birthdayMissYou=${memberMessages} failed=${failed} trialsStarted=${trials.started.join(",") || 0} askedUpi=${trials.askedUpi.join(",") || 0}`;
    console.log(`[reminders:daily] ${summary}`);
    return { result: summary };
  },
});
