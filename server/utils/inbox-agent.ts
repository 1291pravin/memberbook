import type { H3Event } from "h3";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { getSetupUser } from "./org-setup";

/**
 * AI auto-replies for MemberBook's own WhatsApp number (the admin inbox).
 *
 * How it works:
 * 1. A message arrives (webhooks/whatsapp.post.ts). If auto-reply is on and the
 *    chat is in "auto" mode, the webhook starts the AI task (wakeInboxAgent).
 *    A few clearly sensitive words (refund, fraud, complaint, ...) skip the AI:
 *    the chat goes straight to the admin with an email and a short holding reply.
 * 2. The AI task (a claude.ai scheduled task, the same one that delivers add-ons)
 *    lists chats waiting for a reply, claims one, reads it with its context, and
 *    replies, hands it over to the admin, or marks it as needing no reply. All
 *    of that goes through /api/admin/inbox-agent/*, which enforces the rules
 *    below, so a confused or manipulated AI still can't do much harm.
 * 3. Everything the AI does is a row in whatsapp_messages: replies are
 *    direction "out" with sent_by "ai", hand-overs and skips are direction
 *    "note", so the admin sees the whole log in /admin/inbox.
 * 4. A 10-minute zero-token cron (inbox:check) re-fires the task if a message
 *    is still unanswered, and emails the admin if it stays unanswered.
 *
 * Rules the server enforces on every AI reply:
 * - only inside WhatsApp's 24-hour customer service window,
 * - not while the admin is talking to them (an admin reply pauses the AI for
 *   ADMIN_HOLD_MS) or after a hand-over (mode "human"),
 * - only as an answer to the newest unanswered message, at most
 *   MAX_AI_REPLIES_PER_TURN messages per turn and MAX_AI_REPLIES_PER_HOUR an hour,
 * - links only to memberbook.in, phone numbers only ours, theirs, or the
 *   business they are a member of, and nothing that looks like a secret.
 */

export const WINDOW_MS = 24 * 3600000;
/** Don't start a reply this close to the end of the window. */
const WINDOW_MARGIN_MS = 5 * 60000;
/** An admin reply pauses the AI in that chat for this long. */
export const ADMIN_HOLD_MS = 6 * 3600000;
/** A claim older than this means the run that took it died. */
export const CLAIM_MS = 15 * 60000;
const MAX_AI_REPLIES_PER_TURN = 3;
const MAX_AI_REPLIES_PER_HOUR = 10;
export const MAX_REPLY_CHARS = 1200;
/** Re-fire the AI if a message waits this long (inbox:check). */
export const REFIRE_AFTER_MS = 4 * 60000;
/** Email the admin once if a message waits this long. */
export const ALERT_AFTER_MS = 30 * 60000;
/** Don't start the AI task again within this long of the last start; the running one picks it up. */
const FIRE_DEBOUNCE_MS = 90 * 1000;

export const MEMBERBOOK_WHATSAPP = "919137849812";
const AUTO_REPLY_KEY = "inbox_auto_reply";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Auto-reply is on unless the admin switched it off on /admin/inbox. */
export async function isAutoReplyOn() {
  const [row] = await db.select({ value: schema.appSettings.value }).from(schema.appSettings)
    .where(eq(schema.appSettings.key, AUTO_REPLY_KEY)).limit(1);
  return row ? row.value === "on" : true;
}

export async function setAutoReply(on: boolean) {
  const now = new Date().toISOString();
  await db.insert(schema.appSettings).values({ key: AUTO_REPLY_KEY, value: on ? "on" : "off", updatedAt: now })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: on ? "on" : "off", updatedAt: now } });
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export type Conversation = typeof schema.whatsappConversations.$inferSelect;

export function cleanPhone(value: unknown) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 15);
}

export async function getConversation(phone: string): Promise<Conversation> {
  const [row] = await db.select().from(schema.whatsappConversations)
    .where(eq(schema.whatsappConversations.phone, phone)).limit(1);
  return row ?? { phone, mode: "auto", handoffReason: null, handoffAt: null, orgId: null, notes: null, claimedAt: null, alertedAt: null, updatedAt: new Date().toISOString() };
}

