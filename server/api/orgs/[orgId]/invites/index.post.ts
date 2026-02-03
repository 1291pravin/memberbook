import { eq, and, gt } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  // Check rate limit: max 10 pending invites
  const now = new Date().toISOString();
  const pendingInvites = await db
    .select()
    .from(schema.orgInvites)
    .where(
      and(
        eq(schema.orgInvites.orgId, access.orgId),
        eq(schema.orgInvites.status, "pending"),
        gt(schema.orgInvites.expiresAt, now)
      )
    );

  if (pendingInvites.length >= 10) {
    throw createError({
      statusCode: 429,
      statusMessage: "Maximum of 10 pending invitations allowed. Please revoke some before creating new ones.",
    });
  }

  // Generate token using Web Crypto API
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Set expiry to 48 hours from now
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Insert invite
  const result = await db
    .insert(schema.orgInvites)
    .values({
      orgId: access.orgId,
      invitedByUserId: access.userId,
      token,
      status: "pending",
      expiresAt,
    })
    .returning();

  const invite = result[0];

  // Get app base URL
  const config = useRuntimeConfig();
  const headers = getRequestHeaders(event);
  const baseUrl = config.public.appUrl || `${headers["x-forwarded-proto"] || "https"}://${headers.host}`;
  const inviteUrl = `${baseUrl}/invite/${token}`;

  await invalidateCache(access.orgId, "invites");

  return {
    id: invite.id,
    token: invite.token,
    expiresAt: invite.expiresAt,
    inviteUrl,
  };
});
