import { parseOrgContact } from "../../../utils/org-contact";
import { ORG_TYPES, createOrganization, createOwnerInvite, getSetupUser } from "../../../utils/org-setup";

/**
 * Create a business for an owner who sent us their register, held by the setup
 * account until the owner opens their invite link. Returns that link.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ name?: unknown; type?: unknown; ownerWhatsapp?: unknown; upiId?: unknown }>(event);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const type = typeof body?.type === "string" ? body.type : "";
  if (!name || name.length > 100) {
    throw createError({ statusCode: 400, statusMessage: "Enter the business name" });
  }
  if (!(ORG_TYPES as readonly string[]).includes(type)) {
    throw createError({ statusCode: 400, statusMessage: "Pick a business type" });
  }

  let contact;
  try {
    contact = parseOrgContact(body.ownerWhatsapp, undefined);
  }
  catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message });
  }

  let upiId: string | null = null;
  if (typeof body.upiId === "string" && body.upiId.trim()) {
    upiId = body.upiId.trim();
    if (!UPI_ID_PATTERN.test(upiId)) {
      throw createError({ statusCode: 400, statusMessage: "Enter a valid UPI ID, such as name@okhdfcbank" });
    }
  }

  const setupUser = await getSetupUser();
  const now = new Date().toISOString();
  const org = await createOrganization({
    name,
    type,
    ownerUserId: setupUser.id,
    ownerWhatsapp: contact.ownerWhatsapp,
    // We are already talking to this owner, so keep them off the setup-help alert.
    setupHelpHandledAt: now,
    upiId,
  });
  const invite = await createOwnerInvite(org.id, setupUser.id);

  await recordAdminAuditLog(event, "setup_business_created", { targetOrgId: org.id });

  return { orgId: org.id, inviteUrl: `${appBaseUrl(event)}/invite/${invite.token}` };
});
