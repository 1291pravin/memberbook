-- Birthday wishes and "we miss you" messages, part of automatic reminders.
ALTER TABLE `organizations` ADD `birthday_wishes` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `organizations` ADD `miss_you_messages` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `members` ADD `birth_date` text;
