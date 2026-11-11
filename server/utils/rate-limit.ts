import type { H3Event } from "h3";
import { sql } from "drizzle-orm";

export function getClientIp(event: H3Event): string {
  return getHeader(event, "cf-connecting-ip")
    || getRequestIP(event, { xForwardedFor: true })
    || "unknown";
}

/**
 * Fixed-window rate limit backed by D1. Throws 429 once `key` has been hit
 * more than `limit` times in the current `windowSeconds` window.
 */
export async function enforceRateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);

  const rows = await db.all<{ count: number }>(sql`
    INSERT INTO auth_rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN auth_rate_limits.window_start = excluded.window_start
        THEN auth_rate_limits.count + 1 ELSE 1 END,
      window_start = excluded.window_start
    RETURNING count
  `);

  // Occasionally prune stale rows so the table stays small.
  if (Math.random() < 0.01) {
    await db.run(sql`DELETE FROM auth_rate_limits WHERE window_start < ${now - 86400}`);
  }

  if (Number(rows[0]?.count ?? 0) > limit) {
    throw createError({
      statusCode: 429,
      statusMessage: "Too many attempts. Please wait a few minutes and try again.",
    });
  }
}
