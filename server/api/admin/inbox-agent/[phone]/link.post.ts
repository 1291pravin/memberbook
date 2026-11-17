import { and, eq } from "drizzle-orm";
import { createOwnerInvite, getSetupUser } from "../../../../utils/org-setup";

/** For the AI task: a fresh login link for the business set up in this chat (the old link stops working). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  const conv = await getConversation(phone);
  const orgId = await setupOrgForChat(phone, conv);
  if (!orgId) throw createError({ statusCode: 409, statusMessage: "No business set up in this chat yet. Use /setup first." });

  const setupUser = await getSetupUser();
  const [held] = await db.select({ id: schema.orgMemberships.id }).from(schema.orgMemberships)
    .where(and(eq(schema.orgMemberships.orgId, orgId), eq(schema.orgMemberships.userId, setupUser.id)))
    .limit(1);
  if (!held) {
    throw createError({ statusCode: 409, statusMessage: "The owner has already logged in. Send them https://memberbook.in/login instead." });
  }
  const invite = await createOwnerInvite(orgId, setupUser.id);
  await recordAdminAuditLog(event, "inbox_ai_owner_link", { targetOrgId: orgId, metadata: { phone } });
  return { inviteUrl: `${appBaseUrl(event)}/invite/${invite.token}` };
});
