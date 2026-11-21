import { INBOX_PLAYBOOK } from "../../../utils/inbox-agent-playbook";

/**
 * For the AI task: is auto-reply on, which WhatsApp chats and emails wait for a reply,
 * and the playbook for answering them (server/utils/inbox-agent.ts).
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  setHeader(event, "Cache-Control", "no-store");
  await releaseStaleInboxClaims();
  await releaseStaleEmailClaims();
  const enabled = await isAutoReplyOn();
  const waiting = enabled ? await listWaitingChats() : [];
  const emails = enabled ? await listWaitingEmails() : [];
  return {
    enabled,
    canSend: canSendWhatsAppCloud(),
    runner: await getInboxRunner(),
    now: new Date().toISOString(),
    waiting: waiting.map(w => ({ phone: w.phone, name: w.name, lastInAt: w.lastInAt, claimedByAnotherRun: w.claimed })),
    // Emails to support@memberbook.in waiting for a reply (see "Answering email" in the playbook).
    emails: emails.map(e => ({ id: e.id, from: e.address, name: e.name, subject: e.subject, lastInAt: e.lastInAt, claimedByAnotherRun: e.claimed })),
    playbook: INBOX_PLAYBOOK,
  };
});
