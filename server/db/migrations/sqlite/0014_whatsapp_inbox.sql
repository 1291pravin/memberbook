-- WhatsApp Cloud API inbox: messages to and from MemberBook's business number.
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `wa_message_id` text,
  `direction` text NOT NULL,
  `phone` text NOT NULL,
  `contact_name` text,
  `type` text NOT NULL,
  `body` text NOT NULL,
  `status` text NOT NULL,
  `error` text,
  `read_at` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `whatsapp_messages_wa_id_unique` ON `whatsapp_messages` (`wa_message_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `whatsapp_messages_phone_idx` ON `whatsapp_messages` (`phone`, `created_at`);
