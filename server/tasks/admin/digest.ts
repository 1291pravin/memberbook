/**
 * Daily admin digest email at 09:00 IST to NUXT_INBOX_ALERT_EMAIL, through the
 * ALERT_EMAIL send_email binding. Does nothing if either is missing.
 */
export default defineTask({
  meta: {
    name: "admin:digest",
    description: "Email the admin a daily summary and to-do list",
  },
  async run({ context }) {
    const config = useRuntimeConfig();
    const to = String(config.inboxAlertEmail || "");
    const env = (context as { cloudflare?: { env?: Record<string, unknown> } } | undefined)?.cloudflare?.env;
    if (!to || !env?.ALERT_EMAIL) {
      return { result: "skipped: alert email not configured" };
    }

    const digest = await buildAdminDigest(String(config.public.appUrl || ""));
    const sent = await sendAdminEmailVia(env as Parameters<typeof sendAdminEmailVia>[0], to, digest.subject, digest.text);
    console.log(`[admin:digest] sent=${sent} todos=${digest.todoCount}`);
    return { result: sent ? `sent, ${digest.todoCount} to do` : "failed" };
  },
});
