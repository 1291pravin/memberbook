-- Online payments that confirm themselves: the owner connects their own Razorpay account.
ALTER TABLE `organizations` ADD `razorpay_key_id` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD `razorpay_key_secret_enc` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD `razorpay_webhook_secret_enc` text;
--> statement-breakpoint
ALTER TABLE `organizations` ADD `razorpay_connected_at` text;
--> statement-breakpoint
ALTER TABLE `payments` ADD `external_ref` text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `payments_external_ref_unique` ON `payments` (`external_ref`);
