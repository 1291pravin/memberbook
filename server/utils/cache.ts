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
 * Invalidation map: which cache prefixes to clear when a resource is mutated.
 */
const INVALIDATION_MAP: Record<string, string[]> = {
  members: ["members", "members-expiring", "dashboard"],
  subscriptions: ["members", "members-expiring", "dashboard", "payments", "payments-pending"],
  payments: ["payments", "payments-pending", "dashboard", "members"],
  plans: ["plans"],
  inquiries: ["inquiries"],
  staff: ["staff"],
  invites: ["invites"],
  org: ["org", "dashboard"],
};

/**
 * Clear cached data for an org after a mutation.
 * Uses prefix-based clearing so all query variants are invalidated.
 *
 * Cache key format in storage: `nitro:handlers:_:org{orgId}{resource}....json`
 */
export async function invalidateCache(
  orgId: number | string,
  resource: string,
) {
  const prefixes = INVALIDATION_MAP[resource] || [resource];
  const storage = useStorage("cache");
  const allKeys = await storage.getKeys("nitro:handlers");
  const toRemove = allKeys.filter((key) =>
    prefixes.some((r) => key.includes(`org${orgId}${r}`)),
  );
  await Promise.all(toRemove.map((key) => storage.removeItem(key)));
}
