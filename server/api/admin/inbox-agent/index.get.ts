import { INBOX_PLAYBOOK } from "../../../utils/inbox-agent-playbook";

/**
 * For the AI task: is auto-reply on, which WhatsApp chats wait for a reply,
 * and the playbook for answering them (server/utils/inbox-agent.ts).
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  setHeader(event, "Cache-Control", "no-store");
  await releaseStaleInboxClaims();
  const enabled = await isAutoReplyOn();
  const waiting = enabled ? await listWaitingChats() : [];
  return {
    enabled,
    canSend: canSendWhatsAppCloud(),
    now: new Date().toISOString(),
    waiting: waiting.map(w => ({ phone: w.phone, name: w.name, lastInAt: w.lastInAt, claimedByAnotherRun: w.claimed })),
    playbook: INBOX_PLAYBOOK,
  };
});
