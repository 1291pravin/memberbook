import { sql } from "drizzle-orm";
import { SETUP_USER_EMAIL } from "../../../../utils/org-setup";

type Raw = Record<string, unknown>;

/** One business: health row, 30-day activity, timeline, uploads and notes. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const orgId = readOrgIdParam(event);

  const [business] = await getBusinessRows({ orgId });
  if (!business) {
    throw createError({ statusCode: 404, statusMessage: "Business not found" });
  }

  const since30 = dateIST(-29);
  const since30Iso = new Date(Date.now() - 30 * 86400000).toISOString();

  const [visits, payments, members, notes, uploads, audit, reminders, invites, staff] = await Promise.all([
    db.all(sql`SELECT day AS date, COUNT(DISTINCT user_id) AS value FROM user_activity_days
      WHERE org_id = ${orgId} AND day >= ${since30} GROUP BY day`),
    db.all(sql`SELECT date, COUNT(*) AS value, COALESCE(SUM(amount), 0) AS amount FROM payments
      WHERE org_id = ${orgId} AND date >= ${since30} GROUP BY date`),
    db.all(sql`SELECT date(created_at, '+330 minutes') AS date, COUNT(*) AS value FROM members
      WHERE org_id = ${orgId} AND created_at >= ${since30Iso} GROUP BY date(created_at, '+330 minutes')`),
    db.all(sql`SELECT id, body, created_at FROM admin_org_notes WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT 100`),
    db.all(sql`SELECT id, source, status, message, result, created_at, processed_at FROM data_uploads
      WHERE org_id = ${orgId} ORDER BY id DESC LIMIT 20`),
    db.all(sql`SELECT action, metadata, created_at FROM admin_audit_logs
      WHERE target_org_id = ${orgId} ORDER BY id DESC LIMIT 50`),
    db.all(sql`SELECT channel, status, COUNT(*) AS count, MAX(created_at) AS last_at FROM reminder_logs
      WHERE org_id = ${orgId} GROUP BY channel, status`),
    db.all(sql`SELECT role, status, created_at, accepted_at FROM org_invites WHERE org_id = ${orgId} ORDER BY id DESC LIMIT 10`),
    db.all(sql`SELECT u.name, u.email, om.role, u.last_seen_at FROM org_memberships om
      JOIN users u ON u.id = om.user_id WHERE om.org_id = ${orgId} ORDER BY om.id`),
  ]) as Raw[][];

  const [firsts] = await db.all(sql`
    SELECT
      (SELECT MIN(created_at) FROM members WHERE org_id = ${orgId}) AS first_member_at,
      (SELECT MIN(created_at) FROM payments WHERE org_id = ${orgId}) AS first_payment_at,
      (SELECT MIN(created_at) FROM subscription_plans WHERE org_id = ${orgId}) AS first_plan_at,
      (SELECT MIN(created_at) FROM reminder_logs WHERE org_id = ${orgId}) AS first_reminder_at,
      (SELECT MIN(day) FROM user_activity_days WHERE org_id = ${orgId}
        AND day > date(${business.createdAt}, '+330 minutes')) AS first_return_day
  `) as Raw[];

  // Daily series for the last 30 IST days, zero-filled.
  const byDate = (rows: Raw[], key = "value") => new Map(rows.map(r => [String(r.date), Number(r[key] ?? 0)]));
  const visitMap = byDate(visits!);
  const payMap = byDate(payments!);
  const amountMap = byDate(payments!, "amount");
  const memberMap = byDate(members!);
  const daily = Array.from({ length: 30 }, (_, i) => {
    const date = dateIST(i - 29);
    return {
      date,
      visitors: visitMap.get(date) ?? 0,
      payments: payMap.get(date) ?? 0,
      collected: amountMap.get(date) ?? 0,
      members: memberMap.get(date) ?? 0,
    };
  });

  // Timeline: milestones, uploads, admin actions and notes, newest first.
  type Item = { at: string; kind: string; text: string };
  const timeline: Item[] = [];
  const push = (at: unknown, kind: string, text: string) => {
    if (at) timeline.push({ at: String(at), kind, text });
  };
  push(business.createdAt, "milestone", "Signed up");
  push(business.setupHelpAskedAt, "milestone", "Asked for WhatsApp setup help");
  push(business.setupHelpHandledAt, "admin", "Setup-help request marked contacted");
  push(firsts?.first_plan_at, "milestone", "Created the first plan");
  push(firsts?.first_member_at, "milestone", "Added the first member");
  push(firsts?.first_payment_at, "milestone", "Recorded the first payment");
  push(firsts?.first_reminder_at, "milestone", "Sent the first fee reminder");
  if (firsts?.first_return_day) push(`${firsts.first_return_day}T12:00:00+05:30`, "milestone", "Came back on a later day");
  for (const u of uploads!) {
    push(u.created_at, "upload", `Sent their data (${u.source === "admin" ? "added by us" : "upload"})`);
    if (u.processed_at) push(u.processed_at, "upload", u.status === "failed" ? `Upload failed: ${u.message || "no reason given"}` : "Upload loaded");
  }
  for (const i of invites!) {
    if (i.role === "owner") {
      push(i.created_at, "admin", "Owner takeover link created");
      push(i.accepted_at, "milestone", "Owner took over the business");
    }
  }
  const auditLabels: Record<string, string> = {
    admin_autologin: "We logged in as the owner",
    admin_setup_created: "We created this business",
    crm_updated: "Stage or follow-up changed",
  };
  for (const a of audit!) {
    const action = String(a.action);
    if (action === "usage_report_view" || action === "setup_help_handled") continue;
    push(a.created_at, "admin", auditLabels[action] ?? action.replace(/_/g, " "));
  }
  for (const n of notes!) push(n.created_at, "note", String(n.body));
  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    business,
    daily,
    timeline: timeline.slice(0, 80),
    notes: notes!.map(n => ({ id: Number(n.id), body: String(n.body), createdAt: String(n.created_at) })),
    uploads: uploads!.map(u => ({
      id: Number(u.id),
      source: String(u.source),
      status: String(u.status),
      message: u.message ? String(u.message) : null,
      result: parseUploadResult(u.result as string | null),
      createdAt: String(u.created_at),
      processedAt: u.processed_at ? String(u.processed_at) : null,
    })),
    reminders: reminders!.map(r => ({ channel: String(r.channel), status: String(r.status), count: Number(r.count), lastAt: String(r.last_at) })),
    people: staff!.map(s => ({ name: String(s.name), email: String(s.email), role: String(s.role), lastSeenAt: s.last_seen_at ? String(s.last_seen_at) : null }))
      .filter(p => p.email !== SETUP_USER_EMAIL),
    stages: ADMIN_STAGES,
  };
});
