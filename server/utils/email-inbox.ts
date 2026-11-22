import { and, desc, eq, gt, sql } from "drizzle-orm";
import PostalMime from "postal-mime";
import { brandedEmail, type Quoted } from "./email-layout";

/**
 * AI replies to emails sent to support@memberbook.in, the email twin of the
 * WhatsApp auto-reply (server/utils/inbox-agent.ts).
 *
 * 1. Cloudflare Email Routing sends support@ mail to this Worker
 *    (server/plugins/inbound-email.ts). A copy always goes on to the admin's
 *    Gmail first, so nothing is lost if anything below fails.
 * 2. Bounces, auto-replies, newsletters and no-reply senders are only
 *    forwarded. Real emails are saved as a thread per sender address.
 * 3. Replies to our cold emails mark the lead "replied"; "unsubscribe / stop"
 *    marks it "unsubscribed" and gets no reply.
 * 4. Money, complaints and legal words go straight to the admin with a short
 *    holding reply. Everything else wakes the AI task (the same run that
 *    answers WhatsApp), which answers through /api/admin/inbox-agent/email/*.
 * 5. Replies go out from support@ through Resend, in the same email thread
 *    (In-Reply-To / References), with the same link, phone and secret checks
 *    as WhatsApp replies.
 */

export const SUPPORT_ADDRESS = "support@memberbook.in";
/** POST /api/admin/inbox/email/test sends from this address; it's treated like a customer. */
export const E2E_TEST_ADDRESS = "e2e-test@memberbook.in";
/** The AI answers emails up to this old. */
const EMAIL_WINDOW_MS = 7 * 86400000;
const MAX_AI_REPLIES_PER_TURN = 2;
const MAX_AI_REPLIES_PER_HOUR = 6;
export const MAX_EMAIL_REPLY_CHARS = 2500;
const MAX_BODY_CHARS = 8000;

export type EmailThread = typeof schema.emailThreads.$inferSelect;

export const EMAIL_HOLDING_REPLY = "Thanks for your email. I've passed this to Pravin from the MemberBook team and he'll reply to you soon.";

// ---------------------------------------------------------------------------
// Reading an incoming email
// ---------------------------------------------------------------------------

export interface ParsedEmail {
  from: string;
  name: string | null;
  subject: string;
  messageId: string | null;
  references: string | null;
  text: string;
  attachments: { name: string; type: string; size: number }[];
  headers: Record<string, string>;
}

export async function parseEmail(raw: ArrayBuffer | Uint8Array | string): Promise<ParsedEmail> {
  const mail = await PostalMime.parse(raw);
  const headers: Record<string, string> = {};
  for (const h of mail.headers ?? []) headers[h.key.toLowerCase()] = String(h.value ?? "");
  const fromAddr = mail.from && "address" in mail.from ? mail.from.address : "";
  const replyTo = mail.replyTo?.[0] && "address" in mail.replyTo[0] ? mail.replyTo[0].address : "";
  let text = mail.text?.trim() || htmlToText(mail.html ?? "");
  text = stripQuoted(text) || text;
  return {
    from: String(replyTo || fromAddr || "").trim().toLowerCase(),
    name: (mail.from?.name || "").trim() || null,
    subject: (mail.subject || "").replace(/\s+/g, " ").trim().slice(0, 300),
    messageId: mail.messageId?.trim() || null,
    references: [headers.references, mail.inReplyTo].filter(Boolean).join(" ").trim().slice(0, 2000) || null,
    text: text.slice(0, MAX_BODY_CHARS),
    attachments: (mail.attachments ?? []).map(a => ({
      name: String(a.filename || "file"),
      type: String(a.mimeType || ""),
      size: typeof a.content === "string" ? a.content.length : (a.content as ArrayBuffer)?.byteLength ?? 0,
    })),
    headers,
  };
}

