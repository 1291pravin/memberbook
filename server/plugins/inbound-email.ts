import { handleIncomingEmail } from "../utils/email-inbox";

/**
 * Emails to support@memberbook.in arrive here (Cloudflare Email Routing rule
 * "support@ → Send to Worker memberbook"). A copy always goes on to the admin's
 * Gmail (NUXT_INBOX_ALERT_EMAIL, a verified Email Routing destination) before
 * anything else, so mail is never lost; then the AI inbox picks it up
 * (server/utils/email-inbox.ts). Nothing in here may throw: a throw would
 * bounce the email back to the sender.
 */
interface InboundMessage {
  from: string;
  to: string;
  raw: ReadableStream;
  rawSize: number;
  forward: (to: string, headers?: Headers) => Promise<void>;
}

export default defineNitroPlugin((nitroApp) => {
  // The hook name isn't in Nitro's typed hook list for every preset.
  (nitroApp.hooks.hook as (name: string, fn: (arg: { message: InboundMessage; env: Record<string, unknown> }) => Promise<void>) => void)(
    "cloudflare:email",
    async ({ message, env }) => {
      const config = useRuntimeConfig();
      const copyTo = String(config.inboxAlertEmail || "");
      // Read the body once, before forwarding consumes the stream.
      let raw: ArrayBuffer | null = null;
      try {
        raw = await new Response(message.raw).arrayBuffer();
      }
      catch (err) {
        console.error("[inbound-email] could not read message", err);
      }
      if (copyTo) {
        try {
          await message.forward(copyTo);
        }
        catch (err) {
          console.error("[inbound-email] forward to admin failed", err);
        }
      }
      if (!raw || message.rawSize > 10 * 1024 * 1024) return;
      try {
        const result = await handleIncomingEmail(raw, message.from, env as Parameters<typeof handleIncomingEmail>[2]);
        console.log(`[inbound-email] ${result}`);
      }
      catch (err) {
        console.error("[inbound-email] handling failed", err);
      }
    },
  );
});
