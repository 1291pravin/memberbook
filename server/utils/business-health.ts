import { sql } from "drizzle-orm";
import { getSetupUser } from "./org-setup";

/**
 * One row per business with everything the admin needs to judge how it is
 * doing: owner, real data, visits, money, collections, uploads and our own CRM
 * notes. Shared by the Businesses board, the Today page and the daily digest.
 */

export const ADMIN_STAGES = [
  { value: "new", label: "New lead" },
  { value: "contacted", label: "Contacted" },
  { value: "onboarding", label: "Onboarding" },
  { value: "live", label: "Live" },
  { value: "at_risk", label: "At risk" },
  { value: "lost", label: "Lost" },
] as const;
export type AdminStage = typeof ADMIN_STAGES[number]["value"];
export const ADMIN_STAGE_VALUES = ADMIN_STAGES.map(s => s.value) as string[];

/**
 * Health, worked out from usage alone:
 * - setting_up: we hold it for the owner (not handed over yet) or their upload is waiting to be loaded
 * - active: has real members and was used in the last 7 days
 * - slipping: has real members, last used 8 to 21 days ago
 * - churned: has real members, not used for more than 21 days
 * - new: no real members yet, signed up in the last 14 days
 * - never_started: no real members, signed up more than 14 days ago
 */
export type Health = "setting_up" | "active" | "slipping" | "churned" | "new" | "never_started";

export const HEALTH_ORDER: Health[] = ["active", "slipping", "setting_up", "new", "churned", "never_started"];

export const ACTIVE_DAYS = 7;
export const SLIPPING_DAYS = 21;
export const NEW_DAYS = 14;

export interface BusinessRow {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  isTest: boolean;
  ownerId: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerWhatsapp: string | null;
  heldBySetup: boolean;
  upiSet: boolean;
  autoReminders: boolean;
  setupHelpAskedAt: string | null;
  setupHelpHandledAt: string | null;
  realMembers: number;
  plans: number;
  activeDays7: number;
  activeDays30: number;
  activeDaysTotal: number;
  lastVisitDay: string | null;
  lastActiveAt: string | null;
  daysSinceActive: number | null;
  membersAdded30: number;
  payments30: number;
  collected30: number;
  paymentsTotal: number;
  collectedTotal: number;
  checkins30: number;
  unpaidSubscriptions: number;
  reminders30: number;
  claimsWaiting: number;
  uploadsWaiting: number;
  lastUploadStatus: string | null;
  lastUploadAt: string | null;
  stage: AdminStage | null;
  followUpOn: string | null;
  followUpReason: string | null;
  lastNoteAt: string | null;
  health: Health;
}

type RawRow = Record<string, unknown>;

const num = (v: unknown) => Number(v ?? 0) || 0;
const str = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