export function htmlToText(html: string) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Drop the quoted earlier emails under a reply ("On ... wrote:", "> ..."). */
export function stripQuoted(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const joined = `${line} ${lines[i + 1] ?? ""}`;
    if (/^\s*On .{4,200}wrote:\s*$/i.test(line) || /^\s*On .{4,200}$/i.test(line) && /wrote:\s*$/i.test(lines[i + 1] ?? "") && joined.length < 300) break;
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(line) || /^_{5,}\s*$/.test(line) || /^From:\s.+/i.test(line) && /^(Sent|Date):\s/i.test(lines[i + 1] ?? "")) break;
    if (/^\s*>/.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").trim();
}

/** Why this email gets no AI reply at all (only the Gmail copy), or null if a person wrote it. */
export function automatedReason(mail: Pick<ParsedEmail, "from" | "headers" | "subject">, envelopeFrom: string): string | null {
  const h = mail.headers;
  const from = mail.from;
  if (!envelopeFrom || envelopeFrom === "<>") return "bounce";
  if (!from || !from.includes("@")) return "no sender";
  if ((from.endsWith("@memberbook.in") || from.endsWith(".memberbook.in")) && from !== E2E_TEST_ADDRESS) return "our own address";
  if (/^(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounce[s]?|notifications?|alerts?|news(letter)?)([+.-]|@)/i.test(from)) return "no-reply sender";
  const auto = (h["auto-submitted"] || "").toLowerCase();
  if (auto && auto !== "no") return "auto-reply";
  if (/^(bulk|junk|list|auto_reply)$/i.test((h.precedence || "").trim())) return "bulk mail";
  if (h["x-autoreply"] || h["x-autorespond"] || h["x-auto-response-suppress"]?.match(/all|oof|autoreply/i)) return "auto-reply";
  if (h["list-id"] || h["list-unsubscribe"]) return "mailing list";
  if (/^(auto(matic)?\s*reply|out of (the )?office|delivery status notification|undeliverable|mail delivery (failed|subsystem))/i.test(mail.subject)) return "auto-reply";
  return null;
}

