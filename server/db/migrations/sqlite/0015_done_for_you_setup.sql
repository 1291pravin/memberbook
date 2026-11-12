-- Done-for-you setup.
-- Owner invites: a business set up for its owner from admin is handed over with an owner-role invite link.
ALTER TABLE `org_invites` ADD `role` text DEFAULT 'staff' NOT NULL;
--> statement-breakpoint
-- Data the owner sends us once (files and/or pasted text). The AI loading routine
-- picks up pending uploads, loads plans and members, and records the result.
CREATE TABLE IF NOT EXISTS `data_uploads` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `uploaded_by` integer REFERENCES `users`(`id`),
  `source` text DEFAULT 'owner' NOT NULL,
  `files` text DEFAULT '[]' NOT NULL,
  `text` text,
  `note` text,
  `status` text DEFAULT 'pending' NOT NULL,
  `result` text,
  `message` text,
  `claimed_at` text,
  `processed_at` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `data_uploads_status_idx` ON `data_uploads` (`status`, `created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `data_uploads_org_idx` ON `data_uploads` (`org_id`, `created_at`);
