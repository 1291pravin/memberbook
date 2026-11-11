-- When the MemberBook team marked an owner's WhatsApp setup-help request as handled.
-- NULL with setup_help_consent_at set = a new request the admin page alerts on.
ALTER TABLE organizations ADD COLUMN setup_help_handled_at TEXT;
--> statement-breakpoint
-- Last time the user used the app (written at most once per user per day).
ALTER TABLE users ADD COLUMN last_seen_at TEXT;
--> statement-breakpoint
-- One row per user, org and IST day the user opened the app. Lets us see who
-- comes back after their first day.
CREATE TABLE IF NOT EXISTS `user_activity_days` (
  `user_id` integer NOT NULL REFERENCES `users`(`id`),
  `org_id` integer NOT NULL REFERENCES `organizations`(`id`),
  `day` text NOT NULL,
  `created_at` text NOT NULL,
  PRIMARY KEY (`user_id`, `org_id`, `day`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_activity_days_org_idx` ON `user_activity_days` (`org_id`, `day`);