const OPT_OUT_RE = /^\s*(unsubscribe|stop|remove( me)?|opt[\s-]?out)\b|\b(unsubscribe me|remove me from|stop (emailing|sending|mailing)|don'?t (email|mail|contact) me|not interested)\b/i;

export function isOptOut(subject: string, text: string) {
  return OPT_OUT_RE.test(subject) || OPT_OUT_RE.test(text.slice(0, 400));
}

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------

export async function getThread(id: number) {
  const [row] = await db.select().from(schema.emailThreads).where(eq(schema.emailThreads.id, id)).limit(1);
  return row ?? null;
}

export async function updateThread(id: number, patch: Partial<Omit<EmailThread, "id" | "address">>) {
  await db.update(schema.emailThreads).set({ ...patch, updatedAt: new Date().toISOString() }).where(eq(schema.emailThreads.id, id));
}

export async function addEmailNote(threadId: number, text: string, by: "ai" | "system" | "admin") {
  await db.insert(schema.emailMessages).values({ threadId, direction: "note", body: text.slice(0, 2000), status: "note", sentBy: by });
}

/** Save an incoming email in its sender's thread (once per Message-ID). */
export async function saveIncomingEmail(mail: ParsedEmail) {
  if (mail.messageId) {
    const [dup] = await db.select({ id: schema.emailMessages.id, threadId: schema.emailMessages.threadId }).from(schema.emailMessages)
      .where(and(eq(schema.emailMessages.messageId, mail.messageId), eq(schema.emailMessages.direction, "in"))).limit(1);
    if (dup) return { threadId: dup.threadId, messageId: dup.id, duplicate: true };
  }
  const now = new Date().toISOString();
  const [thread] = await db.insert(schema.emailThreads)
    .values({ address: mail.from, name: mail.name, subject: mail.subject || null, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.emailThreads.address,
      set: { subject: mail.subject || sql`${schema.emailThreads.subject}`, name: mail.name ?? sql`${schema.emailThreads.name}`, updatedAt: now },
    })
    .returning();
  const [msg] = await db.insert(schema.emailMessages).values({
    threadId: thread!.id,
    direction: "in",
    messageId: mail.messageId,
    referencesHeader: mail.references,
    subject: mail.subject || null,
    body: mail.text || "(empty email)",
    attachments: mail.attachments.length ? JSON.stringify(mail.attachments) : null,
    status: "received",
  }).returning();
  return { threadId: thread!.id, messageId: msg!.id, duplicate: false };
}

interface EmailTimes { lastInId: number | null; lastOutId: number | null; lastAiNoteId: number | null; lastInAt: string | null; lastAdminOutAt: string | null }

export async function emailTimes(threadId: number): Promise<EmailTimes> {
  const rows = await db.all(sql`
    SELECT
      MAX(CASE WHEN direction = 'in' THEN id END) AS last_in_id,
      MAX(CASE WHEN direction = 'out' AND status = 'sent' THEN id END) AS last_out_id,
      MAX(CASE WHEN direction = 'note' AND sent_by = 'ai' THEN id END) AS last_ai_note_id,
      MAX(CASE WHEN direction = 'in' THEN created_at END) AS last_in_at,
      MAX(CASE WHEN direction = 'out' AND status = 'sent' AND sent_by = 'admin' THEN created_at END) AS last_admin_out_at
    FROM email_messages WHERE thread_id = ${threadId}
  `) as { last_in_id: number | null; last_out_id: number | null; last_ai_note_id: number | null; last_in_at: string | null; last_admin_out_at: string | null }[];
  const r = rows[0];
  return { lastInId: r?.last_in_id ?? null, lastOutId: r?.last_out_id ?? null, lastAiNoteId: r?.last_ai_note_id ?? null, lastInAt: r?.last_in_at ?? null, lastAdminOutAt: r?.last_admin_out_at ?? null };
}

export function emailUnanswered(t: Pick<EmailTimes, "lastInId" | "lastOutId" | "lastAiNoteId">) {
  return !!t.lastInId && t.lastInId > (t.lastOutId ?? 0) && t.lastInId > (t.lastAiNoteId ?? 0);
}

export function emailBlockedReason(thread: EmailThread, t: EmailTimes, now = Date.now()): string | null {
  if (thread.mode === "human") return "handed over to the admin";
  if (!t.lastInAt) return "they haven't written";
  if (now - new Date(t.lastInAt).getTime() > EMAIL_WINDOW_MS) return "their email is more than 7 days old";
  if (t.lastAdminOutAt && now - new Date(t.lastAdminOutAt).getTime() < ADMIN_HOLD_MS) return "the admin replied recently";
  return null;
}

export interface WaitingEmail { id: number; address: string; name: string | null; subject: string | null; lastInAt: string; claimed: boolean }

export async function listWaitingEmails(now = Date.now()): Promise<WaitingEmail[]> {
  const since = new Date(now - EMAIL_WINDOW_MS).toISOString();
  const rows = await db.all(sql`
    SELECT t.id, t.address, t.name, t.subject, t.mode, t.claimed_at,
      MAX(CASE WHEN m.direction = 'in' THEN m.id END) AS last_in_id,
      MAX(CASE WHEN m.direction = 'out' AND m.status = 'sent' THEN m.id END) AS last_out_id,
      MAX(CASE WHEN m.direction = 'note' AND m.sent_by = 'ai' THEN m.id END) AS last_ai_note_id,
      MAX(CASE WHEN m.direction = 'in' THEN m.created_at END) AS last_in_at,
      MAX(CASE WHEN m.direction = 'out' AND m.status = 'sent' AND m.sent_by = 'admin' THEN m.created_at END) AS last_admin_out_at
    FROM email_threads t JOIN email_messages m ON m.thread_id = t.id
    WHERE t.mode = 'auto' AND t.updated_at > ${since}
    GROUP BY t.id
  `) as { id: number; address: string; name: string | null; subject: string | null; mode: string; claimed_at: string | null; last_in_id: number | null; last_out_id: number | null; last_ai_note_id: number | null; last_in_at: string | null; last_admin_out_at: string | null }[];
  const out: WaitingEmail[] = [];
  for (const r of rows) {
    const t: EmailTimes = { lastInId: r.last_in_id, lastOutId: r.last_out_id, lastAiNoteId: r.last_ai_note_id, lastInAt: r.last_in_at, lastAdminOutAt: r.last_admin_out_at };
    if (!emailUnanswered(t)) continue;
    if (emailBlockedReason({ mode: r.mode } as EmailThread, t, now)) continue;
    const claimed = !!r.claimed_at && now - new Date(r.claimed_at).getTime() < CLAIM_MS;
    out.push({ id: r.id, address: r.address, name: r.name, subject: r.subject, lastInAt: r.last_in_at!, claimed });
  }
  return out.sort((a, b) => a.lastInAt.localeCompare(b.lastInAt));
}

export async function releaseStaleEmailClaims(now = Date.now()) {
  const stale = new Date(now - CLAIM_MS).toISOString();
  await db.update(schema.emailThreads).set({ claimedAt: null })
    .where(sql`${schema.emailThreads.claimedAt} IS NOT NULL AND ${schema.emailThreads.claimedAt} < ${stale}`);
}

export async function aiEmailRepliesAfter(threadId: number, opts: { afterId?: number; sinceIso?: string }) {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.emailMessages)
    .where(and(
      eq(schema.emailMessages.threadId, threadId),
      eq(schema.emailMessages.direction, "out"),
      eq(schema.emailMessages.sentBy, "ai"),
      opts.afterId !== undefined ? gt(schema.emailMessages.id, opts.afterId) : undefined,
      opts.sinceIso ? gt(schema.emailMessages.createdAt, opts.sinceIso) : undefined,
    )) as [{ count: number }];
  return Number(count);
}

