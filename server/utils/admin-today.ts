import { sql } from "drizzle-orm";

/**
 * What the admin should look at today: a to-do list built from every queue
 * (WhatsApp inbox, setup-help, help form, uploads, follow-ups, payment claims,
 * businesses going quiet, new signups nobody has spoken to) plus headline
 * numbers and a feed of the last two days. Used by /admin/today and the
 * daily digest email.
 */

export type TodoKind =
  | "whatsapp"
  | "setup_help"
  | "help_form"
  | "upload_failed"
  | "upload_stuck"
  | "follow_up"
  | "claims"
  | "slipping"
  | "new_signup";

export interface TodoItem {
  kind: TodoKind;
  /** Higher sorts first. */
  priority: number;
  title: string;
  detail: string;
  at: string | null;
  orgId: number | null;
  link: string;
  /** Extra ids the UI needs for inline actions. */
  ref?: { helpRequestId?: number; phone?: string };
}

export interface FeedItem {
  at: string;
  kind: "signup" | "upload" | "payments" | "help" | "note" | "whatsapp";
  text: string;
  orgId: number | null;
}

type Raw = Record<string, unknown>;

const UPLOAD_STUCK_HOURS = 2;

export async function getAdminToday() {
  const businesses = await getBusinessRows();
  const real = businesses.filter(b => !b.isTest);
  const byId = new Map(businesses.map(b => [b.id, b]));
  const today = todayIST();
  const since7 = dateIST(-6);
  const since48hIso = new Date(Date.now() - 48 * 3600000).toISOString();
  const stuckBeforeIso = new Date(Date.now() - UPLOAD_STUCK_HOURS * 3600000).toISOString();
  const failedSinceIso = new Date(Date.now() - 7 * 86400000).toISOString();

  const [unreadChats, helpForms, uploads, recentPayments, recentNotes, recentHelp, recentWhatsApp, week] = await Promise.all([
    db.all(sql`
      SELECT phone,
        (SELECT contact_name FROM whatsapp_messages c WHERE c.phone = m.phone AND c.contact_name IS NOT NULL ORDER BY c.created_at DESC LIMIT 1) AS name,
        COUNT(*) AS unread, MIN(created_at) AS first_at,
        (SELECT body FROM whatsapp_messages l WHERE l.phone = m.phone AND l.direction = 'in' ORDER BY l.created_at DESC, l.id DESC LIMIT 1) AS last_body
      FROM whatsapp_messages m
      WHERE direction = 'in' AND read_at IS NULL
      GROUP BY phone ORDER BY first_at LIMIT 30
    `),
    db.all(sql`
      SELECT id, name, business_name, message, source_page, created_at FROM contact_submissions
      WHERE status = 'new' ORDER BY created_at LIMIT 30
    `),
    db.all(sql`
      SELECT u.id, u.org_id, u.status, u.message, u.created_at, u.processed_at, o.name AS org_name
      FROM data_uploads u JOIN organizations o ON o.id = u.org_id
      WHERE (u.status = 'failed' AND COALESCE(u.processed_at, u.created_at) >= ${failedSinceIso})
        OR (u.status IN ('pending', 'processing') AND u.created_at < ${stuckBeforeIso})
      ORDER BY u.id LIMIT 30
    `),
    db.all(sql`
      SELECT org_id, date(created_at, '+330 minutes') AS day, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount, MAX(created_at) AS last_at
      FROM payments WHERE created_at >= ${since48hIso}
      GROUP BY org_id, day ORDER BY last_at DESC LIMIT 40
    `),
    db.all(sql`SELECT org_id, body, created_at FROM admin_org_notes WHERE created_at >= ${since48hIso} ORDER BY created_at DESC LIMIT 20`),
    db.all(sql`SELECT business_name, source_page, created_at FROM contact_submissions WHERE created_at >= ${since48hIso} ORDER BY created_at DESC LIMIT 20`),
    db.all(sql`
      SELECT phone, COUNT(*) AS count, MAX(created_at) AS last_at,
        (SELECT contact_name FROM whatsapp_messages c WHERE c.phone = m.phone AND c.contact_name IS NOT NULL ORDER BY c.created_at DESC LIMIT 1) AS name
      FROM whatsapp_messages m WHERE direction = 'in' AND created_at >= ${since48hIso}
      GROUP BY phone ORDER BY last_at DESC LIMIT 20
    `),
    db.all(sql`
      SELECT
        (SELECT COUNT(*) FROM payments p JOIN organizations o ON o.id = p.org_id
          WHERE p.date >= ${since7} AND lower(o.name) NOT LIKE '%test%' AND lower(o.name) NOT LIKE '%demo%' AND lower(o.name) NOT LIKE '%sample%') AS payments_7,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN organizations o ON o.id = p.org_id
          WHERE p.date >= ${since7} AND lower(o.name) NOT LIKE '%test%' AND lower(o.name) NOT LIKE '%demo%' AND lower(o.name) NOT LIKE '%sample%') AS collected_7,
        (SELECT COUNT(*) FROM reminder_logs WHERE created_at >= ${new Date(Date.now() - 7 * 86400000).toISOString()}) AS reminders_7
    `),
  ]) as Raw[][];

  const todos: TodoItem[] = [];

  for (const c of unreadChats!) {
    const who = c.name ? `${c.name} (+${c.phone})` : `+${c.phone}`;
    todos.push({
      kind: "whatsapp",
      priority: 100,
      title: `Reply on WhatsApp to ${who}`,
      detail: `${Number(c.unread)} unread: "${String(c.last_body ?? "").slice(0, 120)}"`,
      at: String(c.first_at),
      orgId: null,
      link: `/admin/inbox?phone=${c.phone}`,
      ref: { phone: String(c.phone) },
    });
  }

  for (const b of real.filter(b => b.setupHelpAskedAt && !b.setupHelpHandledAt)) {
    todos.push({
      kind: "setup_help",
      priority: 90,
      title: `${b.name} wants help setting up`,
      detail: `${b.ownerName || "The owner"} ticked "contact me on WhatsApp"${b.ownerWhatsapp ? ` · ${b.ownerWhatsapp}` : ""}`,
      at: b.setupHelpAskedAt,
      orgId: b.id,
      link: `/admin/businesses/${b.id}`,
    });
  }

  for (const h of helpForms!) {
    todos.push({
      kind: "help_form",
      priority: 85,
      title: `Help request from ${h.business_name || h.name}`,
      detail: String(h.message ?? "").slice(0, 160),
      at: String(h.created_at),
      orgId: null,
      link: "/admin/usage#help-requests",
      ref: { helpRequestId: Number(h.id) },
    });
  }

  for (const u of uploads!) {
    const failed = u.status === "failed";
    todos.push({
      kind: failed ? "upload_failed" : "upload_stuck",
      priority: failed ? 80 : 75,
      title: failed ? `${u.org_name}'s upload failed` : `${u.org_name}'s upload is still waiting`,
      detail: failed
        ? String(u.message || "No reason recorded. Load it by hand from Set up.")
        : `Sent ${hoursAgo(String(u.created_at))} hours ago. Check the hourly loading routine.`,
      at: String(u.processed_at || u.created_at),
      orgId: Number(u.org_id),
      link: `/admin/businesses/${u.org_id}`,
    });
  }

  for (const b of businesses.filter(b => b.followUpOn && b.followUpOn <= today)) {
    todos.push({
      kind: "follow_up",
      priority: b.followUpOn! < today ? 72 : 70,
      title: `Follow up with ${b.name}`,
      detail: `${b.followUpReason || "Planned follow-up"} · ${b.followUpOn! < today ? `overdue since ${shortDate(b.followUpOn!)}` : "due today"}`,
      at: `${b.followUpOn}T09:00:00+05:30`,
      orgId: b.id,
      link: `/admin/businesses/${b.id}`,
    });
  }

  for (const b of real.filter(b => b.claimsWaiting > 0)) {
    todos.push({
      kind: "claims",
      priority: 60,
      title: `${b.name}: ${b.claimsWaiting} ${b.claimsWaiting === 1 ? "member says" : "members say"} they paid`,
      detail: "The owner hasn't confirmed these yet. Remind them to tap Confirm on the Collections page.",
      at: null,
      orgId: b.id,
      link: `/admin/businesses/${b.id}`,
    });
  }

  for (const b of real.filter(b => b.health === "slipping" && b.stage !== "lost")) {
    todos.push({
      kind: "slipping",
      priority: 50,
      title: `${b.name} has gone quiet`,
      detail: `${b.realMembers} members, last active ${b.daysSinceActive} days ago. Check in with the owner before they drop off.`,
      at: b.lastActiveAt,
      orgId: b.id,
      link: `/admin/businesses/${b.id}`,
    });
  }

  // New signups (1 to 14 days old) with nothing loaded that nobody has spoken to yet.
  for (const b of real.filter(b => b.health === "new" && !b.stage && !b.setupHelpAskedAt && !b.lastNoteAt)) {
    const ageHours = hoursAgo(b.createdAt);
    if (ageHours < 12) continue;
    todos.push({
      kind: "new_signup",
      priority: 40,
      title: `Welcome ${b.name}`,
      detail: `Signed up ${Math.round(ageHours / 24) || 1} ${Math.round(ageHours / 24) === 1 ? "day" : "days"} ago with no members yet. Offer to load their register for them.`,
      at: b.createdAt,
      orgId: b.id,
      link: `/admin/businesses/${b.id}`,
    });
  }

  todos.sort((a, b) => b.priority - a.priority || String(a.at ?? "").localeCompare(String(b.at ?? "")));

  // Feed of the last 48 hours.
  const feed: FeedItem[] = [];
  for (const b of businesses.filter(b => b.createdAt >= since48hIso)) {
    feed.push({ at: b.createdAt, kind: "signup", text: `${b.name} signed up (${b.type})`, orgId: b.id });
  }
  for (const b of businesses.filter(b => b.lastUploadAt && b.lastUploadAt >= since48hIso)) {
    feed.push({ at: b.lastUploadAt!, kind: "upload", text: `${b.name} sent their data (${b.lastUploadStatus})`, orgId: b.id });
  }
  for (const p of recentPayments!) {
    const org = byId.get(Number(p.org_id));
    if (!org || org.isTest) continue;
    feed.push({
      at: String(p.last_at),
      kind: "payments",
      text: `${org.name} recorded ${Number(p.count)} ${Number(p.count) === 1 ? "payment" : "payments"} (${formatRupeesShort(Number(p.amount))})`,
      orgId: org.id,
    });
  }
  for (const h of recentHelp!) {
    feed.push({ at: String(h.created_at), kind: "help", text: `Help request from ${h.business_name}`, orgId: null });
  }
  for (const w of recentWhatsApp!) {
    feed.push({ at: String(w.last_at), kind: "whatsapp", text: `${Number(w.count)} WhatsApp ${Number(w.count) === 1 ? "message" : "messages"} from ${w.name || `+${w.phone}`}`, orgId: null });
  }
  for (const n of recentNotes!) {
    const org = byId.get(Number(n.org_id));
    feed.push({ at: String(n.created_at), kind: "note", text: `Note on ${org?.name ?? "a business"}: ${String(n.body).slice(0, 100)}`, orgId: Number(n.org_id) });
  }
  feed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const counts: Record<string, number> = {};
  for (const b of real) counts[b.health] = (counts[b.health] ?? 0) + 1;
  const w = week![0] ?? {};

  return {
    today,
    summary: {
      activeBusinesses: counts.active ?? 0,
      usedThisWeek: real.filter(b => b.activeDays7 > 0).length,
      slipping: counts.slipping ?? 0,
      churned: counts.churned ?? 0,
      settingUp: counts.setting_up ?? 0,
      newSignups7: real.filter(b => b.createdAt >= new Date(Date.now() - 7 * 86400000).toISOString()).length,
      payments7: Number(w.payments_7 ?? 0),
      collected7: Number(w.collected_7 ?? 0),
      reminders7: Number(w.reminders_7 ?? 0),
      realBusinesses: real.length,
    },
    counts,
    todos,
    feed: feed.slice(0, 40),
  };
}

function hoursAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3600000));
}

function shortDate(day: string): string {
  return new Date(`${day}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
