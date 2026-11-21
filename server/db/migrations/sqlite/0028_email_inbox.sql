-- Emails sent to support@memberbook.in, answered by the AI like WhatsApp (server/utils/email-inbox.ts).
-- One thread per sender address.
CREATE TABLE `email_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`name` text,
	`subject` text,
	`mode` text DEFAULT 'auto' NOT NULL,
	`handoff_reason` text,
	`handoff_at` text,
	`notes` text,
	`claimed_at` text,
	`alerted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_threads_address_unique` ON `email_threads` (`address`);
--> statement-breakpoint
CREATE TABLE `email_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` integer NOT NULL REFERENCES `email_threads`(`id`),
	`direction` text NOT NULL,
	`message_id` text,
	`references_header` text,
	`subject` text,
	`body` text NOT NULL,
	`attachments` text,
	`status` text NOT NULL,
	`error` text,
	`sent_by` text,
	`read_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `email_messages_thread_idx` ON `email_messages` (`thread_id`, `id`);
--> statement-breakpoint
CREATE INDEX `email_messages_message_id_idx` ON `email_messages` (`message_id`);
