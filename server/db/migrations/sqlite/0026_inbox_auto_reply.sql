-- AI auto-replies for the MemberBook WhatsApp inbox (server/utils/inbox-agent.ts).
-- Who sent an outgoing message or wrote a log note: admin, ai or system.
-- Old outgoing rows stay NULL and count as the admin's.
ALTER TABLE `whatsapp_messages` ADD `sent_by` text;
--> statement-breakpoint
-- One row per WhatsApp contact: whether the AI may answer, why it handed over, and its notes.
CREATE TABLE `whatsapp_conversations` (
	`phone` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'auto' NOT NULL,
	`handoff_reason` text,
	`handoff_at` text,
	`org_id` integer REFERENCES `organizations`(`id`),
	`notes` text,
	`claimed_at` text,
	`alerted_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
-- Small app-wide switches, e.g. inbox_auto_reply = on/off.
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
