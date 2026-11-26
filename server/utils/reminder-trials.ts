import { eq, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Automatic start of the 14-day free reminder trial (Pravin, 2026-11-25).
 *
 * Once a business has loaded its members (AUTO_TRIAL_MIN_MEMBERS real, non-demo
 * members), the daily reminders task switches on automatic WhatsApp reminders
 * from MemberBook's number in their free trial and emails the owner how to
 * switch them off. It runs after that day's sends, so the first reminders go out
 * the next morning: the owner gets a day to opt out. Nothing is charged: after
 * the trial, sending pauses until the owner pays.
 *
 * Businesses without a UPI ID can't send pay links, so they get one email
 * asking for it instead; the trial then starts the morning after they add it.
 *
 * Only businesses that never had the auto_reminders add-on (no row at all), so
 * an owner who switched it off is never switched back on. Excluded: test
 * businesses and the AUTO_TRIAL_EXCLUDED_ORGS list.
 */
export const AUTO_TRIAL_MIN_MEMBERS = 5;

/**
 * 17 The Absolute Fit Gym: waiting for the owner's own yes to the trial email.
 * 2, 4: Pravin asked not to contact them. 1, 3, 43, 44, 45, 46, 47: Pravin's own and test businesses.
 */
export const AUTO_TRIAL_EXCLUDED_ORGS = [1, 2, 3, 4, 17, 43, 44, 45, 46, 47];

const APP = "https://memberbook.in";
const SETTINGS_LINK = `${APP}/dashboard/collections?settings=1`;
const NO_UPI_SUBJECT_MARK = "14 days of free fee reminders";

export interface TrialCandidate {
  orgId: number;
  businessName: string;
  type: string;
  upiId: string | null;
  members: number;
  ownerEmail: string | null;
  ownerName: string | null;
}

function peopleWord(type: string) {
  return type === "tuition" || type === "library" ? "students" : type === "clinic" ? "patients" : "members";
}

function firstName(name: string | null | undefined) {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  return /^[\p{L}][\p{L}.'-]{1,30}$/u.test(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}

function prettyDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
}

export function trialStartedEmailText(c: TrialCandidate, trialEndsOn: string) {
  const hi = firstName(c.ownerName);
  const people = peopleWord(c.type);
  return [
    hi ? `Hi ${hi},` : "Hello,",
    `${c.businessName} now has ${c.members} ${people} in MemberBook, so we've started a free ${REMINDER_TRIAL_DAYS}-day trial of the Autopilot plan for you (until ${prettyDate(trialEndsOn)}): we send your fee reminders on WhatsApp automatically.`,
    `From tomorrow morning, each ${people.replace(/s$/, "")} whose fee is due gets a WhatsApp reminder with your business name and a pay link to your UPI ID (${c.upiId}). The money goes straight to you.`,
    [
      `- Up to ${INCLUDED_REMINDERS} reminders free in the trial`,
      `- Anyone who taps "I have paid" isn't reminded again until you confirm`,
      `- Nothing is charged automatically: after the trial Autopilot is ₹199 a month, only if you choose to pay. Or stay on the Free plan`,
    ].join("\n"),
    "Rather send reminders yourself? Switch them off in Payment settings before tomorrow morning:",
    `[Open Payment settings](${SETTINGS_LINK})`,
    "Any questions? Just reply to this email.",
  ].join("\n\n");
}

export function addUpiEmailText(c: TrialCandidate) {
  const hi = firstName(c.ownerName);
  const people = peopleWord(c.type);
  return [
    hi ? `Hi ${hi},` : "Hello,",
    `${c.businessName} now has ${c.members} ${people} in MemberBook. Add your UPI ID and we'll send each ${people.replace(/s$/, "")} an automatic WhatsApp reminder when their fee is due, with a pay link straight to your UPI, free for ${REMINDER_TRIAL_DAYS} days.`,
    `[Add your UPI ID](${SETTINGS_LINK})`,
    "We'll switch the reminders on the morning after you add it and email you when they start. You can switch them off any time, and nothing is charged automatically.",
    "Any questions? Just reply to this email.",
  ].join("\n\n");
}

/** Businesses with enough real members that never had the reminders add-on. */
export async function findTrialCandidates(): Promise<TrialCandidate[]> {
  const excluded = sql.join(AUTO_TRIAL_EXCLUDED_ORGS.map(id => sql`${id}`), sql`, `);
  const rows = await db.all(sql`
    SELECT o.id AS orgId, o.name AS businessName, o.type AS type, o.upi_id AS upiId,
      (SELECT count(*) FROM members m WHERE m.org_id = o.id AND m.status = 'active'
        AND m.id NOT IN (SELECT value FROM json_each(COALESCE(o.demo_data_ids, '{}'), '$.memberIds'))) AS members,
      (SELECT u.email FROM org_memberships om JOIN users u ON u.id = om.user_id
        WHERE om.org_id = o.id AND om.role = 'owner' ORDER BY om.id LIMIT 1) AS ownerEmail,
      (SELECT u.name FROM org_memberships om JOIN users u ON u.id = om.user_id
        WHERE om.org_id = o.id AND om.role = 'owner' ORDER BY om.id LIMIT 1) AS ownerName
    FROM organizations o
    WHERE o.id NOT IN (${excluded})
      AND lower(o.name) NOT LIKE '%test%'
      AND o.auto_reminders_enabled = 0
      AND NOT EXISTS (SELECT 1 FROM org_add_ons a WHERE a.org_id = o.id AND a.add_on IN ('auto_reminders', 'pro'))
  `) as TrialCandidate[];
  return rows
    .map(r => ({ ...r, orgId: Number(r.orgId), members: Number(r.members) }))
    .filter(r => r.members >= AUTO_TRIAL_MIN_MEMBERS);
}

async function alreadyAskedForUpi(email: string) {
  const [row] = await db.all(sql`
    SELECT 1 AS hit FROM email_messages m JOIN email_threads t ON t.id = m.thread_id
    WHERE t.address = ${email.toLowerCase()} AND m.direction = 'out' AND m.subject LIKE ${`%${NO_UPI_SUBJECT_MARK}%`} LIMIT 1
  `) as { hit: number }[];
  return Boolean(row);
}

function deliverable(email: string | null | undefined): email is string {
  return !!email && /@/.test(email) && !/\.invalid$/i.test(email);
}

/**
 * Start trials for eligible businesses (called by reminders:daily after its sends).
 * Returns what it did, for the task log.
 */
export async function autoStartReminderTrials() {
  const done = { started: [] as number[], askedUpi: [] as number[] };
  if (!isWhatsAppCloudEnabled()) return done;

  for (const c of await findTrialCandidates()) {
    try {
      const sending = await reminderSending(c.orgId);
      // Own connected number, or the shared number isn't offered: nothing to start.
      if (!sending.needsAddOn) continue;

      if (!c.upiId) {
        if (deliverable(c.ownerEmail) && !(await alreadyAskedForUpi(c.ownerEmail))) {
          await sendNewEmail({
            to: c.ownerEmail,
            name: c.ownerName,
            subject: `${NO_UPI_SUBJECT_MARK} for ${c.businessName}: add your UPI ID`,
            text: addUpiEmailText(c),
            by: "system",
          });
          done.askedUpi.push(c.orgId);
        }
        continue;
      }

      await startAddOn(c.orgId, "auto_reminders");
      await db.update(schema.organizations).set({ autoRemindersEnabled: true }).where(eq(schema.organizations.id, c.orgId));
      done.started.push(c.orgId);

      const plan = await isPrepaidAddOnPaid(c.orgId, "auto_reminders");
      if (deliverable(c.ownerEmail) && plan.trialEndsOn) {
        await sendNewEmail({
          to: c.ownerEmail,
          name: c.ownerName,
          subject: `Automatic fee reminders are on for ${c.businessName}: ${REMINDER_TRIAL_DAYS} days of Autopilot, free`,
          text: trialStartedEmailText(c, plan.trialEndsOn),
          by: "system",
        });
      }
    }
    catch (err) {
      console.error(`[reminder-trials] org ${c.orgId}`, err);
    }
  }
  return done;
}
