import { ORG_TYPES, createOrganization, createOwnerInvite, getSetupUser } from "../../../../utils/org-setup";

/**
 * For the AI task: create the business for an owner who is setting up over
 * WhatsApp, held by the setup account until they open their login link. One
 * business per chat.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const body = await readBody<{ name?: unknown; type?: unknown }>(event).catch(() => ({} as { name?: unknown; type?: unknown }));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });

  const name = typeof body?.name === "string" ? body.name.replace(/\s+/g, " ").trim() : "";
  const type = typeof body?.type === "string" ? body.type : "";
  if (!name || name.length > 100) throw createError({ statusCode: 400, statusMessage: "Give the business name (under 100 characters)" });
  if (!(ORG_TYPES as readonly string[]).includes(type)) throw createError({ statusCode: 400, statusMessage: `type must be one of ${ORG_TYPES.join(", ")}` });

  const conv = await getConversation(phone);
  if (conv.mode === "human") throw createError({ statusCode: 409, statusMessage: "This chat is with the admin now" });
  const existing = await setupOrgForChat(phone, conv);
  if (existing) throw createError({ statusCode: 409, statusMessage: `This chat already has business #${existing}. Use it: /load for their files, /link for a login link.` });
  const times = await chatTimes(phone);
  if (!times.lastInAt) throw createError({ statusCode: 404, statusMessage: "No chat with this number" });

  const setupUser = await getSetupUser();
  const org = await createOrganization({
    name,
    type,
    ownerUserId: setupUser.id,
    ownerWhatsapp: `+${phone}`,
    setupHelpHandledAt: new Date().toISOString(),
    upiId: null,
  });
  const invite = await createOwnerInvite(org.id, setupUser.id);
  await updateConversation(phone, { orgId: org.id });
  await addInboxNote(phone, `AI set up the business "${name}" (${type}), #${org.id}`, "ai");
  await recordAdminAuditLog(event, "inbox_ai_business_created", { targetOrgId: org.id, metadata: { phone } });

  return { orgId: org.id, inviteUrl: `${appBaseUrl(event)}/invite/${invite.token}` };
});
