import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token is required",
    });
  }

  // Look up invite
  const invites = await db
    .select({
      id: schema.orgInvites.id,
      orgId: schema.orgInvites.orgId,
      status: schema.orgInvites.status,
      expiresAt: schema.orgInvites.expiresAt,
      orgName: schema.organizations.name,
      orgType: schema.organizations.type,
    })
    .from(schema.orgInvites)
    .innerJoin(
      schema.organizations,
      eq(schema.orgInvites.orgId, schema.organizations.id)
    )
    .where(eq(schema.orgInvites.token, token))
    .limit(1);

  if (!invites[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Invitation not found",
    });
  }

  const invite = invites[0];

  // Check if expired
  if (invite.status === "pending" && new Date(invite.expiresAt) <= new Date()) {
    return {
      valid: false,
      status: "expired",
    };
  }

  // Check status
  if (invite.status === "revoked") {
    return {
      valid: false,
      status: "revoked",
    };
  }

  if (invite.status === "accepted") {
    return {
      valid: false,
      status: "accepted",
    };
  }

  if (invite.status === "pending") {
    return {
      valid: true,
      status: "valid",
      orgName: invite.orgName,
      orgType: invite.orgType,
    };
  }

  return {
    valid: false,
    status: "unknown",
  };
});
