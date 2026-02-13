CREATE TABLE `library_seats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`seat_number` text NOT NULL,
	`seat_label` text,
	`time_preference` text,
	`gender_preference` text,
	`is_active` integer DEFAULT true NOT NULL,
	`display_order` integer NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member_seat_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`seat_id` integer NOT NULL,
	`assigned_at` text NOT NULL,
	`assigned_by` integer NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`seat_id`) REFERENCES `library_seats`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_seat_assignments_member_org_unique` ON `member_seat_assignments` (`member_id`,`org_id`);--> statement-breakpoint
ALTER TABLE `check_ins` ADD `seat_id` integer REFERENCES library_seats(id);--> statement-breakpoint
ALTER TABLE `check_ins` ADD `seat_number` text;--> statement-breakpoint
ALTER TABLE `members` ADD `gender` text;