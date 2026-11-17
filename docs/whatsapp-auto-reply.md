# WhatsApp auto-reply (AI answers the MemberBook number)

Messages to MemberBook's WhatsApp number (+91 91378 49812) are answered by AI. Pravin only hears about the ones the AI can't or shouldn't handle.

## Flow

1. `POST /api/webhooks/whatsapp` saves the message (and any photo/file). If auto-reply is on and the chat isn't handed over or paused, it starts the AI task (`wakeInboxAgent`). Clear refunds, fraud claims, complaints, legal threats and payment problems (`sensitiveReason`) skip the AI: the chat is handed to Pravin with an email and a short holding reply.
2. The AI task is the claude.ai scheduled task "MemberBook: deliver add-on services" (`trig_01PuQM49Eco6HLaXMiExcEkR`, fired with `NUXT_AI_RUNS_SERVICES_TOKEN`). Its prompt checks the inbox first: `GET /api/admin/inbox-agent` returns the waiting chats **and the playbook** (`server/utils/inbox-agent-playbook.ts`). Change how the AI answers by editing the playbook, not the task prompt.
3. Per chat the AI calls `/api/admin/inbox-agent/<phone>/…`: `claim`, `GET` (messages, notes, who they are), then `reply`, `handoff` or `skip`, plus `notes`, `setup` (create their business), `load` (send their register files to the loader), `link` (fresh login link) and `files/<messageId>`.
4. `inbox:check` (every 10 minutes, zero tokens) re-fires the task if a message waits over 4 minutes and emails Pravin once if one waits over 30 minutes.

## Rules the server enforces (server/utils/inbox-agent.ts)

- Replies only inside the 24-hour window (minus 5 minutes), only to the newest unanswered message (`inReplyTo`), at most 3 per turn and 10 an hour per chat.
- No reply after a hand-over (mode `human`) or within 6 hours of Pravin's own reply in that chat.
- Links only to memberbook.in, phone numbers only MemberBook's, the contact's own, or (for gym members) their business owner's; nothing that looks like a token.

## Admin (/admin/inbox)

- "AI replies on/off" switch for the whole inbox (`app_settings.inbox_auto_reply`, on by default). Off = old behaviour: an email for every message.
- Per chat: "I'll reply" (take over) and "Let AI reply" (hand back; also lifts the 6-hour pause). AI messages carry an **AI** tag, automatic holding replies an **Auto** tag, and hand-overs/skips/setup steps show as grey log lines. "AI notes" shows what the AI remembers about the contact.
