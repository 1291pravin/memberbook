import { eq, desc, inArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  // Get all invites with invitedBy user info
  const invites = await db
    .select({
      id: schema.orgInvites.id,
      token: schema.orgInvites.token,
      status: schema.orgInvites.status,
      expiresAt: schema.orgInvites.expiresAt,
      createdAt: schema.orgInvites.createdAt,
      acceptedAt: schema.orgInvites.acceptedAt,
      revokedAt: schema.orgInvites.revokedAt,
      invitedByName: schema.users.name,
      invitedByEmail: schema.users.email,
      acceptedByUserId: schema.orgInvites.acceptedByUserId,
      revokedByUserId: schema.orgInvites.revokedByUserId,
    })
    .from(schema.orgInvites)
    .innerJoin(schema.users, eq(schema.orgInvites.invitedByUserId, schema.users.id))
    .where(eq(schema.orgInvites.orgId, access.orgId))
    .orderBy(desc(schema.orgInvites.createdAt));

  // Collect all unique user IDs that need to be fetched
  const userIds: number[] = [];
  for (const invite of invites) {
    if (invite.acceptedByUserId && !userIds.includes(invite.acceptedByUserId)) {
      userIds.push(invite.acceptedByUserId);
    }
    if (invite.revokedByUserId && !userIds.includes(invite.revokedByUserId)) {
      userIds.push(invite.revokedByUserId);
    }
  }

  // Batch fetch all users at once
  const usersMap = new Map<number, { name: string; email: string }>();
  if (userIds.length > 0) {
    const users = await db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(inArray(schema.users.id, userIds));

    for (const user of users) {
      usersMap.set(user.id, { name: user.name, email: user.email });
    }
  }

  // Map invites with user data
  const invitesWithUsers = invites.map((invite) => ({
    id: invite.id,
    token: invite.token,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    acceptedAt: invite.acceptedAt,
    revokedAt: invite.revokedAt,
    invitedBy: {
      name: invite.invitedByName,
      email: invite.invitedByEmail,
    },
    acceptedBy: invite.acceptedByUserId ? usersMap.get(invite.acceptedByUserId) || null : null,
    revokedBy: invite.revokedByUserId ? usersMap.get(invite.revokedByUserId) || null : null,
  }));

  return { invites: invitesWithUsers };
});