export async function updateConversation(phone: string, patch: Partial<Omit<Conversation, "phone">>) {
  const now = new Date().toISOString();
  await db.insert(schema.whatsappConversations).values({ phone, ...patch, updatedAt: now })
    .onConflictDoUpdate({ target: schema.whatsappConversations.phone, set: { ...patch, updatedAt: now } });
}

/** A log line in the chat (never sent to WhatsApp). */
export async function addInboxNote(phone: string, text: string, by: "ai" | "system" | "admin") {
  await db.insert(schema.whatsappMessages).values({
    direction: "note",
    phone,
    type: "note",
    body: text.slice(0, 2000),
    status: "note",
    sentBy: by,
  });
}

// "Unanswered" compares row ids (arrival order), not times: Meta's timestamps
// are whole seconds and come from the sender's phone, so a reply and the next
// message can carry times in the wrong order.
interface ChatTimes {
  lastInId: number | null;
  lastOutId: number | null;
  lastAiNoteId: number | null;
  lastInAt: string | null;
  lastOutAt: string | null;
  lastAdminOutAt: string | null;
  lastAiNoteAt: string | null;
}

/** The latest message times in one chat, which decide whether it needs a reply. */
export async function chatTimes(phone: string): Promise<ChatTimes> {
  const rows = await db.all(sql`
    SELECT
      MAX(CASE WHEN direction = 'in' AND type != 'reaction' THEN id END) AS last_in_id,
      MAX(CASE WHEN direction = 'out' THEN id END) AS last_out_id,
      MAX(CASE WHEN direction = 'note' AND sent_by = 'ai' THEN id END) AS last_ai_note_id,
      MAX(CASE WHEN direction = 'in' AND type != 'reaction' THEN created_at END) AS last_in_at,
      MAX(CASE WHEN direction = 'out' THEN created_at END) AS last_out_at,
      MAX(CASE WHEN direction = 'out' AND (sent_by IS NULL OR sent_by = 'admin') THEN created_at END) AS last_admin_out_at,
      MAX(CASE WHEN direction = 'note' AND sent_by = 'ai' THEN created_at END) AS last_ai_note_at
    FROM whatsapp_messages WHERE phone = ${phone}
  `) as { last_in_id: number | null; last_out_id: number | null; last_ai_note_id: number | null; last_in_at: string | null; last_out_at: string | null; last_admin_out_at: string | null; last_ai_note_at: string | null }[];
  const r = rows[0];
  return {
    lastInId: r?.last_in_id ?? null,
    lastOutId: r?.last_out_id ?? null,
    lastAiNoteId: r?.last_ai_note_id ?? null,
    lastInAt: r?.last_in_at ?? null,
    lastOutAt: r?.last_out_at ?? null,
    lastAdminOutAt: r?.last_admin_out_at ?? null,
    lastAiNoteAt: r?.last_ai_note_at ?? null,
  };
}

export function windowOpen(lastInAt: string | null, now = Date.now(), margin = 0) {
  return !!lastInAt && now - new Date(lastInAt).getTime() < WINDOW_MS - margin;
}

/** Why the AI may not answer this chat right now, or null if it may. */
export function blockedReason(conv: Conversation, t: ChatTimes, now = Date.now()): string | null {
  if (conv.mode === "human") return "handed over to the admin";
  if (!t.lastInAt) return "they haven't written";
  if (!windowOpen(t.lastInAt, now, WINDOW_MARGIN_MS)) return "the 24-hour window has closed";
  if (t.lastAdminOutAt && now - new Date(t.lastAdminOutAt).getTime() < ADMIN_HOLD_MS) return "the admin replied recently";
  return null;
}

/** Their newest message is still unanswered (no reply and no "no reply needed" note after it). */
export function isUnanswered(t: Pick<ChatTimes, "lastInId" | "lastOutId" | "lastAiNoteId">) {
  if (!t.lastInId) return false;
  return t.lastInId > (t.lastOutId ?? 0) && t.lastInId > (t.lastAiNoteId ?? 0);
}

export interface WaitingChat {
  phone: string;
  name: string | null;
  lastInAt: string;
  claimed: boolean;
}

