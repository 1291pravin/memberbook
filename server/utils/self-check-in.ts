import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

export const STOPPED_COMING_DAYS = 10;

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The business's public self check-in token, created on first use. */
export async function ensureCheckInToken(orgId: number, reset = false) {
  const [org] = await db.select({ token: schema.organizations.checkInToken }).from(schema.organizations)
    .where(eq(schema.organizations.id, orgId)).limit(1);
  if (org?.token && !reset) return org.token;
  const token = newToken();
  await db.update(schema.organizations).set({ checkInToken: token }).where(eq(schema.organizations.id, orgId));
  return token;
}

export async function getOrgByCheckInToken(token: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(token)) return null;
  const [org] = await db.select({ id: schema.organizations.id, name: schema.organizations.name, type: schema.organizations.type })
    .from(schema.organizations).where(eq(schema.organizations.checkInToken, token)).limit(1);
  if (!org || !(await isAddOnActive(org.id, "self_check_in"))) return null;
  return org;
}

/** Days in a row (IST) the member came in, allowing one rest day between visits. */
export async function getMemberVisitStats(orgId: number, memberId: number) {
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const rows = await db.all<{ day: string }>(sql`
    SELECT DISTINCT date(checked_in_at, '+330 minutes') AS day FROM check_ins
    WHERE org_id = ${orgId} AND member_id = ${memberId} AND checked_in_at >= ${since}
    ORDER BY day DESC
  `);
  const days = rows.map(r => r.day);
  const today = todayIST();
  const month = today.slice(0, 7);
  let streak = 0;
  let cursor = today;
  for (const day of days) {
    const gap = Math.round((Date.parse(cursor) - Date.parse(day)) / 86400000);
    if (streak === 0 ? gap > 1 : gap > 2) break;
    streak += 1;
    cursor = day;
  }
  return { streak, visitsThisMonth: days.filter(d => d.startsWith(month)).length };
}

/** Members with a running plan who used to come but haven't checked in for a while. */
export async function getStoppedComing(orgId: number) {
  const cutoff = new Date(Date.now() - STOPPED_COMING_DAYS * 86400000).toISOString();
  const today = todayIST();
  const rows = await db.all<{ id: number; name: string; phone: string | null; last_at: string; visits: number }>(sql`
    SELECT m.id, m.name, m.phone, MAX(c.checked_in_at) AS last_at, COUNT(c.id) AS visits
    FROM members m
    JOIN check_ins c ON c.member_id = m.id AND c.org_id = m.org_id
    WHERE m.org_id = ${orgId} AND m.status = 'active'
      AND EXISTS (
        SELECT 1 FROM member_subscriptions s
        WHERE s.org_id = m.org_id AND s.member_id = m.id AND s.status = 'active' AND s.end_date >= ${today}
      )
    GROUP BY m.id
    HAVING MAX(c.checked_in_at) < ${cutoff}
    ORDER BY last_at DESC
    LIMIT 100
  `);
  return rows.map(r => ({
    memberId: Number(r.id),
    name: r.name,
    phone: r.phone,
    lastVisitAt: r.last_at,
    daysAway: Math.floor((Date.now() - Date.parse(r.last_at)) / 86400000),
    visits: Number(r.visits),
  }));
}

/** Member checks themselves in by phone number on the door QR page. */
export async function selfCheckIn(org: { id: number }, rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Enter your 10-digit mobile number" });

  const [member] = await db.select({ id: schema.members.id, name: schema.members.name }).from(schema.members)
    .where(and(
      eq(schema.members.orgId, org.id),
      eq(schema.members.status, "active"),
      sql`substr(replace(replace(replace(${schema.members.phone}, ' ', ''), '-', ''), '+', ''), -10) = ${phone}`,
    )).limit(1);
  if (!member) {
    throw createError({ statusCode: 404, statusMessage: "We couldn't find this number. Please check in at the desk." });
  }

  const today = todayIST();
  const now = new Date().toISOString();
  const [open] = await db.all<{ id: number; day: string }>(sql`
    SELECT id, date(checked_in_at, '+330 minutes') AS day FROM check_ins
    WHERE org_id = ${org.id} AND member_id = ${member.id} AND checked_out_at IS NULL
    ORDER BY id DESC LIMIT 1
  `);

  let already = false;
  if (open && open.day === today) {
    already = true;
  }
  else {
    if (open) {
      // Left open from an earlier day: close it so today's visit can be recorded.
      await db.run(sql`UPDATE check_ins SET checked_out_at = checked_in_at, auto_checked_out = 1 WHERE id = ${open.id}`);
    }

    const [owner] = await db.select({ userId: schema.orgMemberships.userId }).from(schema.orgMemberships)
      .where(and(eq(schema.orgMemberships.orgId, org.id), eq(schema.orgMemberships.role, "owner"))).limit(1);
    if (!owner) throw createError({ statusCode: 409, statusMessage: "Please check in at the desk." });

    const [sub] = await db.select({ status: schema.memberSubscriptions.status, endDate: schema.memberSubscriptions.endDate })
      .from(schema.memberSubscriptions)
      .where(and(eq(schema.memberSubscriptions.orgId, org.id), eq(schema.memberSubscriptions.memberId, member.id)))
      .orderBy(sql`${schema.memberSubscriptions.id} DESC`).limit(1);
    const subscriptionStatus = !sub ? "none" : sub.endDate < today ? "expired" : sub.status === "active" ? "active" : "inactive";

    await db.run(sql`
      INSERT INTO check_ins (org_id, member_id, checked_in_by, checked_in_at, auto_checked_out, subscription_status, notes, source, created_at)
      SELECT ${org.id}, ${member.id}, ${owner.userId}, ${now}, 0, ${subscriptionStatus}, 'Self check-in', 'self', ${now}
      WHERE NOT EXISTS (SELECT 1 FROM check_ins WHERE org_id = ${org.id} AND member_id = ${member.id} AND checked_out_at IS NULL)
    `);
  }

  const [sub] = await db.select({ endDate: schema.memberSubscriptions.endDate, status: schema.memberSubscriptions.status })
    .from(schema.memberSubscriptions)
    .where(and(eq(schema.memberSubscriptions.orgId, org.id), eq(schema.memberSubscriptions.memberId, member.id)))
    .orderBy(sql`${schema.memberSubscriptions.id} DESC`).limit(1);
  const stats = await getMemberVisitStats(org.id, member.id);
  return {
    already,
    firstName: member.name.split(/\s+/)[0],
    ...stats,
    planEndsOn: sub?.endDate ?? null,
    planExpired: sub ? sub.endDate < today || sub.status !== "active" : null,
  };
}
