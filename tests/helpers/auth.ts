import { $fetch, fetch, url } from "@nuxt/test-utils/e2e";

export interface Session {
  cookies: string;
  user?: { id: number; email: string; name: string };
  orgId?: number;
}

/**
 * Extract cookies from response headers.
 */
export function extractCookies(headers: Headers): string {
  const raw = headers.getSetCookie?.() ?? [];
  return raw.map((c: string) => c.split(";")[0]).join("; ");
}

/**
 * Merge new cookies into existing cookie string, replacing duplicates.
 */
function mergeCookies(existing: string, incoming: string): string {
  const map = new Map<string, string>();
  for (const part of existing.split("; ").filter(Boolean)) {
    const [key] = part.split("=");
    map.set(key, part);
  }
  for (const part of incoming.split("; ").filter(Boolean)) {
    const [key] = part.split("=");
    map.set(key, part);
  }
  return Array.from(map.values()).join("; ");
}

/**
 * Make a raw fetch request (native Response with status/headers).
 */
export async function rawFetch(
  path: string,
  opts: RequestInit & { body?: unknown } = {},
) {
  const { body, ...rest } = opts;
  return fetch(path, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...(rest.headers as Record<string, string>),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

/**
 * Register a new user, returns session with cookies.
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
}): Promise<Session> {
  const res = await rawFetch("/api/auth/register", {
    method: "POST",
    body: data,
  });
  const cookies = extractCookies(res.headers);
  const body = (await res.json()) as { user: { id: number; email: string; name: string } };
  return { cookies, user: body.user };
}

/**
 * Login an existing user, returns session with cookies.
 */
export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<Session> {
  const res = await rawFetch("/api/auth/login", {
    method: "POST",
    body: data,
  });
  const cookies = extractCookies(res.headers);
  const body = (await res.json()) as { user: { id: number; email: string; name: string } };
  return { cookies, user: body.user };
}

/**
 * Create an org and update the session with new cookies (containing currentOrg).
 */
export async function createOrgAndGetSession(
  session: Session,
  orgData: { name: string; type: string },
): Promise<Session> {
  const res = await rawFetch("/api/orgs/", {
    method: "POST",
    body: orgData,
    headers: { cookie: session.cookies },
  });
  const newCookies = extractCookies(res.headers);
  const merged = mergeCookies(session.cookies, newCookies);
  const body = (await res.json()) as { org: { id: number } };
  return { ...session, cookies: merged, orgId: body.org.id };
}

/**
 * Returns a $fetch wrapper that forwards session cookies.
 * Use for requests where you expect a successful JSON response.
 */
export function authFetch(session: Session) {
  return <T = unknown>(path: string, opts: Record<string, unknown> = {}) =>
    $fetch<T>(path, {
      ...opts,
      headers: {
        ...(opts.headers as Record<string, string> | undefined),
        cookie: session.cookies,
      },
    });
}

/**
 * Returns a raw fetch wrapper that forwards session cookies.
 * Use for asserting status codes on error responses.
 */
export function authFetchRaw(session: Session) {
  return (path: string, opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) =>
    rawFetch(path, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        cookie: session.cookies,
      },
    });
}
