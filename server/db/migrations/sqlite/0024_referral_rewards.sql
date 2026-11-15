-- Referral rewards: a business that brings in another business (signed up from
-- its referral link and loaded members) gets a free month of automatic reminders.
-- One row per referred business, so a reward is only ever given once.
CREATE TABLE `referral_rewards` (
	`referred_org_id` integer PRIMARY KEY NOT NULL REFERENCES `organizations`(`id`),
	`referrer_org_id` integer NOT NULL REFERENCES `organizations`(`id`),
	`days` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `referral_rewards_referrer_idx` ON `referral_rewards` (`referrer_org_id`);
