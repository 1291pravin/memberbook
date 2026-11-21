/**
 * Daily cold email batch (09:00 IST): follow-ups first, then new leads, up to the
 * daily cap. Off unless NUXT_OUTREACH_ENABLED=true and NUXT_RESEND_API_KEY is set.
 * See server/utils/outreach.ts.
 */
export default defineTask({
  meta: {
    name: "outreach:send",
    description: "Send today's outreach emails from support@memberbook.in",
  },
  async run() {
    return { result: await runOutreachBatch() };
  },
});
