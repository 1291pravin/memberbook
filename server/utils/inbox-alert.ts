import type { H3Event } from "h3";

/**
 * Email the admin when a new WhatsApp message arrives, using the Cloudflare
 * Email Routing "send_email" binding (ALERT_EMAIL in wrangler.jsonc). The
 * recipient (NUXT_INBOX_ALERT_EMAIL) must be a verified Email Routing
 * destination address. Silently does nothing when either is missing.
 */
export async function sendInboxAlert(event: H3Event, msg: { phone: string; name?: string | null; body: string }) {
  const to = String(useRuntimeConfig(event).inboxAlertEmail || "");
  const env = event.context.cloudflare?.env as { ALERT_EMAIL?: { send: (m: unknown) => Promise<void> } } | undefined;
  const binding = env?.ALERT_EMAIL;
  if (!to || !binding) return;

  const from = "alerts@memberbook.in";
  const who = msg.name ? `${msg.name} (+${msg.phone})` : `+${msg.phone}`;
  const subjectText = `WhatsApp: ${who}`.replace(/[\r\n]+/g, " ").slice(0, 150);
  const subject = `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(subjectText)))}?=`;
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in");
  const text = `${who} wrote:\n\n${msg.body}\n\nReply within 24 hours from the inbox: ${appUrl}/admin/inbox\n`;
  const raw = [
    `From: MemberBook Inbox <${from}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    `Message-ID: <${crypto.randomUUID()}@memberbook.in>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
  ].join("\r\n");

  try {
    const { EmailMessage } = await import("cloudflare:email");
    await binding.send(new EmailMessage(from, to, raw));
  }
  catch (err) {
    console.error("[inbox-alert] email failed", err);
  }
}
