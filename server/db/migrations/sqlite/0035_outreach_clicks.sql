-- Per-lead click tracking for cold email: each email link carries ?mb_lead=<id>.
-- Visits within 2 minutes of a send are counted as link scanners, not people.
ALTER TABLE `outreach_leads` ADD `clicked_at` text;
--> statement-breakpoint
ALTER TABLE `outreach_leads` ADD `click_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `outreach_leads` ADD `scanner_hits` integer DEFAULT 0 NOT NULL;
