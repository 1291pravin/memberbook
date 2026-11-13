-- Which number sent each Cloud API reminder: 'memberbook' (shared number, Meta
-- bills us, counts toward the business's monthly allowance) or 'own' (the
-- business's own number, Meta bills them). Null for tap-to-send.
ALTER TABLE `reminder_logs` ADD `via` text;
--> statement-breakpoint
CREATE INDEX `reminder_logs_org_created_idx` ON `reminder_logs` (`org_id`,`created_at`);
