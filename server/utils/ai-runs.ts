import type { H3Event } from "h3";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";

/**
 * Start the AI scheduled tasks only when there is work, instead of running them
 * every hour (most hourly runs found an empty queue and still cost tokens).
 *
 * - "uploads": the task that loads owners' member lists (data_uploads, pending).
 * - "services": the task that delivers add-ons (service_requests, new).
 *
 * Each task has an API trigger on claude.ai. Firing it is a plain HTTP POST
 * with that task's own bearer token, so the check itself costs no tokens:
 *   NUXT_AI_RUNS_UPLOADS_TRIGGER_ID / NUXT_AI_RUNS_UPLOADS_TOKEN
 *   NUXT_AI_RUNS_SERVICES_TRIGGER_ID / NUXT_AI_RUNS_SERVICES_TOKEN
 * Without a token nothing is fired and the queue waits for a manual run.
 *
 * The app fires right after something is queued (wakeAiRunSoon), and the hourly
 * Worker cron (ai:wake) is the backup for anything left waiting.
 */
export type AiQueue = "uploads" | "services";

const FIRE_BETA = "experimental-cc-routine-2026-04-01";
/** Backup cron only re-fires a queue this long after its last fire. */
export const BACKUP_GAP_MS = 3 * 3600000;
/** Work this new is left to the instant fire. */
const BACKUP_MIN_AGE_MS = 15 * 60000;
/** Older work is left to the admin; the backup stops spending tokens on it. */
const BACKUP_MAX_AGE_MS = 3 * 86400000;
/** A claim this old means the run that took it died (matches the claim endpoints). */
const STALE_CLAIM_MS = 2 * 3600000;

interface AiRunsConfig {
  uploadsTriggerId?: string;
  uploadsToken?: string;
  servicesTriggerId?: string;
  servicesToken?: string;
}

function queueConfig(queue: AiQueue, event?: H3Event) {
  const cfg = (useRuntimeConfig(event).aiRuns || {}) as AiRunsConfig;
  const triggerId = String((queue === "uploads" ? cfg.uploadsTriggerId : cfg.servicesTriggerId) || "").trim();
  const token = String((queue === "uploads" ? cfg.uploadsToken : cfg.servicesToken) || "").trim();
  return triggerId && token ? { triggerId, token } : null;
}

export function aiRunsConfigured(queue: AiQueue, event?: H3Event) {
  return queueConfig(queue, event) !== null;
}

// The last fire time per queue lives in auth_rate_limits (a generic key/time
// table, window_start in seconds), so this needs no migration. Its cleanup
// drops rows older than a day, which just reads as "not fired lately".
const lastFireKey = (queue: AiQueue) => `ai-wake:${queue}`;

export async function lastAiFireAt(queue: AiQueue): Promise<number | null> {
  const [row] = await db.select({ at: schema.authRateLimits.windowStart }).from(schema.authRateLimits)
    .where(eq(schema.authRateLimits.key, lastFireKey(queue))).limit(1);
  return row ? Number(row.at) * 1000 : null;
}

async function recordFire(queue: AiQueue, at: number) {
  await db.insert(schema.authRateLimits).values({ key: lastFireKey(queue), windowStart: Math.floor(at / 1000), count: 1 })
    .onConflictDoUpdate({
      target: schema.authRateLimits.key,
      set: { windowStart: Math.floor(at / 1000), count: sql`${schema.authRateLimits.count} + 1` },
    });
}

/**
 * POST the task's fire endpoint. Never throws: a failed fire only means the
 * backup cron picks the work up later.
 */
export async function fireAiRun(queue: AiQueue, reason: string, event?: H3Event): Promise<{ fired: boolean; detail: string }> {
  const cfg = queueConfig(queue, event);
  if (!cfg) return { fired: false, detail: "not configured" };
  try {
    const res = await fetch(`https://api.anthropic.com/v1/claude_code/routines/${encodeURIComponent(cfg.triggerId)}/fire`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfg.token}`,
        "anthropic-beta": FIRE_BETA,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: `Started by MemberBook: ${reason}`.slice(0, 500) }),
    });
    if (!res.ok) {
      const body = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[ai-runs] fire ${queue} failed: ${res.status} ${body}`);
      return { fired: false, detail: `HTTP ${res.status}` };
    }
    await recordFire(queue, Date.now());
    console.log(`[ai-runs] fired ${queue}: ${reason}`);
    return { fired: true, detail: "ok" };
  }
  catch (err) {
    console.error(`[ai-runs] fire ${queue} error:`, err);
    return { fired: false, detail: "network error" };
  }
}

/**
 * Fire after the response is sent, so the owner never waits on it. Call this
 * right after queueing work.
 */
export function wakeAiRunSoon(event: H3Event, queue: AiQueue, reason: string) {
  const job = fireAiRun(queue, reason, event);
  const ctx = event.context.cloudflare?.context as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (ctx?.waitUntil) ctx.waitUntil(job);
  else if (typeof event.waitUntil === "function") event.waitUntil(job);
  return job;
}

/**
 * Put work whose run died (claimed over two hours ago, never finished) back in
 * the queue, so the next run sees it. Returns how many were released.
 */
export async function releaseStaleClaims(queue: AiQueue, now = Date.now()) {
  const stale = new Date(now - STALE_CLAIM_MS).toISOString();
  const oldest = new Date(now - BACKUP_MAX_AGE_MS).toISOString();
  if (queue === "uploads") {
    const t = schema.dataUploads;
    const rows = await db.update(t).set({ status: "pending", claimedAt: null })
      .where(and(eq(t.status, "processing"), gt(t.createdAt, oldest), or(isNull(t.claimedAt), lt(t.claimedAt, stale))))
      .returning({ id: t.id });
    return rows.length;
  }
  const t = schema.serviceRequests;
  const rows = await db.update(t).set({ status: "new", claimedAt: null, updatedAt: new Date(now).toISOString() })
    .where(and(eq(t.status, "working"), gt(t.updatedAt, oldest), or(isNull(t.claimedAt), lt(t.claimedAt, stale))))
    .returning({ id: t.id });
  return rows.length;
}

/**
 * Work the backup cron should start a run for: waiting longer than the instant
 * fire needs, but not so long that it is clearly stuck and needs a person.
 */
export async function backupWorkWaiting(queue: AiQueue, now = Date.now()) {
  const newest = new Date(now - BACKUP_MIN_AGE_MS).toISOString();
  const oldest = new Date(now - BACKUP_MAX_AGE_MS).toISOString();
  if (queue === "uploads") {
    const t = schema.dataUploads;
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(t)
      .where(and(eq(t.status, "pending"), lt(t.createdAt, newest), gt(t.createdAt, oldest))) as [{ count: number }];
    return Number(count);
  }
  const t = schema.serviceRequests;
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(t)
    .where(and(eq(t.status, "new"), lt(t.updatedAt, newest), gt(t.updatedAt, oldest))) as [{ count: number }];
  return Number(count);
}
