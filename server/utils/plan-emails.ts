import { sql } from "drizzle-orm";
import { db } from "@nuxthub/db";

/**
 * Emails to the owner after the admin checks a plan payment on /admin/services:
 * "your plan is on" (Mark paid) or "we couldn't find your payment" (Not received).
 * Sent from support@ through Resend in the branded template (sendNewEmail).
 */

const APP = "https://memberbook.in";
const PLAN_LINK = `${APP}/dashboard/billing?utm_source=memberbook&utm_medium=email&utm_campaign=plan_payment`;

export interface BillEmailContext {
  businessName: string;
  ownerName: string | null;
  planName: string;
  amount: number;
  upiRef: string | null;
  paidUntil: string | null;
}

function firstName(name: string | null | undefined) {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  return /^[\p{L}][\p{L}.'-]{1,30}$/u.test(first) ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}

function prettyDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function rupeesText(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function planPaidEmailText(c: BillEmailContext) {
  const hi = firstName(c.ownerName);
  return [
    hi ? `Hi ${hi},` : "Hello,",
    `Thank you. We've received your payment of ${rupeesText(c.amount)}${c.upiRef ? ` (UPI reference ${c.upiRef})` : ""}, and the ${c.planName} plan is now on for ${c.businessName}${c.paidUntil ? ` until ${prettyDate(c.paidUntil)}` : ""}.`,
    "Automatic WhatsApp fee reminders go out from tomorrow morning, each with a pay link to your own UPI ID.",
    `[See your plan](${PLAN_LINK})`,
    "Any questions? Just reply to this email.",
  ].join("\n\n");
}

export function paymentNotFoundEmailText(c: BillEmailContext) {
  const hi = firstName(c.ownerName);
  return [
    hi ? `Hi ${hi},` : "Hello,",
    `We checked our account but couldn't find your payment of ${rupeesText(c.amount)} for the ${c.planName} plan${c.upiRef ? ` with UPI reference ${c.upiRef}` : ""}.`,
    "Please open your UPI app, check the payment went through, and enter the 12-digit UPI reference (UTR) again on your plan page. If the money left your account, reply to this email with a screenshot and we'll sort it out.",
    `[Open your plan](${PLAN_LINK})`,
  ].join("\n\n");
}

/** Send the outcome email for a plan bill the admin just verified or marked not received. */
export async function sendBillOutcomeEmail(billId: number, outcome: "paid" | "not_found", upiRef: string | null) {
  const [row] = await db.all(sql`
    SELECT b.org_id AS orgId, b.amount AS amount, b.items AS items, o.name AS businessName,
      (SELECT u.email FROM org_memberships om JOIN users u ON u.id = om.user_id
        WHERE om.org_id = o.id AND om.role = 'owner' ORDER BY om.id LIMIT 1) AS ownerEmail,
      (SELECT u.name FROM org_memberships om JOIN users u ON u.id = om.user_id
        WHERE om.org_id = o.id AND om.role = 'owner' ORDER BY om.id LIMIT 1) AS ownerName
    FROM add_on_bills b JOIN organizations o ON o.id = b.org_id WHERE b.id = ${billId}
  `) as { orgId: number; amount: number; items: string; businessName: string; ownerEmail: string | null; ownerName: string | null }[];
  if (!row) return;
  const item = parseJson<BillItem[]>(row.items, []).find(i => i.prepaid);
  // Only plan bills (prepaid); extra-reminder bills don't start anything.
  if (!item) return;
  const email = row.ownerEmail;
  if (!email || !/@/.test(email) || /\.invalid$/i.test(email)) return;

  const plan = await getOrgPlan(Number(row.orgId));
  const planName = getAddOn(item.addOn)?.name.replace(/ plan$/, "") ?? plan.name;
  const c: BillEmailContext = {
    businessName: row.businessName,
    ownerName: row.ownerName,
    planName,
    amount: Number(row.amount),
    upiRef,
    paidUntil: plan.paidUntil,
  };
  await sendNewEmail(outcome === "paid"
    ? { to: email, name: row.ownerName, subject: `Payment received: ${planName} is on for ${row.businessName}`, text: planPaidEmailText(c), by: "system" }
    : { to: email, name: row.ownerName, subject: `We couldn't find your payment for ${planName}`, text: paymentNotFoundEmailText(c), by: "system" });
}