export const EMAIL_AI_LIMITS = { perTurn: MAX_AI_REPLIES_PER_TURN, perHour: MAX_AI_REPLIES_PER_HOUR };

/** Phone numbers the AI may mention in this thread: MemberBook's plus any they wrote themselves. */
export async function emailAllowedPhones(threadId: number) {
  const rows = await db.select({ body: schema.emailMessages.body }).from(schema.emailMessages)
    .where(and(eq(schema.emailMessages.threadId, threadId), eq(schema.emailMessages.direction, "in")));
  const phones = new Set<string>();
  for (const r of rows) for (const m of r.body.match(/\+?\d[\d\s-]{8,}\d/g) ?? []) phones.add(m.replace(/\D/g, ""));
  return [...phones];
}

/** Problems with an emailed reply, or an empty list. Same link/phone/secret rules as WhatsApp, longer limit. */
export async function checkEmailReply(threadId: number, text: string) {
  const problems = checkAiReply(text, await emailAllowedPhones(threadId))
    .filter(p => !p.startsWith("keep replies under"));
  if (text.length > MAX_EMAIL_REPLY_CHARS) problems.push(`keep email replies under ${MAX_EMAIL_REPLY_CHARS} characters`);
  return problems;
}

// ---------------------------------------------------------------------------
// Sending a reply
// ---------------------------------------------------------------------------

/** The reply as branded HTML + text (see email-layout.ts), with their last email quoted under it. */
export function emailReplyBodies(text: string, quoted: Quoted | null, subject = "MemberBook") {
  return brandedEmail({ subject, body: text, quoted });
}

