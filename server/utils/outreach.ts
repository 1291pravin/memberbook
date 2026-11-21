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

/** A plain-text body plus a branded HTML version of the same words. */
export function outreachEmail(lead: Lead, kind: "first" | "follow_up", appUrl: string) {
  const w = words(lead);
  const unsubscribeUrl = `${appUrl}/unsubscribe/${lead.token}`;
  const step = kind === "first" ? "first" : "follow-up";
  const site = `${appUrl}/?utm_source=email&utm_medium=cold-email&utm_campaign=outreach-${step}&utm_content=${encodeURIComponent(lead.businessType || "other")}`;
  const subject = kind === "first"
    ? `Fee tracking for ${lead.businessName}`
    : `Re: Fee tracking for ${lead.businessName}`;
  const replySubject = encodeURIComponent(`Set up MemberBook for ${lead.businessName}`);
  const replyUrl = `mailto:${OUTREACH_REPLY_TO}?subject=${replySubject}`;

  const paragraphs = kind === "first"
    ? [
        `I found ${lead.businessName} online and had a quick question: how do you keep track of which ${w.people} have paid this month and who still owes fees?`,
        `MemberBook is a free app made for gyms, libraries and coaching centres in India. You send us your register (a photo or an Excel file) and we load it for you.`,
      ]
    : [
        `Just checking whether you saw my note last week. If chasing fees takes up your time, we can set up MemberBook for ${lead.businessName} for free.`,
        `Reply with a photo of your register, or send it on WhatsApp to +91 91378 49812, and we'll load it the same day.`,
      ];
  const bullets = kind === "first"
    ? [
        `See who owes fees today, in one list`,
        `WhatsApp reminders with a UPI pay link`,
        `Money goes straight to your own UPI`,
      ]
    : [];
  const closing = kind === "first"
    ? `It's free to use, and we set it up for you. If you'd like us to set up your ${w.place}, just reply to this email.`
    : `If it's not for you, no problem. This is my last email.`;
  const cta = kind === "first" ? "Yes, set it up for me" : "Send my register";

  const footer = `You're getting this because ${lead.businessName}'s email is listed publicly. Don't want emails from MemberBook? Unsubscribe: ${unsubscribeUrl}`;
  const text = [
    greeting(lead), "",
    ...paragraphs.flatMap(p => [p, ""]),
    ...(bullets.length ? [...bullets.map(b => `- ${b}`), ""] : []),
    closing, "",
    `See how MemberBook works: ${site}`, "",
    "Team MemberBook", "",
    "--", footer, "MemberBook, Panvel, Maharashtra, India",
  ].join("\n");

  const esc = (str: string) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const font = "font-family:'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
  const para = (t: string) => `<p style="margin:0 0 16px;${font};font-size:16px;line-height:1.6;color:#13232B">${esc(t)}</p>`;
  const bulletRows = bullets.map(b => `<tr><td width="28" valign="top" style="padding:6px 0;${font};font-size:16px;line-height:1.5;color:#0F766E;font-weight:700">&#10003;</td><td style="padding:6px 0;${font};font-size:15px;line-height:1.5;color:#13232B">${esc(b)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F4F2EC">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(kind === "first" ? "Free fee tracking and WhatsApp reminders. We set it up for you." : "We can load your register the same day, free.")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2EC"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;border:1px solid #E7E4DC">
<tr><td style="padding:24px 28px 8px"><a href="${site}"><img src="${appUrl}/logo.png" width="150" height="36" alt="MemberBook" style="display:block;border:0;width:150px;height:auto"></a></td></tr>
<tr><td style="padding:16px 28px 4px">
${para(greeting(lead))}
${paragraphs.map(para).join("\n")}
${bullets.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#F0FAF8;border-radius:12px;width:100%"><tr><td style="padding:12px 16px"><table role="presentation" cellpadding="0" cellspacing="0">${bulletRows}</table></td></tr></table>` : ""}
${para(closing)}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 12px"><tr><td style="border-radius:10px;background:#0F766E"><a href="${replyUrl}" style="display:inline-block;padding:13px 22px;${font};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px">${esc(cta)}</a></td></tr></table>
<p style="margin:0 0 22px;${font};font-size:15px;line-height:1.6"><a href="${site}" style="color:#0F766E;font-weight:700;text-decoration:underline">See how MemberBook works &rarr;</a></p>
<p style="margin:0 0 4px;${font};font-size:16px;line-height:1.6;color:#13232B">Team MemberBook</p>
<p style="margin:0 0 24px;${font};font-size:14px;line-height:1.6"><a href="${site}" style="color:#0F766E;text-decoration:none">memberbook.in</a> &middot; <span style="color:#475569">WhatsApp +91 91378 49812</span></p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px"><tr><td style="padding:16px 28px;${font};font-size:12px;line-height:1.6;color:#475569;text-align:center">
You're getting this because ${esc(lead.businessName)}'s email is listed publicly.<br><a href="${unsubscribeUrl}" style="color:#475569">Unsubscribe</a> &middot; MemberBook, Panvel, Maharashtra, India
</td></tr></table>
</td></tr></table></body></html>`;
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
