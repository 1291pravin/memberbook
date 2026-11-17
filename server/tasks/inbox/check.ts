/**
 * Every 10 minutes, zero tokens: keep the WhatsApp auto-reply honest
 * (server/utils/inbox-agent.ts).
 * - releases claims from AI runs that died,
 * - re-starts the AI task if a message has waited REFIRE_AFTER_MS,
 * - emails the admin once if a message has waited ALERT_AFTER_MS, so nobody is
 *   left unanswered because the AI task is broken.
 */
export default defineTask({
  meta: {
    name: "inbox:check",
    description: "Re-start the WhatsApp AI or alert the admin if a message waits too long",
  },
  async run({ context }) {
    const now = Date.now();
    if (!(await isAutoReplyOn())) return { result: "auto-reply off" };
    await releaseStaleInboxClaims(now);
    const waiting = await listWaitingChats(now);
    const stale = waiting.filter(w => now - new Date(w.lastInAt).getTime() > REFIRE_AFTER_MS);
    if (!stale.length) return { result: `waiting=${waiting.length}` };

    const fire = stale.some(w => !w.claimed)
      ? await fireInboxAgent(`${stale.length} chat(s) still waiting (10-minute check)`, { minGapMs: 8 * 60000 })
      : { fired: false, detail: "claimed" };

    const alertAfter = alertAfterMs(await getInboxRunner());
    let alerted = 0;
    const env = (context as { cloudflare?: { env?: Record<string, unknown> } } | undefined)?.cloudflare?.env as Parameters<typeof sendAdminEmailVia>[0];
    const config = useRuntimeConfig();
    const to = String(config.inboxAlertEmail || "");
    const appUrl = String(config.public.appUrl || "https://memberbook.in");
    for (const w of stale) {
      const waitedMin = Math.round((now - new Date(w.lastInAt).getTime()) / 60000);
      if (waitedMin * 60000 < alertAfter) continue;
      const conv = await getConversation(w.phone);
      if (conv.alertedAt && conv.alertedAt >= w.lastInAt) continue;
      const who = w.name ? `${w.name} (+${w.phone})` : `+${w.phone}`;
      const sent = await sendAdminEmailVia(env, to, `WhatsApp unanswered: ${who}`, [
        `${who} has been waiting ${waitedMin} minutes and the AI hasn't replied.`,
        "The AI task may be failing. Reply yourself, or check the scheduled task on claude.ai.",
        `Open the chat: ${appUrl}/admin/inbox?phone=${w.phone}`,
      ].join("\n\n"));
      if (sent) {
        alerted++;
        await updateConversation(w.phone, { alertedAt: new Date(now).toISOString() });
      }
    }
    const result = `waiting=${waiting.length} stale=${stale.length} fired=${fire.detail} alerted=${alerted}`;
    console.log(`[inbox:check] ${result}`);
    return { result };
  },
});