/** Chats the AI should answer: unanswered, inside the window, not paused or handed over. */
export async function listWaitingChats(now = Date.now()): Promise<WaitingChat[]> {
  const since = new Date(now - WINDOW_MS).toISOString();
  const rows = await db.all(sql`
    SELECT m.phone,
      MAX(CASE WHEN m.direction = 'in' AND m.type != 'reaction' THEN m.id END) AS last_in_id,
      MAX(CASE WHEN m.direction = 'out' THEN m.id END) AS last_out_id,
      MAX(CASE WHEN m.direction = 'note' AND m.sent_by = 'ai' THEN m.id END) AS last_ai_note_id,
      MAX(CASE WHEN m.direction = 'in' AND m.type != 'reaction' THEN m.created_at END) AS last_in_at,
      MAX(CASE WHEN m.direction = 'out' THEN m.created_at END) AS last_out_at,
      MAX(CASE WHEN m.direction = 'out' AND (m.sent_by IS NULL OR m.sent_by = 'admin') THEN m.created_at END) AS last_admin_out_at,
      MAX(CASE WHEN m.direction = 'note' AND m.sent_by = 'ai' THEN m.created_at END) AS last_ai_note_at,
      (SELECT c.contact_name FROM whatsapp_messages c WHERE c.phone = m.phone AND c.contact_name IS NOT NULL ORDER BY c.created_at DESC LIMIT 1) AS name
    FROM whatsapp_messages m
    WHERE m.phone IN (SELECT phone FROM whatsapp_messages WHERE direction = 'in' AND created_at > ${since})
    GROUP BY m.phone
  `) as { phone: string; last_in_id: number | null; last_out_id: number | null; last_ai_note_id: number | null; last_in_at: string | null; last_out_at: string | null; last_admin_out_at: string | null; last_ai_note_at: string | null; name: string | null }[];

  const candidates = rows.filter(r => isUnanswered({ lastInId: r.last_in_id, lastOutId: r.last_out_id, lastAiNoteId: r.last_ai_note_id }));
  if (!candidates.length) return [];

  const convs = await db.select().from(schema.whatsappConversations)
    .where(inArray(schema.whatsappConversations.phone, candidates.map(c => c.phone)));
  const byPhone = new Map(convs.map(c => [c.phone, c]));

  const out: WaitingChat[] = [];
  for (const r of candidates) {
    const conv = byPhone.get(r.phone) ?? await getConversation(r.phone);
    const t: ChatTimes = { lastInId: r.last_in_id, lastOutId: r.last_out_id, lastAiNoteId: r.last_ai_note_id, lastInAt: r.last_in_at, lastOutAt: r.last_out_at, lastAdminOutAt: r.last_admin_out_at, lastAiNoteAt: r.last_ai_note_at };
    if (blockedReason(conv, t, now)) continue;
    const claimed = !!conv.claimedAt && now - new Date(conv.claimedAt).getTime() < CLAIM_MS;
    out.push({ phone: r.phone, name: r.name, lastInAt: r.last_in_at!, claimed });
  }
  return out.sort((a, b) => a.lastInAt.localeCompare(b.lastInAt));
}

// ---------------------------------------------------------------------------
// Sensitive messages go straight to the admin
// ---------------------------------------------------------------------------

const SENSITIVE: [RegExp, string][] = [
  [/\brefund|money\s*back|paise?\s*wapas|paisa\s*wapas|chargeback|charge\s*back/i, "asks for a refund"],
  [/\bfraud|scam|cheat(ed|ing)?\b|dhokha|chor\b|fake\s+company/i, "says fraud or cheating"],
  [/\bcomplain(t|ts|ed)?\b|shikayat|consumer\s*(court|forum)|\blawyer|legal\s*(action|notice)|\bpolice\b|\bfir\b|cyber\s*cell/i, "a complaint or legal threat"],
  [/\b(deducted|debited)\b|paid\s+but|payment\s+(failed|stuck|pending)|double\s+(charged|payment)|charged\s+(twice|me)/i, "a payment problem"],
];

/** Clear money disputes, complaints and legal threats: the AI doesn't touch these. */
export function sensitiveReason(text: string): string | null {
  for (const [re, reason] of SENSITIVE) if (re.test(text)) return reason;
  return null;
}

export const HOLDING_REPLY = "Thanks for your message. I've passed this to Pravin from the MemberBook team and he'll reply to you here soon.";

/**
 * Give the chat to the admin: the AI stops answering it, the admin gets an
 * email, and (if asked and still possible) the customer gets a short holding
 * reply so they aren't left waiting in silence.
 */