/** Whole days between an ISO time (or YYYY-MM-DD) and now. */
function daysSince(value: string | null): number | null {
  if (!value) return null;
  const t = new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

export function classifyHealth(r: Pick<BusinessRow, "heldBySetup" | "uploadsWaiting" | "realMembers" | "daysSinceActive" | "createdAt">): Health {
  if (r.heldBySetup || r.uploadsWaiting > 0) return "setting_up";
  if (r.realMembers > 0) {
    const d = r.daysSinceActive ?? Infinity;
    if (d <= ACTIVE_DAYS) return "active";
    if (d <= SLIPPING_DAYS) return "slipping";
    return "churned";
  }
  return (daysSince(r.createdAt) ?? 0) <= NEW_DAYS ? "new" : "never_started";
}

/** All businesses (or one, with `orgId`). Ones named test/demo/sample are flagged with isTest. */
export async function getBusinessRows(opts: { orgId?: number } = {}): Promise<BusinessRow[]> {
  const setupUser = await getSetupUser();
  const since7 = dateIST(-(ACTIVE_DAYS - 1));
  const since30 = dateIST(-29);
  const since30Iso = new Date(Date.now() - 30 * 86400000).toISOString();
  const orgFilter = opts.orgId ? sql`WHERE o.id = ${opts.orgId}` : sql``;

  const rows = await db.all(sql`
    SELECT
      o.id, o.name, o.type, o.created_at, o.owner_whatsapp, o.upi_id,
      o.auto_reminders_enabled, o.setup_help_consent_at, o.setup_help_handled_at,
      CASE WHEN lower(o.name) LIKE '%test%'
        OR lower(o.name) LIKE '%demo%'
        OR lower(o.name) LIKE '%sample%'
      THEN 1 ELSE 0 END AS is_test,
      ow.id AS owner_id, ow.name AS owner_name, ow.email AS owner_email,
      EXISTS (
        SELECT 1 FROM org_memberships sm WHERE sm.org_id = o.id AND sm.user_id = ${setupUser.id}
      ) AS held_by_setup,
      MAX(COALESCE(mc.count, 0) - COALESCE(json_array_length(o.demo_data_ids, '$.memberIds'), 0), 0) AS real_members,
      COALESCE(mc.added_30, 0) AS members_added_30,
      mc.last_at AS last_member_at,
      (SELECT COUNT(*) FROM subscription_plans p WHERE p.org_id = o.id AND p.active = 1) AS plans,
      COALESCE(vc.days_7, 0) AS active_days_7,
      COALESCE(vc.days_30, 0) AS active_days_30,
      COALESCE(vc.days_total, 0) AS active_days_total,
      vc.last_day AS last_visit_day,
      COALESCE(pc.count_30, 0) AS payments_30,
      COALESCE(pc.volume_30, 0) AS collected_30,
      COALESCE(pc.count, 0) AS payments_total,
      COALESCE(pc.volume, 0) AS collected_total,
      pc.last_at AS last_payment_at,
      COALESCE(cc.count_30, 0) AS checkins_30,
      cc.last_at AS last_checkin_at,
      (SELECT COUNT(*) FROM member_subscriptions s
        WHERE s.org_id = o.id AND s.status = 'active' AND s.payment_status != 'paid') AS unpaid_subscriptions,
      (SELECT COUNT(*) FROM reminder_logs r WHERE r.org_id = o.id AND r.created_at >= ${since30Iso}) AS reminders_30,
      (SELECT COUNT(*) FROM payment_links l
        WHERE l.org_id = o.id AND l.status = 'open' AND l.claimed_at IS NOT NULL) AS claims_waiting,
      (SELECT COUNT(*) FROM data_uploads u
        WHERE u.org_id = o.id AND u.status IN ('pending', 'processing')) AS uploads_waiting,
      (SELECT u.status FROM data_uploads u WHERE u.org_id = o.id ORDER BY u.id DESC LIMIT 1) AS last_upload_status,
      (SELECT u.created_at FROM data_uploads u WHERE u.org_id = o.id ORDER BY u.id DESC LIMIT 1) AS last_upload_at,
      crm.stage, crm.follow_up_on, crm.follow_up_reason,
      (SELECT MAX(n.created_at) FROM admin_org_notes n WHERE n.org_id = o.id) AS last_note_at
    FROM organizations o
    LEFT JOIN users ow ON ow.id = (
      SELECT om.user_id FROM org_memberships om
      WHERE om.org_id = o.id AND om.role = 'owner' AND om.user_id != ${setupUser.id}
      ORDER BY om.id LIMIT 1
    )
    LEFT JOIN (
      SELECT org_id, COUNT(*) AS count, MAX(created_at) AS last_at,
        SUM(CASE WHEN created_at >= ${since30Iso} THEN 1 ELSE 0 END) AS added_30
      FROM members GROUP BY org_id
    ) mc ON mc.org_id = o.id
    LEFT JOIN (
      SELECT org_id,
        COUNT(DISTINCT CASE WHEN day >= ${since7} THEN day END) AS days_7,
        COUNT(DISTINCT CASE WHEN day >= ${since30} THEN day END) AS days_30,
        COUNT(DISTINCT day) AS days_total,
        MAX(day) AS last_day
      FROM user_activity_days
      WHERE user_id != ${setupUser.id}
      GROUP BY org_id
    ) vc ON vc.org_id = o.id
    LEFT JOIN (
      SELECT org_id, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS volume, MAX(created_at) AS last_at,
        SUM(CASE WHEN date >= ${since30} THEN 1 ELSE 0 END) AS count_30,
        COALESCE(SUM(CASE WHEN date >= ${since30} THEN amount ELSE 0 END), 0) AS volume_30
      FROM payments GROUP BY org_id
    ) pc ON pc.org_id = o.id
    LEFT JOIN (
      SELECT org_id, MAX(checked_in_at) AS last_at,
        SUM(CASE WHEN checked_in_at >= ${since30Iso} THEN 1 ELSE 0 END) AS count_30
      FROM check_ins GROUP BY org_id
    ) cc ON cc.org_id = o.id
    LEFT JOIN admin_org_crm crm ON crm.org_id = o.id
    ${orgFilter}
    ORDER BY o.created_at DESC
  `) as RawRow[];

  return rows.map((r) => {
    const lastVisitDay = str(r.last_visit_day);
    // Visits are tracked since Nov 2026; older activity shows up as records created.
    const candidates = [
      lastVisitDay ? `${lastVisitDay}T12:00:00+05:30` : null,
      str(r.last_payment_at),
      str(r.last_member_at),
      str(r.last_checkin_at),
    ].filter((v): v is string => Boolean(v));
    const lastActiveAt = candidates.length
      ? candidates.reduce((a, b) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b))
      : null;

    const row = {
      id: num(r.id),
      name: String(r.name ?? ""),
      type: String(r.type ?? "other"),
      createdAt: String(r.created_at ?? ""),
      isTest: num(r.is_test) === 1,
      ownerId: r.owner_id ? num(r.owner_id) : null,
      ownerName: str(r.owner_name),
      ownerEmail: str(r.owner_email),
      ownerWhatsapp: str(r.owner_whatsapp),
      heldBySetup: num(r.held_by_setup) === 1,
      upiSet: Boolean(str(r.upi_id)),
      autoReminders: num(r.auto_reminders_enabled) === 1,
      setupHelpAskedAt: str(r.setup_help_consent_at),
      setupHelpHandledAt: str(r.setup_help_handled_at),
      realMembers: num(r.real_members),
      plans: num(r.plans),
      activeDays7: num(r.active_days_7),
      activeDays30: num(r.active_days_30),
      activeDaysTotal: num(r.active_days_total),
      lastVisitDay,
      lastActiveAt,
      daysSinceActive: daysSince(lastActiveAt),
      membersAdded30: num(r.members_added_30),
      payments30: num(r.payments_30),
      collected30: num(r.collected_30),
      paymentsTotal: num(r.payments_total),
      collectedTotal: num(r.collected_total),
      checkins30: num(r.checkins_30),
      unpaidSubscriptions: num(r.unpaid_subscriptions),
      reminders30: num(r.reminders_30),
      claimsWaiting: num(r.claims_waiting),
      uploadsWaiting: num(r.uploads_waiting),
      lastUploadStatus: str(r.last_upload_status),
      lastUploadAt: str(r.last_upload_at),
      stage: (str(r.stage) as AdminStage | null),
      followUpOn: str(r.follow_up_on),
      followUpReason: str(r.follow_up_reason),
      lastNoteAt: str(r.last_note_at),
    };
    return { ...row, health: classifyHealth(row) };
  });
}

export function healthLabel(h: Health): string {
  return {
    active: "Active",
    slipping: "Slipping",
    churned: "Churned",
    setting_up: "Setting up",
    new: "New",
    never_started: "Never started",
  }[h];
}

export function formatRupeesShort(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

/** Read and check the `orgId` route param. */
export function readOrgIdParam(event: import("h3").H3Event): number {
  const orgId = Number(getRouterParam(event, "orgId"));
  if (!Number.isInteger(orgId) || orgId < 1) {
    throw createError({ statusCode: 400, statusMessage: "Invalid business" });
  }
  return orgId;
}
