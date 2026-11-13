-- PDF receipts: a per-business receipt number and a public link token
-- (/receipt/<token>), both given out the first time a receipt is needed.
ALTER TABLE `payments` ADD `receipt_no` integer;
--> statement-breakpoint
ALTER TABLE `payments` ADD `receipt_token` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_receipt_token_unique` ON `payments` (`receipt_token`);
--> statement-breakpoint
-- Owner's switch: send a WhatsApp thank-you with the PDF receipt when a payment is recorded.
ALTER TABLE `organizations` ADD `thank_you_receipts` integer NOT NULL DEFAULT 0;