export async function handOff(event: H3Event, phone: string, opts: { reason: string; summary?: string; by: "ai" | "system"; holdingReply?: string | null }) {
  const reason = opts.reason.replace(/\s+/g, " ").trim().slice(0, 200) || "needs a person";
  const summary = (opts.summary ?? "").trim().slice(0, 1500);
  await updateConversation(phone, { mode: "human", handoffReason: reason, handoffAt: new Date().toISOString(), claimedAt: null });
  await addInboxNote(phone, `Handed to you: ${reason}${summary ? `\n${summary}` : ""}`, opts.by);

  let holdingSent = false;
  const holding = opts.holdingReply?.trim();
  if (holding && canSendWhatsAppCloud()) {
    const t = await chatTimes(phone);
    if (windowOpen(t.lastInAt) && isUnanswered(t)) {
      holdingSent = (await sendLoggedText(phone, holding.slice(0, 600), opts.by)).ok;
    }
  }

  const [last] = await db.select({ body: schema.whatsappMessages.body, contactName: schema.whatsappMessages.contactName })
    .from(schema.whatsappMessages)
    .where(and(eq(schema.whatsappMessages.phone, phone), eq(schema.whatsappMessages.direction, "in")))
    .orderBy(desc(schema.whatsappMessages.createdAt)).limit(1);
  const who = last?.contactName ? `${last.contactName} (+${phone})` : `+${phone}`;
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in");
  await sendAdminEmail(
    event,
    `WhatsApp needs you: ${who}, ${reason}`,
    [
      `${who} needs a reply from you (${opts.by === "ai" ? "the AI handed it over" : "flagged automatically"}): ${reason}.`,
      summary ? `\n${summary}` : "",
      last?.body ? `\nTheir last message:\n${last.body.slice(0, 1500)}` : "",
      holdingSent ? `\nThey were told: "${holding}"` : "",
      `\nThe AI won't reply to this chat until you press "Let AI reply" there.`,
      `Open the chat: ${appUrl}/admin/inbox?phone=${phone}`,
    ].join("\n"),
  );
  return { holdingSent };
}

/** Send a free-text WhatsApp message and keep it in the inbox. */
export async function sendLoggedText(phone: string, text: string, by: "ai" | "admin" | "system") {
  const result = await sendWhatsAppText(phone, text);
  const [saved] = await db.insert(schema.whatsappMessages).values({
    waMessageId: result.messageId ?? null,
    direction: "out",
    phone,
    type: "text",
    body: text,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? null : result.error ?? null,
    sentBy: by,
  }).returning();
  return { ok: result.ok, error: result.error, message: saved! };
}

// ---------------------------------------------------------------------------
// Who is this? (context for the AI)
// ---------------------------------------------------------------------------

function last10(phone: string | null | undefined) {
  return String(phone ?? "").replace(/\D/g, "").slice(-10);
}

export interface ContactContext {
  /** Businesses this number owns or that we set up for them. */
  businesses: {
    orgId: number;
    name: string;
    type: string;
    members: number;
    ownerHasLoggedIn: boolean;
    autoReminders: boolean;
    uploads: { id: number; status: string; createdAt: string; membersLoaded: number | null; message: string | null }[];
  }[];
  /** Businesses that sent this number a fee reminder or receipt from the MemberBook number. */
  memberOf: { orgName: string; orgType: string; ownerWhatsapp: string | null; memberName: string; lastReminderAt: string }[];
}

