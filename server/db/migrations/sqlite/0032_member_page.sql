-- Public member page /m/<token>: plan, due date, pay button, receipts, streak.
ALTER TABLE `members` ADD `portal_token` text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `members_portal_token_unique` ON `members` (`portal_token`);
