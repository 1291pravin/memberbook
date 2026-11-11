-- Bumping a user's session_version invalidates every session issued before it
-- (used when a Google sign-in takes over an unverified password account).
ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
-- Fixed-window counters for rate limiting login, admin login, sign-up and the contact form.
CREATE TABLE IF NOT EXISTS `auth_rate_limits` (
  `key` text PRIMARY KEY NOT NULL,
  `window_start` integer NOT NULL,
  `count` integer NOT NULL DEFAULT 0
);