export async function contactContext(phone: string, conv: Conversation): Promise<ContactContext> {
  const tail = last10(phone);
  const setupUser = await getSetupUser();

  // Businesses: the one linked to this chat, plus any whose owner WhatsApp is this number.
  const owned = await db.select({ id: schema.organizations.id, name: schema.organizations.name, type: schema.organizations.type, autoReminders: schema.organizations.autoRemindersEnabled })
    .from(schema.organizations)
    .where(sql`${schema.organizations.id} = ${conv.orgId ?? -1} OR substr(replace(${schema.organizations.ownerWhatsapp}, ' ', ''), -10) = ${tail}`)
    .limit(5);

  const businesses: ContactContext["businesses"] = [];
  for (const org of owned) {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.members)
      .where(eq(schema.members.orgId, org.id)) as [{ count: number }];
    const owners = await db.select({ userId: schema.orgMemberships.userId }).from(schema.orgMemberships)
      .where(and(eq(schema.orgMemberships.orgId, org.id), eq(schema.orgMemberships.role, "owner")));
    const uploads = await db.select({ id: schema.dataUploads.id, status: schema.dataUploads.status, createdAt: schema.dataUploads.createdAt, result: schema.dataUploads.result, message: schema.dataUploads.message })
      .from(schema.dataUploads).where(eq(schema.dataUploads.orgId, org.id))
      .orderBy(desc(schema.dataUploads.createdAt)).limit(3);
    businesses.push({
      orgId: org.id,
      name: org.name,
      type: org.type,
      members: Number(count),
      ownerHasLoggedIn: owners.some(o => o.userId !== setupUser.id),
      autoReminders: !!org.autoReminders,
      uploads: uploads.map(u => ({ id: u.id, status: u.status, createdAt: u.createdAt, membersLoaded: parseUploadResult(u.result)?.membersLoaded ?? null, message: u.message })),
    });
  }

  // Gym/library members who got a reminder from our number and are writing back.
  const memberOf: ContactContext["memberOf"] = [];
  if (tail.length === 10) {
    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const rows = await db.select({
      orgName: schema.organizations.name,
      orgType: schema.organizations.type,
      ownerWhatsapp: schema.organizations.ownerWhatsapp,
      memberName: schema.members.name,
      lastReminderAt: sql<string>`max(${schema.reminderLogs.createdAt})`,
    })
      .from(schema.reminderLogs)
      .innerJoin(schema.members, eq(schema.members.id, schema.reminderLogs.memberId))
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.reminderLogs.orgId))
      .where(and(
        eq(schema.reminderLogs.channel, "whatsapp_api"),
        gt(schema.reminderLogs.createdAt, since),
        sql`substr(replace(${schema.members.phone}, ' ', ''), -10) = ${tail}`,
      ))
      .groupBy(schema.reminderLogs.orgId, schema.members.id)
      .limit(5);
    memberOf.push(...rows);
  }

  return { businesses, memberOf };
}

// ---------------------------------------------------------------------------
// Checking an AI reply before it goes out
// ---------------------------------------------------------------------------

const URL_RE = /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|in|net|org|io|co|me|ly|app|link|xyz|info|biz|site|online|store|shop|gl|to|cc|page|dev)\b(?:\/[^\s]*)?/gi;
const SECRET_RE = /sk-ant|bearer\s+[a-z0-9]|memberbook_[a-z_]*token|api[_\s-]?key|access[_\s-]?token|password\s*[:=]/i;

/** Problems with a reply the AI wants to send, or an empty list if it's fine. */
export function checkAiReply(text: string, allowedPhones: string[]): string[] {
  const problems: string[] = [];
  if (!text.trim()) problems.push("the reply is empty");
  if (text.length > MAX_REPLY_CHARS) problems.push(`keep replies under ${MAX_REPLY_CHARS} characters`);
  if (SECRET_RE.test(text)) problems.push("the reply looks like it contains a secret or token");

  for (const match of text.match(URL_RE) ?? []) {
    const host = match.replace(/^https?:\/\//i, "").split(/[/?#]/)[0]!.toLowerCase();
    const okHost = host === "memberbook.in" || host.endsWith(".memberbook.in");
    const okWaMe = host === "wa.me" && match.includes(MEMBERBOOK_WHATSAPP);
    if (!okHost && !okWaMe) problems.push(`links may only go to memberbook.in (found ${host})`);
  }

  const allowed = new Set([MEMBERBOOK_WHATSAPP, ...allowedPhones].map(last10).filter(p => p.length === 10));
  for (const match of text.match(/\+?\d[\d\s-]{8,}\d/g) ?? []) {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) continue;
    if (!allowed.has(digits.slice(-10))) problems.push(`phone numbers may only be MemberBook's, theirs, or their business owner's (found ${match.trim()})`);
  }
  return problems;
}

/** How many AI messages went to this chat since a time. */
export async function aiRepliesSince(phone: string, sinceIso: string) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.whatsappMessages)
    .where(and(
      eq(schema.whatsappMessages.phone, phone),
      eq(schema.whatsappMessages.direction, "out"),
      eq(schema.whatsappMessages.sentBy, "ai"),
      gt(schema.whatsappMessages.createdAt, sinceIso),
    )) as [{ count: number }];
  return Number(count);
}

