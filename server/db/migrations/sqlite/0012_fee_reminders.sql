-- Fee collection: the owner's UPI ID for pay links, and opt-in automatic
-- WhatsApp reminders (only used once the WhatsApp Cloud API is configured).
ALTER TABLE organizations ADD COLUMN upi_id TEXT;
--> statement-breakpoint
ALTER TABLE organizations ADD COLUMN upi_payee_name TEXT;
--> statement-breakpoint
ALTER TABLE organizations ADD COLUMN auto_reminders_enabled INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE organizations ADD COLUMN reminder_days_before INTEGER NOT NULL DEFAULT 3;
--> statement-breakpoint
-- One public pay link per subscription and kind ("due" = unpaid balance,
-- "renewal" = the next period). The token is the unguessable part of /pay/<token>.
CREATE TABLE IF NOT EXISTS `payment_links` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `member_id` integer NOT NULL REFERENCES `members`(`id`),
  `subscription_id` integer NOT NULL REFERENCES `member_subscriptions`(`id`),
  `kind` text NOT NULL,
  `amount` integer NOT NULL,
  `token` text NOT NULL,
  `status` text NOT NULL DEFAULT 'open',
  `claimed_at` text,
  `paid_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `payment_links_token_unique` ON `payment_links` (`token`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `payment_links_subscription_kind_unique` ON `payment_links` (`subscription_id`, `kind`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `payment_links_org_idx` ON `payment_links` (`org_id`);
--> statement-breakpoint
-- Every reminder sent, by tap-to-send (whatsapp_link) or the Cloud API (whatsapp_api).
CREATE TABLE IF NOT EXISTS `reminder_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `member_id` integer NOT NULL REFERENCES `members`(`id`),
  `subscription_id` integer NOT NULL REFERENCES `member_subscriptions`(`id`),
  `kind` text NOT NULL,
  `channel` text NOT NULL,
  `status` text NOT NULL,
  `amount` integer NOT NULL,
  `provider_message_id` text,
  `error` text,
  `sent_by` integer REFERENCES `users`(`id`),
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reminder_logs_org_subscription_idx` ON `reminder_logs` (`org_id`, `subscription_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reminder_logs_provider_message_idx` ON `reminder_logs` (`provider_message_id`);
