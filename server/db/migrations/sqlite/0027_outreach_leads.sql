-- Cold email outreach to gyms, libraries and coaching centres (server/utils/outreach.ts).
-- Sent from support@memberbook.in through Resend: one first email, one follow-up, then stop.
CREATE TABLE `outreach_leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`business_name` text NOT NULL,
	`contact_name` text,
	`business_type` text,
	`city` text,
	`source_url` text,
	`status` text DEFAULT 'new' NOT NULL,
	`token` text NOT NULL,
	`sent_at` text,
	`followed_up_at` text,
	`last_error` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outreach_leads_email_unique` ON `outreach_leads` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `outreach_leads_token_unique` ON `outreach_leads` (`token`);
--> statement-breakpoint
CREATE INDEX `outreach_leads_status_idx` ON `outreach_leads` (`status`);