export const AI_LIMITS = { perTurn: MAX_AI_REPLIES_PER_TURN, perHour: MAX_AI_REPLIES_PER_HOUR };

// ---------------------------------------------------------------------------
// Starting the AI task
// ---------------------------------------------------------------------------

const INBOX_FIRE_KEY = "ai-wake:inbox";

export async function lastInboxFireAt(): Promise<number | null> {
  const [row] = await db.select({ at: schema.authRateLimits.windowStart }).from(schema.authRateLimits)
    .where(eq(schema.authRateLimits.key, INBOX_FIRE_KEY)).limit(1);
  return row ? Number(row.at) * 1000 : null;
}

async function recordInboxFire(at: number) {
  await db.insert(schema.authRateLimits).values({ key: INBOX_FIRE_KEY, windowStart: Math.floor(at / 1000), count: 1 })
    .onConflictDoUpdate({ target: schema.authRateLimits.key, set: { windowStart: Math.floor(at / 1000), count: sql`${schema.authRateLimits.count} + 1` } });
}

/**
 * Start the AI task for the inbox. It's the add-on delivery task, which checks
 * the inbox first on every run. Skipped if a run started in the last 90
 * seconds: that run keeps checking for new messages before it ends.
 */
export async function fireInboxAgent(reason: string, opts: { event?: H3Event; minGapMs?: number } = {}) {
  if (!(await isAutoReplyOn())) return { fired: false, detail: "auto-reply off" };
  const now = Date.now();
  const last = await lastInboxFireAt();
  if (last && now - last < (opts.minGapMs ?? FIRE_DEBOUNCE_MS)) return { fired: false, detail: "recently started" };
  if (!aiRunsConfigured("services", opts.event)) return { fired: false, detail: "not configured" };
  await recordInboxFire(now);
  return fireAiRun("services", `WhatsApp inbox: ${reason}`, opts.event);
}

export function wakeInboxAgent(event: H3Event, reason: string) {
  const job = fireInboxAgent(reason, { event }).catch((err) => {
    console.error("[inbox-agent] fire failed", err);
    return { fired: false, detail: "error" };
  });
  const ctx = event.context.cloudflare?.context as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (ctx?.waitUntil) ctx.waitUntil(job);
  else if (typeof event.waitUntil === "function") event.waitUntil(job);
  return job;
}

/** Release claims from runs that died, so the chat is offered again. */
export async function releaseStaleInboxClaims(now = Date.now()) {
  const stale = new Date(now - CLAIM_MS).toISOString();
  await db.update(schema.whatsappConversations).set({ claimedAt: null })
    .where(sql`${schema.whatsappConversations.claimedAt} IS NOT NULL AND ${schema.whatsappConversations.claimedAt} < ${stale}`);
}

/**
 * The business this chat is setting up: the one linked to the chat, or else
 * one an admin already created for this number that the owner hasn't taken
 * over yet (it gets linked to the chat).
 */
export async function setupOrgForChat(phone: string, conv: Conversation): Promise<number | null> {
  if (conv.orgId) return conv.orgId;
  const setupUser = await getSetupUser();
  const [row] = await db.select({ id: schema.organizations.id })
    .from(schema.organizations)
    .innerJoin(schema.orgMemberships, and(eq(schema.orgMemberships.orgId, schema.organizations.id), eq(schema.orgMemberships.userId, setupUser.id)))
    .where(sql`substr(replace(${schema.organizations.ownerWhatsapp}, ' ', ''), -10) = ${last10(phone)}`)
    .orderBy(desc(schema.organizations.createdAt))
    .limit(1);
  if (!row) return null;
  await updateConversation(phone, { orgId: row.id });
  return row.id;
}

/** How many AI messages went to this chat after a message (by arrival order). */
export async function aiRepliesAfterId(phone: string, afterId: number) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.whatsappMessages)
    .where(and(
      eq(schema.whatsappMessages.phone, phone),
      eq(schema.whatsappMessages.direction, "out"),
      eq(schema.whatsappMessages.sentBy, "ai"),
      gt(schema.whatsappMessages.id, afterId),
    )) as [{ count: number }];
  return Number(count);
}
