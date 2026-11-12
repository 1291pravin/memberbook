import { and, eq } from "drizzle-orm";
import { createOwnerInvite, getSetupUser } from "../../../../utils/org-setup";

/** Make a fresh owner invite link for a business we set up (the old one stops working). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const orgId = Number(getRouterParam(event, "orgId"));
  if (!Number.isInteger(orgId)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid business" });
  }

  const setupUser = await getSetupUser();
  const [held] = await db.select({ id: schema.orgMemberships.id })
    .from(schema.orgMemberships)
    .where(and(eq(schema.orgMemberships.orgId, orgId), eq(schema.orgMemberships.userId, setupUser.id)))
    .limit(1);
  if (!held) {
    throw createError({ statusCode: 409, statusMessage: "The owner has already taken over this business" });
  }

  const invite = await createOwnerInvite(orgId, setupUser.id);
  await recordAdminAuditLog(event, "setup_owner_link_created", { targetOrgId: orgId });
  return { inviteUrl: `${appBaseUrl(event)}/invite/${invite.token}` };
});
