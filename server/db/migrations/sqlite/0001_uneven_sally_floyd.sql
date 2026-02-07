CREATE TABLE `check_ins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`checked_in_by` integer NOT NULL,
	`checked_in_at` text NOT NULL,
	`checked_out_at` text,
	`checked_out_by` integer,
	`duration_minutes` integer,
	`auto_checked_out` integer DEFAULT false NOT NULL,
	`subscription_status` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checked_in_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checked_out_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
