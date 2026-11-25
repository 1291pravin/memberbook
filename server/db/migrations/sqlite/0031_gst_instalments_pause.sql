-- GST tax invoices, instalment plans and pausing a membership.
ALTER TABLE `organizations` ADD `gstin` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD `gst_rate` integer DEFAULT 18 NOT NULL;
--> statement-breakpoint
ALTER TABLE `organizations` ADD `gst_address` text;
--> statement-breakpoint
ALTER TABLE `member_subscriptions` ADD `pause_start` text;
--> statement-breakpoint
ALTER TABLE `member_subscriptions` ADD `pause_end` text;
--> statement-breakpoint
CREATE TABLE `subscription_instalments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`subscription_id` integer NOT NULL,
	`due_date` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `member_subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subscription_instalments_sub_idx` ON `subscription_instalments` (`org_id`,`subscription_id`);
