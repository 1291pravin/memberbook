import type { H3Event } from "h3";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Automatic emails to business owners at moments where they need us: right after sign-up
 * (we offer to load their register), when an upload couldn't be read (what to send instead), and
 * once per business when an upload loaded members but most have no due date (what's still missing).
 * They go out from support@ in the branded layout (sendNewEmail -> brandedEmail) and are saved as
 * an inbox thread, so the owner's reply reaches /admin/inbox and the AI answers it.
 */

const APP = "https://memberbook.in";

function peopleWord(type: string) {
  return type === "tuition" ? "students" : type === "clinic" ? "patients" : "members";
}

function firstName(name: string | null | undefined) {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  return /^[\p{L}][\p{L}.'-]{1,30}$/u.test(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}

function whatsAppLink(businessName: string) {
  return `https://wa.me/919137849812?text=${encodeURIComponent(`Hi MemberBook, please set up ${businessName}. Here is my register:`)}`;
}

function deliverable(email: string | null | undefined): email is string {
  return !!email && /@/.test(email) && !/\.invalid$/i.test(email);
}

/** Send after the response, never failing the request. */
function inBackground(event: H3Event, job: Promise<unknown>) {
  const safe = job.catch(err => console.error("[owner-emails]", err));
  const ctx = event.context.cloudflare?.context as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (ctx?.waitUntil) ctx.waitUntil(safe);
  else if (typeof event.waitUntil === "function") event.waitUntil(safe);
}

export function welcomeEmailText(opts: { ownerName: string | null; businessName: string; type: string }) {
  const hi = firstName(opts.ownerName);
  const people = peopleWord(opts.type);
  return [
    hi ? `Hi ${hi},` : "Hello,",
    `Thanks for signing up ${opts.businessName} on MemberBook. We can load your whole register for you, free, so you don't have to type anything in.`,
    [
      "Just send us:",
      `1. Your fee plans, for example "Monthly ₹800, Quarterly ₹2,200"`,
      `2. Your ${people.replace(/s$/, "")} list: photos of your register, an Excel sheet or a typed list, with names, phone numbers and the date each fee is due`,
    ].join("\n"),
    `[Send it on WhatsApp](${whatsAppLink(opts.businessName)})`,
    `Or upload it in the app: [Send us your data](${APP}/dashboard/upload)`,
    `Once it's loaded, MemberBook shows you every morning who has to pay, and you get ${REMINDER_TRIAL_DAYS} days of automatic WhatsApp fee reminders free: each ${people.replace(/s$/, "")} gets a reminder with a pay link straight to your own UPI.`,
    "Any questions? Just reply to this email.",
  ].join("\n\n");
}

export function uploadFailedEmailText(opts: { ownerName: string | null; businessName: string; message: string }) {
  const hi = firstName(opts.ownerName);
  return [
    hi ? `Hi ${hi},` : "Hello,",
    `Thanks for sending your files for ${opts.businessName}. We couldn't load them this time. ${opts.message.trim()}`,
    `[Send it on WhatsApp](${whatsAppLink(opts.businessName)})`,
    `Or upload again in the app: [Send us your data](${APP}/dashboard/upload)`,
    "If you're not sure what to send, just reply to this email and we'll help.",
  ].join("\n\n");
}

/** Right after an owner creates their business. */
export function sendWelcomeEmail(event: H3Event, opts: { to: string | null | undefined; ownerName: string | null; businessName: string; type: string }) {
  if (!deliverable(opts.to)) return;
  inBackground(event, sendNewEmail({
    to: opts.to,
    name: opts.ownerName,
    subject: `Welcome to MemberBook: we'll set up ${opts.businessName} for you`,
    text: welcomeEmailText(opts),
    by: "system",
  }));
}

/** When an owner's upload couldn't be read. */
export function sendUploadFailedEmail(event: H3Event, orgId: number, message: string) {
  inBackground(event, (async () => {
    const [row] = await db.select({ businessName: schema.organizations.name, email: schema.users.email, ownerName: schema.users.name })
      .from(schema.organizations)
      .innerJoin(schema.orgMemberships, and(eq(schema.orgMemberships.orgId, schema.organizations.id), eq(schema.orgMemberships.role, "owner")))
      .innerJoin(schema.users, eq(schema.users.id, schema.orgMemberships.userId))
      .where(eq(schema.organizations.id, orgId)).limit(1);
    if (!row || !deliverable(row.email)) return;
    await sendNewEmail({
      to: row.email,
      name: row.ownerName,
      subject: `We couldn't read your upload for ${row.businessName}`,
      text: uploadFailedEmailText({ ownerName: row.ownerName, businessName: row.businessName, message }),
      by: "system",
    });
  })());
}

/** Our own test businesses never get the automatic setup emails. */
export const OWNER_EMAIL_TEST_ORGS = [3, 42, 46, 47, 49];

/** Send the "add due dates" email when at least half of the loaded members have no due date. */
export function needsDueDateNudge(result: { membersLoaded: number; membersWithoutDueDate: number }) {
  return result.membersLoaded > 0 && result.membersWithoutDueDate * 2 >= result.membersLoaded;
}

export function dueDatesMissingEmailText(opts: { ownerName: string | null; businessName: string; type: string; loaded: number; withoutDueDate: number }) {
  const hi = firstName(opts.ownerName);
  const people = peopleWord(opts.type);
  const one = people.replace(/s$/, "");
  const all = opts.withoutDueDate >= opts.loaded;
  return [
    hi ? `Hi ${hi},` : "Hello,",
    `We've loaded ${opts.loaded} ${opts.loaded === 1 ? one : people} into ${opts.businessName}. ${all ? "None of them have" : `${opts.withoutDueDate} of them don't have`} a fee due date yet, so MemberBook can't show you who has to pay or remind them.`,
    [
      "To finish your setup, just send us:",
      `1. Your fee plans, for example "Monthly ₹800, Quarterly ₹2,200"`,
      `2. For each ${one}: their plan, the date their next fee is due, and their phone number`,
    ].join("\n"),
    `[Send it on WhatsApp](${whatsAppLink(opts.businessName)})`,
    `Or upload it in the app: [Send us your data](${APP}/dashboard/upload)`,
    `Once due dates are in, you'll see every morning who has to pay, and each ${one} can get a WhatsApp reminder with a pay link to your own UPI.`,
    "If this list wasn't meant for fees, just reply and tell us what you'd like to use MemberBook for.",
  ].join("\n\n");
}

/** Once per business, after an owner's upload loaded members that mostly have no due date. */
export function sendDueDatesMissingEmail(event: H3Event, orgId: number, result: { membersLoaded: number; membersWithoutDueDate: number }) {
  if (OWNER_EMAIL_TEST_ORGS.includes(orgId) || !needsDueDateNudge(result)) return;
  inBackground(event, (async () => {
    // Claim first, so two uploads finishing together still send one email.
    const claimed = await db.update(schema.organizations).set({ dueDateNudgeAt: new Date().toISOString() })
      .where(and(eq(schema.organizations.id, orgId), isNull(schema.organizations.dueDateNudgeAt)))
      .returning({ id: schema.organizations.id });
    if (!claimed.length) return;
    const [row] = await db.select({ businessName: schema.organizations.name, type: schema.organizations.type, email: schema.users.email, ownerName: schema.users.name })
      .from(schema.organizations)
      .innerJoin(schema.orgMemberships, and(eq(schema.orgMemberships.orgId, schema.organizations.id), eq(schema.orgMemberships.role, "owner")))
      .innerJoin(schema.users, eq(schema.users.id, schema.orgMemberships.userId))
      .where(eq(schema.organizations.id, orgId)).limit(1);
    if (!row || !deliverable(row.email)) return;
    await sendNewEmail({
      to: row.email,
      name: row.ownerName,
      subject: `One more step for ${row.businessName}: fee due dates`,
      text: dueDatesMissingEmailText({ ownerName: row.ownerName, businessName: row.businessName, type: row.type, loaded: result.membersLoaded, withoutDueDate: result.membersWithoutDueDate }),
      by: "system",
    });
  })());
}
