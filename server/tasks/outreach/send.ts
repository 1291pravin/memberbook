/**
 * Cold email (server/utils/outreach.ts): follow-ups first, then new leads, up to the
 * daily cap. Runs on the every-10-minutes cron and sends OUTREACH_PER_RUN at a time
 * between 09:00 and 12:00 IST, because the Workers Free plan allows only 50
 * subrequests per invocation. Off unless NUXT_OUTREACH_ENABLED=true and
 * NUXT_RESEND_API_KEY is set.
 */
export default defineTask({
  meta: {
    name: "outreach:send",
    description: "Send today's outreach emails from support@memberbook.in",
  },
  async run() {
    if (!inOutreachWindow()) return { result: "outside the sending window" };
    return { result: await runOutreachBatch({ limit: OUTREACH_PER_RUN }) };
  },
});
