import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  // Only intercept org-scoped API routes
  if (!path.startsWith("/api/orgs/") || path === "/api/orgs/") {
    return;
  }

  // Parse orgId from /api/orgs/{orgId}/...
  const segments = path.split("/");
  const orgIdStr = segments[3];
  if (!orgIdStr || orgIdStr === "switch") {
    return;
  }

  // Every other route under /api/orgs/ is /api/orgs/[orgId]/..., and its
  // handler relies on event.context.access. A non-numeric id would otherwise
  // reach the handler with no access info and crash with a 500.
  if (!/^\d+$/.test(orgIdStr)) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" });
  }
  const orgId = Number(orgIdStr);

  // Require authenticated session
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  // Validate org access via session
  const currentOrg = session.currentOrg;
  if (!currentOrg || currentOrg.orgId !== orgId) {
    throw createError({
      statusCode: 403,
      statusMessage: "No access to this organization",
    });
  }

  // The session cookie lives for a year, so never trust the org/role it
  // carries: re-check the membership (and the user's session version) in the
  // database on every request. This is what makes removing a staff member, or
  // a forced sign-out, take effect immediately.
  const [membership] = await db
    .select({
      role: schema.orgMemberships.role,
      sessionVersion: schema.users.sessionVersion,
    })
    .from(schema.orgMemberships)
    .innerJoin(schema.users, eq(schema.users.id, schema.orgMemberships.userId))
    .where(and(
      eq(schema.orgMemberships.userId, session.user.id),
      eq(schema.orgMemberships.orgId, orgId),
    ))
    .limit(1);

  if (membership && membership.sessionVersion !== (session.sessionVersion ?? 0)) {
    await clearUserSession(event);
    throw createError({
      statusCode: 401,
      statusMessage: "Your session has expired. Please log in again.",
    });
  }

  if (!membership) {
    // Removed from this org: drop it from the session so the app sends them
    // back to org selection instead of retrying.
    await replaceUserSession(event, { ...session, currentOrg: undefined });
    throw createError({
      statusCode: 403,
      statusMessage: "You no longer have access to this organization",
    });
  }

  // Attach access info for downstream handlers
  event.context.access = {
    userId: session.user.id,
    orgId,
    role: membership.role as "owner" | "staff",
  };

  // Return-visit tracking: one write per user, org and day.
  await recordDailyActivity(event, session, orgId);
});
