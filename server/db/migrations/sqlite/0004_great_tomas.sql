CREATE TABLE `seat_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`name` text NOT NULL,
	`start_time` text,
	`end_time` text,
	`is_active` integer DEFAULT true NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seat_batches_org_name_unique` ON `seat_batches` (`org_id`,`name`);--> statement-breakpoint
DROP INDEX `member_seat_assignments_member_org_unique`;--> statement-breakpoint
ALTER TABLE `member_seat_assignments` ADD `batch_id` integer REFERENCES seat_batches(id);--> statement-breakpoint
CREATE UNIQUE INDEX `member_seat_assignments_member_org_batch_unique` ON `member_seat_assignments` (`member_id`,`org_id`,`batch_id`);--> statement-breakpoint
ALTER TABLE `check_ins` ADD `batch_id` integer REFERENCES seat_batches(id);--> statement-breakpoint
ALTER TABLE `check_ins` ADD `batch_name` text;--> statement-breakpoint
ALTER TABLE `members` ADD `father_name` text;--> statement-breakpoint
ALTER TABLE `members` ADD `address` text;--> statement-breakpoint
ALTER TABLE `members` ADD `batch` text;