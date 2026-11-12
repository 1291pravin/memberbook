import type { H3Event } from "h3";

/**
 * Email the admin (NUXT_INBOX_ALERT_EMAIL) through the Cloudflare Email Routing
 * "send_email" binding (ALERT_EMAIL in wrangler.jsonc). The recipient must be a
 * verified Email Routing destination address. Silently does nothing when either
 * is missing, and never throws.
 */
export async function sendAdminEmail(event: H3Event, subjectText: string, text: string) {
  const to = String(useRuntimeConfig(event).inboxAlertEmail || "");
  const env = event.context.cloudflare?.env as AlertEnv | undefined;
  await sendAdminEmailVia(env, to, subjectText, text);
}

type AlertEnv = { ALERT_EMAIL?: { send: (m: unknown) => Promise<void> } };

/**
 * Same as sendAdminEmail, for code without a request (scheduled tasks pass
 * `context.cloudflare.env`). Returns whether the email was handed to Cloudflare.
 */
export async function sendAdminEmailVia(env: AlertEnv | undefined, to: string, subjectText: string, text: string): Promise<boolean> {
  const binding = env?.ALERT_EMAIL;
  if (!to || !binding) return false;

  const from = "alerts@memberbook.in";
  const cleanSubject = subjectText.replace(/[\r\n]+/g, " ").slice(0, 150);
  const subject = `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(cleanSubject)))}?=`;
  const raw = [
    `From: MemberBook Alerts <${from}>`,
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
    return true;
  }
  catch (err) {
    console.error("[admin-email] email failed", err);
    return false;
  }
}

/** Email the admin when a new WhatsApp message arrives. */
export async function sendInboxAlert(event: H3Event, msg: { phone: string; name?: string | null; body: string }) {
  const who = msg.name ? `${msg.name} (+${msg.phone})` : `+${msg.phone}`;
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in");
  await sendAdminEmail(
    event,
    `WhatsApp: ${who}`,
    `${who} wrote:\n\n${msg.body}\n\nReply within 24 hours from the inbox: ${appUrl}/admin/inbox\n`,
  );
}
