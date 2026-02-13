import type { H3Event } from "h3";

/**
 * Build a deterministic cache key from the request.
 * Nitro normalizes keys by stripping non-alphanumeric chars,
 * so `org5membersstatusactive` is the stored form.
 */
export function orgCacheKey(event: H3Event, resource: string): string {
  const orgId = getRouterParam(event, "orgId");
  const query = getQuery(event);
  const sorted = Object.keys(query)
    .sort()
    .map((k) => `${k}${query[k]}`)
    .join("");
  return `org${orgId}${resource}${sorted || "all"}`;
}

/**
 * Clear ALL cached data for an org after any mutation.
 * Simple and reliable - avoids tracking complex dependency graphs.
 *
 * Cache key format in storage: `nitro:handlers:_:org{orgId}{resource}....json`
 */
export async function invalidateCache(orgId: number | string) {
  const storage = useStorage("cache");
  const allKeys = await storage.getKeys("nitro:handlers");
  const orgKeys = allKeys.filter((key) => key.includes(`org${orgId}`));
  await Promise.all(orgKeys.map((key) => storage.removeItem(key)));
}
