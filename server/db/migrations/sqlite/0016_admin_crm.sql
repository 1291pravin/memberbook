-- Admin CRM: where each business stands with us, the next follow-up, and notes.
-- One row per business we track (created on first save from the admin panel).
CREATE TABLE IF NOT EXISTS `admin_org_crm` (
  `org_id` integer PRIMARY KEY NOT NULL REFERENCES `organizations`(`id`),
  `stage` text,
  `follow_up_on` text,
  `follow_up_reason` text,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `admin_org_crm_follow_up_idx` ON `admin_org_crm` (`follow_up_on`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `admin_org_notes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `body` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `admin_org_notes_org_idx` ON `admin_org_notes` (`org_id`, `created_at`);
