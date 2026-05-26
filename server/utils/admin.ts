import type { H3Event } from "h3";
import { db, schema } from "@nuxthub/db";

function getAdminToken(event: H3Event) {
  const authHeader = getHeader(event, "authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerToken = getHeader(event, "x-admin-token") || "";

  return bearerToken || headerToken;
}

function constantTimeMatch(actual: string, expected: string) {
  if (!actual || !expected || actual.length !== expected.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < actual.length; i += 1) {
    mismatch |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return mismatch === 0;
}

export function getConfiguredAdminPasswords(event: H3Event) {
  const config = useRuntimeConfig(event);
  const configured = config.adminPasswords || process.env.NUXT_ADMIN_PASSWORDS || process.env.ADMIN_PASSWORDS || "";

  return String(configured)
    .split(",")
    .map(password => password.trim())
    .filter(Boolean);
}

export function isValidAdminPassword(event: H3Event, password: string) {
  return getConfiguredAdminPasswords(event).some(expected => constantTimeMatch(password, expected));
}

export function isValidAdminToken(event: H3Event) {
  const config = useRuntimeConfig(event);
  const expectedToken = config.adminApiToken || process.env.NUXT_ADMIN_API_TOKEN || process.env.ADMIN_API_TOKEN || "";

  return constantTimeMatch(getAdminToken(event), String(expectedToken));
}

export async function requireAdminAccess(event: H3Event) {
  const passwords = getConfiguredAdminPasswords(event);
  const config = useRuntimeConfig(event);
  const expectedToken = config.adminApiToken || process.env.NUXT_ADMIN_API_TOKEN || process.env.ADMIN_API_TOKEN || "";

  if (!passwords.length && !expectedToken) {
    throw createError({
      statusCode: 500,
      statusMessage: "Admin access is not configured",
    });
  }

  const session = await getUserSession(event);
  if (session.admin?.authenticated || isValidAdminToken(event)) {
    return;
  }

  throw createError({
    statusCode: 401,
    statusMessage: "Admin login required",
  });
}

export function requireAdminApiToken(event: H3Event) {
  const config = useRuntimeConfig(event);
  const expectedToken = config.adminApiToken || process.env.NUXT_ADMIN_API_TOKEN || process.env.ADMIN_API_TOKEN || "";

  if (!expectedToken) {
    throw createError({
      statusCode: 500,
      statusMessage: "Admin API token is not configured",
    });
  }

  if (!isValidAdminToken(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid admin token",
    });
  }
}

export function readPositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export function daysAgoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function recordAdminAuditLog(
  event: H3Event,
  action: string,
  details: {
    targetUserId?: number | null;
    targetOrgId?: number | null;
    metadata?: Record<string, unknown>;
  } = {},
) {
  try {
    await db.insert(schema.adminAuditLogs).values({
      action,
      targetUserId: details.targetUserId ?? null,
      targetOrgId: details.targetOrgId ?? null,
      ipAddress: getRequestIP(event, { xForwardedFor: true }) || null,
      userAgent: getHeader(event, "user-agent") || null,
      metadata: details.metadata ? JSON.stringify(details.metadata) : null,
    });
  } catch (error) {
    console.warn("Failed to write admin audit log", error);
  }
}
