export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname;

  // Only intercept org-scoped API routes
  if (!path.startsWith("/api/orgs/") || path === "/api/orgs/") {
    return;
  }

  // Parse orgId from /api/orgs/{orgId}/...
  const segments = path.split("/");
  const orgIdStr = segments[3];
  if (!orgIdStr) {
    return;
  }

  const orgId = Number(orgIdStr);
  if (!Number.isInteger(orgId)) {
    return;
  }

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

  // Attach access info for downstream handlers
  event.context.access = {
    userId: session.user.id,
    orgId: currentOrg.orgId,
    role: currentOrg.role as "owner" | "staff",
  };
});
