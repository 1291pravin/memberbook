import { sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/** Free days of automatic reminders per business an owner brings in. */
export const REFERRAL_REWARD_DAYS = 30;

/** A referred business counts once it has this many members. */
const REFERRAL_MIN_MEMBERS = 5;

/** utm_campaign on an owner's referral link: ref-<orgId>. */
export function referralCampaign(orgId: number) {
  return `ref-${orgId}`;
}

/**
 * Daily: give the referrer a free month of automatic reminders for every
 * business that signed up from their link (users.signup_campaign = ref-<id>)
 * and has loaded members. Extends paid_until, so it adds to a trial or a paid
 * month, or waits as credit until they switch reminders on.
 */
export async function grantReferralRewards(): Promise<number> {
  const rows = await db.all(sql`
    SELECT om.org_id AS referred, CAST(substr(u.signup_campaign, 5) AS INTEGER) AS referrer
    FROM users u
    JOIN org_memberships om ON om.user_id = u.id AND om.role = 'owner'
    JOIN organizations o ON o.id = om.org_id AND o.demo_data_ids IS NULL
    WHERE u.signup_campaign LIKE 'ref-%'
      AND NOT EXISTS (SELECT 1 FROM referral_rewards r WHERE r.referred_org_id = om.org_id)
      AND (SELECT COUNT(*) FROM members m WHERE m.org_id = om.org_id) >= ${REFERRAL_MIN_MEMBERS}
  `) as { referred: number; referrer: number }[];

  let granted = 0;
  const today = todayIST();
  for (const r of rows) {
    if (!r.referrer || r.referrer === r.referred) continue;
    const [referrer] = await db.select({ id: schema.organizations.id }).from(schema.organizations)
      .where(sql`${schema.organizations.id} = ${r.referrer}`).limit(1);
    if (!referrer) continue;

    const [addOn] = await db.select({ paidUntil: schema.orgAddOns.paidUntil }).from(schema.orgAddOns)
      .where(sql`${schema.orgAddOns.orgId} = ${r.referrer} AND ${schema.orgAddOns.addOn} = 'auto_reminders'`).limit(1);
    const from = addOn?.paidUntil && addOn.paidUntil >= today ? addDaysToDate(addOn.paidUntil, 1) : today;
    const paidUntil = addDaysToDate(from, REFERRAL_REWARD_DAYS - 1);
    const now = new Date().toISOString();

    await db.batch([
      db.insert(schema.referralRewards).values({ referredOrgId: r.referred, referrerOrgId: r.referrer, days: REFERRAL_REWARD_DAYS }).onConflictDoNothing(),
      db.insert(schema.orgAddOns)
        .values({ orgId: r.referrer, addOn: "auto_reminders", status: "off", price: 19900, paidUntil, createdAt: now, updatedAt: now })
        .onConflictDoUpdate({ target: [schema.orgAddOns.orgId, schema.orgAddOns.addOn], set: { paidUntil, updatedAt: now } }),
    ]);
    // A renewal bill they haven't paid isn't needed now: the free month covers it.
    await dropUnpaidPrepaidBill(r.referrer, "auto_reminders");
    granted++;
  }
  return granted;
}

/** Businesses this org brought in and the free days earned, for the owner's referral card. */
export async function referralSummary(orgId: number) {
  const [row] = await db.all(sql`SELECT COUNT(*) AS n, COALESCE(SUM(days), 0) AS days FROM referral_rewards WHERE referrer_org_id = ${orgId}`) as { n: number; days: number }[];
  return { referred: Number(row?.n ?? 0), daysEarned: Number(row?.days ?? 0) };
}
