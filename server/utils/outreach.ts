import { and, asc, eq, isNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Cold email outreach to gyms, libraries and coaching centres.
 *
 * Every email goes out from support@memberbook.in through Resend (NUXT_RESEND_API_KEY),
 * never from anyone's personal address. Each lead gets one first email and, if
 * they haven't replied or unsubscribed, one follow-up OUTREACH_FOLLOW_UP_DAYS later.
 * Nothing is sent unless NUXT_OUTREACH_ENABLED=true. At most `dailyCap` emails go
 * out per day (first emails + follow-ups together). Every email carries an
 * unsubscribe link (/unsubscribe/<token>) and a one-click List-Unsubscribe header.
 */

export const OUTREACH_FROM = "MemberBook <support@memberbook.in>";
export const OUTREACH_REPLY_TO = "support@memberbook.in";
export const OUTREACH_FOLLOW_UP_DAYS = 5;
const DEFAULT_DAILY_CAP = 20;

type Lead = typeof schema.outreachLeads.$inferSelect;

export function outreachConfig() {
  const config = useRuntimeConfig();
  const apiKey = String(config.resendApiKey || "");
  const enabled = String(config.outreach?.enabled ?? "false") === "true";
  const cap = Number(config.outreach?.dailyCap) || DEFAULT_DAILY_CAP;
  const appUrl = String(config.public?.appUrl || "https://memberbook.in").replace(/\/$/, "");
  return { apiKey, enabled, dailyCap: Math.min(Math.max(cap, 0), 100), appUrl };
}

export function newOutreachToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function normaliseEmail(value: unknown): string | null {
  const email = String(value ?? "").trim().toLowerCase();
  if (email.length > 200) return null;
  return /^[^\s@<>()",;:]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) ? email : null;
}

const typeWords: Record<string, { place: string; people: string }> = {
  gym: { place: "gym", people: "members" },
  library: { place: "library", people: "students" },
  coaching: { place: "coaching centre", people: "students" },
};

function words(lead: Lead) {
  return typeWords[lead.businessType || ""] || { place: "business", people: "members" };
}

function greeting(lead: Lead) {
  const first = (lead.contactName || "").trim().split(/\s+/)[0];
  return first ? `Hi ${first},` : "Hello,";
}

/** Plain-text bodies; the HTML version is the same text with links. */
export function outreachEmail(lead: Lead, kind: "first" | "follow_up", appUrl: string) {
  const w = words(lead);
  const unsubscribeUrl = `${appUrl}/unsubscribe/${lead.token}`;
  const site = `${appUrl}/?utm_source=email&utm_medium=email&utm_campaign=outreach-${kind}`;
  const subject = kind === "first"
    ? `Fee tracking for ${lead.businessName}`
    : `Re: Fee tracking for ${lead.businessName}`;

  const lines = kind === "first"
    ? [
        greeting(lead),
        "",
        `I found ${lead.businessName} online and had a quick question: how do you keep track of which ${w.people} have paid this month and who still owes fees?`,
        "",
        `MemberBook is a free app made for gyms, libraries and coaching centres in India. You send us your register (a photo or an Excel file) and we load it for you. After that it shows who owes fees each day and sends them a WhatsApp reminder with a UPI pay link, so the money comes straight to you.`,
        "",
        `It's free to use, and we set it up for you. If you'd like us to set up your ${w.place}, just reply to this email.`,
        "",
        "Team MemberBook",
        site,
      ]
    : [
        greeting(lead),
        "",
        `Just checking whether you saw my note last week. If chasing fees takes up your time, we can set up MemberBook for ${lead.businessName} for free. Reply with a photo of your register, or send it on WhatsApp to +91 91378 49812, and we'll load it the same day.`,
        "",
        "If it's not for you, no problem. This is my last email.",
        "",
        "Team MemberBook",
        site,
      ];

  const footer = `You're getting this because ${lead.businessName}'s email is listed publicly. Don't want emails from MemberBook? Unsubscribe: ${unsubscribeUrl}`;
  const text = [...lines, "", "--", footer, "MemberBook, Panvel, Maharashtra, India"].join("\n");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1e293b;max-width:560px">`
    + lines.map(l => l === site ? `<a href="${site}">memberbook.in</a>` : (l ? esc(l) : "")).join("<br>")
    + `<p style="margin-top:24px;font-size:12px;color:#475569">${esc(footer.replace(unsubscribeUrl, ""))}<a href="${unsubscribeUrl}">Unsubscribe</a><br>MemberBook, Panvel, Maharashtra, India</p></div>`;
  return { subject, text, html, unsubscribeUrl };
}

/** Send one email through Resend. Returns the Resend id, or throws with Resend's message. */
export async function sendViaResend(apiKey: string, msg: { to: string; subject: string; text: string; html: string; unsubscribeUrl?: string }) {
  const headers: Record<string, string> = {};
  if (msg.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${msg.unsubscribeUrl}>, <mailto:${OUTREACH_REPLY_TO}?subject=unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: OUTREACH_FROM,
      to: [msg.to],
      reply_to: OUTREACH_REPLY_TO,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      headers,
    }),
  });
  const body = await res.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message || body.name || "send failed"}`.slice(0, 300));
  return body.id || "";
}

function istDayStartIso(now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 3600000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - 5.5 * 3600000).toISOString();
}

/** Emails already sent today (IST), first emails and follow-ups together. */
export async function outreachSentToday() {
  const since = istDayStartIso();
  const [row] = await db.select({
    n: sql<number>`sum(case when ${schema.outreachLeads.sentAt} >= ${since} then 1 else 0 end) + sum(case when ${schema.outreachLeads.followedUpAt} >= ${since} then 1 else 0 end)`,
  }).from(schema.outreachLeads);
  return Number(row?.n || 0);
}

/**
 * Send today's batch: follow-ups first (they're due), then new leads, up to the
 * daily cap. Safe to run more than once a day: the cap counts what already went.
 */
export async function runOutreachBatch(opts: { limit?: number } = {}) {
  const cfg = outreachConfig();
  if (!cfg.enabled) return { skipped: "NUXT_OUTREACH_ENABLED is not true", sent: 0, failed: 0 };
  if (!cfg.apiKey) return { skipped: "NUXT_RESEND_API_KEY is not set", sent: 0, failed: 0 };

  let room = Math.max(0, cfg.dailyCap - await outreachSentToday());
  if (opts.limit !== undefined) room = Math.min(room, opts.limit);
  if (room === 0) return { skipped: "daily cap reached", sent: 0, failed: 0 };

  const followUpBefore = new Date(Date.now() - OUTREACH_FOLLOW_UP_DAYS * 86400000).toISOString();
  const followUps = await db.select().from(schema.outreachLeads)
    .where(and(eq(schema.outreachLeads.status, "sent"), isNull(schema.outreachLeads.followedUpAt), lte(schema.outreachLeads.sentAt, followUpBefore)))
    .orderBy(asc(schema.outreachLeads.sentAt)).limit(room);
  const fresh = followUps.length < room
    ? await db.select().from(schema.outreachLeads)
      .where(eq(schema.outreachLeads.status, "new"))
      .orderBy(asc(schema.outreachLeads.id)).limit(room - followUps.length)
    : [];

  let sent = 0;
  let failed = 0;
  for (const [lead, kind] of [...followUps.map(l => [l, "follow_up"] as const), ...fresh.map(l => [l, "first"] as const)]) {
    const now = new Date().toISOString();
    try {
      const mail = outreachEmail(lead, kind, cfg.appUrl);
      await sendViaResend(cfg.apiKey, { to: lead.email, ...mail });
      await db.update(schema.outreachLeads)
        .set(kind === "first"
          ? { status: "sent", sentAt: now, lastError: null, updatedAt: now }
          : { status: "followed_up", followedUpAt: now, lastError: null, updatedAt: now })
        .where(eq(schema.outreachLeads.id, lead.id));
      sent++;
    }
    catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      await db.update(schema.outreachLeads)
        .set({ status: kind === "first" ? "failed" : lead.status, lastError: message.slice(0, 300), updatedAt: now })
        .where(eq(schema.outreachLeads.id, lead.id));
      // A bad key or a Resend-side block will fail every send: stop the batch.
      if (/Resend (401|403|429)/.test(message)) break;
    }
  }
  return { sent, failed, followUps: followUps.length, firstEmails: fresh.length };
}
