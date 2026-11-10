-- Performance indexes: nearly every query is scoped by org_id, and the
-- "latest subscription per member" lookups filter by member_id. Without
-- these, every request scanned whole tables across all tenants.
CREATE INDEX IF NOT EXISTS `members_org_created_idx` ON `members` (`org_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `member_subscriptions_org_member_idx` ON `member_subscriptions` (`org_id`,`member_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `member_subscriptions_org_end_date_idx` ON `member_subscriptions` (`org_id`,`end_date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `payments_org_date_idx` ON `payments` (`org_id`,`date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `payments_subscription_idx` ON `payments` (`subscription_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `payments_member_idx` ON `payments` (`member_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `expenses_org_date_idx` ON `expenses` (`org_id`,`date`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `check_ins_org_checked_in_idx` ON `check_ins` (`org_id`,`checked_in_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `check_ins_member_idx` ON `check_ins` (`member_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `inquiries_org_idx` ON `inquiries` (`org_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `subscription_plans_org_idx` ON `subscription_plans` (`org_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `library_seats_org_idx` ON `library_seats` (`org_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `org_memberships_org_idx` ON `org_memberships` (`org_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `users_google_id_idx` ON `users` (`google_id`);
