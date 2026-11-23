-- Google review poster (reviews add-on): the owner's review link, a public short
-- link /r/<token> printed as the poster QR, and a count of scans.
ALTER TABLE `organizations` ADD `google_review_url` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD `review_token` text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `organizations_review_token_unique` ON `organizations` (`review_token`);
--> statement-breakpoint
CREATE TABLE `review_link_scans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`source` text DEFAULT 'qr' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `review_link_scans_org_created_idx` ON `review_link_scans` (`org_id`,`created_at`);