/** Reply in the thread from support@ through Resend, and log it. */
export async function sendEmailReply(threadId: number, text: string, by: "ai" | "admin" | "system") {
  const thread = await getThread(threadId);
  if (!thread) return { ok: false, error: "No such thread" };
  const [lastIn] = await db.select().from(schema.emailMessages)
    .where(and(eq(schema.emailMessages.threadId, threadId), eq(schema.emailMessages.direction, "in")))
    .orderBy(desc(schema.emailMessages.id)).limit(1);

  const baseSubject = (lastIn?.subject || thread.subject || "Your message to MemberBook").trim();
  const subject = /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
  const headers: Record<string, string> = {};
  if (lastIn?.messageId) {
    headers["In-Reply-To"] = lastIn.messageId;
    headers.References = [lastIn.referencesHeader, lastIn.messageId].filter(Boolean).join(" ").split(/\s+/).slice(-20).join(" ");
  }
  const bodies = emailReplyBodies(text, lastIn ? { name: thread.name, address: thread.address, at: lastIn.createdAt, body: lastIn.body } : null, subject);

  const apiKey = String(useRuntimeConfig().resendApiKey || "");
  let resendId: string | null = null;
  let error: string | null = null;
  if (!apiKey) error = "NUXT_RESEND_API_KEY is not set";
  else {
    try {
      resendId = await sendViaResend(apiKey, { to: thread.address, subject, text: bodies.text, html: bodies.html, headers });
    }
    catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }
  const [saved] = await db.insert(schema.emailMessages).values({
    threadId,
    direction: "out",
    messageId: resendId ? `resend:${resendId}` : null,
    subject,
    body: text,
    status: error ? "failed" : "sent",
    error,
    sentBy: by,
  }).returning();
  return { ok: !error, error: error ?? undefined, message: saved! };
}

/**
 * Start a new conversation from support@ (not a reply): saves a thread for the address so their
 * answer lands in /admin/inbox with our email above it, and the AI can pick it up.
 */
export async function sendNewEmail(opts: { to: string; name?: string | null; subject: string; text: string; by: "admin" | "system" }) {
  const apiKey = String(useRuntimeConfig().resendApiKey || "");
  if (!apiKey) return { ok: false, error: "NUXT_RESEND_API_KEY is not set" };
  const now = new Date().toISOString();
  const [thread] = await db.insert(schema.emailThreads)
    .values({ address: opts.to, name: opts.name ?? null, subject: opts.subject, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: schema.emailThreads.address, set: { updatedAt: now } })
    .returning();
  const bodies = emailReplyBodies(opts.text, null, opts.subject);
  let resendId: string | null = null;
  let error: string | null = null;
  try {
    resendId = await sendViaResend(apiKey, { to: opts.to, subject: opts.subject, text: bodies.text, html: bodies.html });
  }
  catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  const [saved] = await db.insert(schema.emailMessages).values({
    threadId: thread!.id,
    direction: "out",
    messageId: resendId ? `resend:${resendId}` : null,
    subject: opts.subject,
    body: opts.text,
    status: error ? "failed" : "sent",
    error,
    sentBy: opts.by,
  }).returning();
  return { ok: !error, error: error ?? undefined, threadId: thread!.id, message: saved! };
}

// ---------------------------------------------------------------------------
// Hand-over
// ---------------------------------------------------------------------------

type AlertEnv = Parameters<typeof sendAdminEmailVia>[0];

