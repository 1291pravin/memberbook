import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const token = getRouterParam(event, "token");

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token is required",
    });
  }

  // First, fetch the invite to get orgId and check expiry
  const [invite] = await db
    .select()
    .from(schema.orgInvites)
    .where(eq(schema.orgInvites.token, token));

  if (!invite) {
    throw createError({
      statusCode: 404,
      statusMessage: "Invitation not found",
    });
  }

  const now = new Date().toISOString();
  if (new Date(invite.expiresAt) <= new Date()) {
    throw createError({
      statusCode: 410,
      statusMessage: "This invitation has expired",
    });
  }

  // Check if user already a member
  const [existing] = await db
    .select()
    .from(schema.orgMemberships)
    .where(
      and(
        eq(schema.orgMemberships.userId, user.id),
        eq(schema.orgMemberships.orgId, invite.orgId)
      )
    );

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "You are already a member of this organization",
    });
  }

  // Atomically claim the invite - only succeeds if still pending
  const updated = await db
    .update(schema.orgInvites)
    .set({
      status: "accepted",
      acceptedByUserId: user.id,
      acceptedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.orgInvites.id, invite.id),
        eq(schema.orgInvites.status, "pending")
      )
    )
    .returning();

  if (!updated.length) {
    throw createError({
      statusCode: 409,
      statusMessage: "This invitation has already been used or revoked",
    });
  }

  // Now safe to insert membership
  await db.insert(schema.orgMemberships).values({
    userId: user.id,
    orgId: invite.orgId,
    role: "staff",
  });

  // Get org details
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, invite.orgId));

  if (!org) {
    throw createError({
      statusCode: 500,
      statusMessage: "Organization not found",
    });
  }

  // Update user session with the new org
  const orgs = await getUserOrgs(user.id);
  const currentOrg = orgs.find(o => o.orgId === invite.orgId);

  if (!currentOrg) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to set organization context after joining",
    });
  }

  const session = await getUserSession(event);
  await replaceUserSession(event, {
    ...session,
    currentOrg,
  });

  await invalidateCache(invite.orgId);

  return {
    success: true,
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      role: "staff",
    },
  };
});
