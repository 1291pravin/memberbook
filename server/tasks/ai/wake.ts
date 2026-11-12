/**
 * Hourly backup for the on-demand AI runs (server/utils/ai-runs.ts). The app
 * fires the AI tasks the moment work is queued; this zero-token check catches
 * anything that is still waiting: a fire that failed, a run that died holding a
 * claim, or a website the admin sent back. It fires a queue at most once every
 * BACKUP_GAP_MS, so stuck work can't burn tokens every hour.
 */
export default defineTask({
  meta: {
    name: "ai:wake",
    description: "Start the AI tasks if uploads or add-on requests are waiting",
  },
  async run() {
    const now = Date.now();
    const out: string[] = [];
    for (const queue of ["uploads", "services"] as const) {
      if (!aiRunsConfigured(queue)) {
        out.push(`${queue}=off`);
        continue;
      }
      const released = await releaseStaleClaims(queue, now);
      const waiting = await backupWorkWaiting(queue, now);
      if (!waiting) {
        out.push(`${queue}=empty${released ? ` released=${released}` : ""}`);
        continue;
      }
      const last = await lastAiFireAt(queue);
      if (last && now - last < BACKUP_GAP_MS) {
        out.push(`${queue}=waiting:${waiting} recently-fired`);
        continue;
      }
      const res = await fireAiRun(queue, `${waiting} item(s) still waiting (hourly check)`);
      out.push(`${queue}=waiting:${waiting} fired:${res.detail}`);
    }
    const result = out.join(" ");
    console.log(`[ai:wake] ${result}`);
    return { result };
  },
});