export async function handOffEmail(env: AlertEnv, threadId: number, opts: { reason: string; summary?: string; by: "ai" | "system"; holdingReply?: string | null }) {
  const thread = await getThread(threadId);
  if (!thread) return { holdingSent: false };
  const reason = opts.reason.replace(/\s+/g, " ").trim().slice(0, 200) || "needs a person";
  const summary = (opts.summary ?? "").trim().slice(0, 1500);
  await updateThread(threadId, { mode: "human", handoffReason: reason, handoffAt: new Date().toISOString(), claimedAt: null });
  await addEmailNote(threadId, `Handed to you: ${reason}${summary ? `\n${summary}` : ""}`, opts.by);

  let holdingSent = false;
  const holding = opts.holdingReply?.trim();
  if (holding && emailUnanswered(await emailTimes(threadId))) {
    holdingSent = (await sendEmailReply(threadId, holding.slice(0, 600), opts.by)).ok;
  }

  const [last] = await db.select({ body: schema.emailMessages.body, subject: schema.emailMessages.subject }).from(schema.emailMessages)
    .where(and(eq(schema.emailMessages.threadId, threadId), eq(schema.emailMessages.direction, "in")))
    .orderBy(desc(schema.emailMessages.id)).limit(1);
  const config = useRuntimeConfig();
  const who = thread.name ? `${thread.name} <${thread.address}>` : thread.address;
  const appUrl = String(config.public.appUrl || "https://memberbook.in");
  await sendAdminEmailVia(env, String(config.inboxAlertEmail || ""), `Email needs you: ${who}, ${reason}`, [
    `${who} needs a reply from you (${opts.by === "ai" ? "the AI handed it over" : "flagged automatically"}): ${reason}.`,
    summary ? `\n${summary}` : "",
    last ? `\nTheir last email (${last.subject || "no subject"}):\n${last.body.slice(0, 1500)}` : "",
    holdingSent ? `\nThey were told: "${holding}"` : "",
    `\nReply from support@ in the admin inbox (not from your own Gmail). The AI won't answer this thread until you press "Let AI reply" there.`,
    `Open it: ${appUrl}/admin/inbox?email=${threadId}`,
  ].join("\n"));
  return { holdingSent };
}

// ---------------------------------------------------------------------------
// Handling one incoming email (called by the Email Routing hook)
// ---------------------------------------------------------------------------

export async function handleIncomingEmail(raw: ArrayBuffer, envelopeFrom: string, env: AlertEnv): Promise<string> {
  const mail = await parseEmail(raw);
  const auto = automatedReason(mail, envelopeFrom);
  if (auto) return `ignored: ${auto}`;

  const saved = await saveIncomingEmail(mail);
  if (saved.duplicate) return "duplicate";
  const { threadId } = saved;

  // Replies to our cold emails.
  const [lead] = await db.select().from(schema.outreachLeads).where(eq(schema.outreachLeads.email, mail.from)).limit(1);
  if (lead && isOptOut(mail.subject, mail.text)) {
    const now = new Date().toISOString();
    await db.update(schema.outreachLeads).set({ status: "unsubscribed", updatedAt: now }).where(eq(schema.outreachLeads.id, lead.id));
    await addEmailNote(threadId, "Asked to stop: lead unsubscribed, no reply sent.", "system");
    await updateThread(threadId, { mode: "human", handoffReason: "asked to unsubscribe", handoffAt: now });
    return "opt-out";
  }
  if (lead && ["new", "sent", "followed_up"].includes(lead.status)) {
    await db.update(schema.outreachLeads).set({ status: "replied", updatedAt: new Date().toISOString() }).where(eq(schema.outreachLeads.id, lead.id));
    await addEmailNote(threadId, `Reply to our cold email (${lead.businessName}${lead.city ? `, ${lead.city}` : ""}): lead marked replied.`, "system");
  }

  const thread = await getThread(threadId);
  if (!thread || thread.mode === "human") return "saved (admin is handling this thread)";
  if (!(await isAutoReplyOn())) return "saved (auto-reply off)";

  const sensitive = sensitiveReason(`${mail.subject}\n${mail.text}`);
  if (sensitive) {
    await handOffEmail(env, threadId, { reason: sensitive, by: "system", holdingReply: EMAIL_HOLDING_REPLY });
    return `handed over: ${sensitive}`;
  }
  const fire = await fireInboxAgent("new email to support@");
  return `saved, AI ${fire.fired ? "started" : fire.detail}`;
}
