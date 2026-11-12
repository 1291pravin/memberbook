-- Add-on services: what each business has switched on (and per-business
-- feature flags for add-ons that aren't open to everyone yet), the jobs the
-- delivery routine works through, the business websites we build, and the
-- monthly bills for paid add-ons.
CREATE TABLE IF NOT EXISTS `org_add_ons` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `add_on` text NOT NULL,
  `status` text NOT NULL DEFAULT 'off',
  `admin_enabled` integer NOT NULL DEFAULT 0,
  `price` integer NOT NULL DEFAULT 0,
  `trial_ends_on` text,
  `started_at` text,
  `notify_requested_at` text,
  `cancelled_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `org_add_ons_org_add_on_unique` ON `org_add_ons` (`org_id`, `add_on`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `service_requests` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `type` text NOT NULL,
  `status` text NOT NULL DEFAULT 'new',
  `input` text NOT NULL DEFAULT '{}',
  `result` text,
  `admin_note` text,
  `message` text,
  `requested_by` integer REFERENCES `users`(`id`),
  `claimed_at` text,
  `delivered_at` text,
  `reviewed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `service_requests_status_idx` ON `service_requests` (`status`, `created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `service_requests_org_idx` ON `service_requests` (`org_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `org_websites` (
  `org_id` integer PRIMARY KEY NOT NULL REFERENCES `organizations`(`id`),
  `slug` text NOT NULL,
  `status` text NOT NULL DEFAULT 'draft',
  `details` text NOT NULL DEFAULT '{}',
  `files` text NOT NULL DEFAULT '[]',
  `draft_html` text,
  `draft_approved_at` text,
  `live_html` text,
  `published_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `org_websites_slug_unique` ON `org_websites` (`slug`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `add_on_bills` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `period` text NOT NULL,
  `amount` integer NOT NULL,
  `items` text NOT NULL DEFAULT '[]',
  `status` text NOT NULL DEFAULT 'due',
  `upi_ref` text,
  `claimed_at` text,
  `paid_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `add_on_bills_org_period_unique` ON `add_on_bills` (`org_id`, `period`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `add_on_bills_status_idx` ON `add_on_bills` (`status`);
--> statement-breakpoint
ALTER TABLE `organizations` ADD `check_in_token` text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `organizations_check_in_token_unique` ON `organizations` (`check_in_token`);
--> statement-breakpoint
ALTER TABLE `check_ins` ADD `source` text NOT NULL DEFAULT 'staff';
