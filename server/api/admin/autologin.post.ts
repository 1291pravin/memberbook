import { eq } from "drizzle-orm";

type AutologinBody = {
  email?: string;
  userId?: number | string;
  orgId?: number | string;
};

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);

  const body = await readBody<AutologinBody>(event);
  const targetUserId = body.userId ? Number(body.userId) : null;
  const targetEmail = body.email?.toLowerCase().trim();
  const requestedOrgId = body.orgId ? Number(body.orgId) : null;

  if (!targetUserId && !targetEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "Provide userId or email",
    });
  }

  if (body.userId && !Number.isInteger(targetUserId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid userId",
    });
  }

  if (body.orgId && !Number.isInteger(requestedOrgId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid orgId",
    });
  }

  const userRows = targetUserId
    ? await db.select().from(schema.users).where(eq(schema.users.id, targetUserId)).limit(1)
    : await db.select().from(schema.users).where(eq(schema.users.email, targetEmail!)).limit(1);

  const user = userRows[0];
  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  const orgs = await getUserOrgs(user.id);
  const currentOrg = requestedOrgId
    ? orgs.find((org) => org.orgId === requestedOrgId)
    : orgs[0];

  if (requestedOrgId && !currentOrg) {
    throw createError({
      statusCode: 403,
      statusMessage: "User does not belong to the requested organization",
    });
  }

  const existingSession = await getUserSession(event);
  const admin = existingSession.admin?.authenticated ? existingSession.admin : undefined;

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name },
    currentOrg,
    admin,
  });

  await recordAdminAuditLog(event, "autologin", {
    targetUserId: user.id,
    targetOrgId: currentOrg?.orgId ?? null,
    metadata: {
      requestedBy: targetEmail ? "email" : "userId",
      requestedOrgId,
    },
  });

  return {
    user: { id: user.id, email: user.email, name: user.name },
    currentOrg,
    redirectTo: currentOrg ? "/dashboard" : "/onboarding",
  };
});
