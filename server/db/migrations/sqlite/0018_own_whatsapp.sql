-- A business's own WhatsApp Business account, connected with Meta's embedded
-- signup, so reminders can go out from the business's own number.
CREATE TABLE IF NOT EXISTS `org_whatsapp_accounts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `waba_id` text NOT NULL,
  `phone_number_id` text NOT NULL,
  `display_phone_number` text,
  `verified_name` text,
  `business_app` integer NOT NULL DEFAULT 0,
  `access_token_enc` text,
  `pin_enc` text,
  `status` text NOT NULL DEFAULT 'connected',
  `template_name` text NOT NULL DEFAULT 'fee_reminder',
  `template_language` text NOT NULL DEFAULT 'en',
  `template_status` text,
  `last_error` text,
  `connected_by` integer REFERENCES `users`(`id`),
  `connected_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `org_whatsapp_accounts_org_unique` ON `org_whatsapp_accounts` (`org_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `org_whatsapp_accounts_phone_idx` ON `org_whatsapp_accounts` (`phone_number_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `org_whatsapp_accounts_waba_idx` ON `org_whatsapp_accounts` (`waba_id`);
