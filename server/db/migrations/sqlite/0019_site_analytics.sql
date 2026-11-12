-- First-party website analytics: one row per page view on the public site.
-- No IP address or user agent is stored, only a random visitor id from a
-- first-party cookie, the traffic source and the Cloudflare city/region.
CREATE TABLE IF NOT EXISTS `site_visits` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `visitor_id` text NOT NULL,
  `day` text NOT NULL,
  `path` text NOT NULL,
  `is_landing` integer DEFAULT 0 NOT NULL,
  `source` text,
  `medium` text,
  `campaign` text,
  `referrer_host` text,
  `country` text,
  `region` text,
  `city` text,
  `device` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `site_visits_day_idx` ON `site_visits` (`day`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `site_visits_visitor_idx` ON `site_visits` (`visitor_id`, `created_at`);
--> statement-breakpoint
-- Where each new account came from (first visit before signup) and where they signed up from.
ALTER TABLE users ADD COLUMN visitor_id TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN signup_source TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN signup_medium TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN signup_campaign TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN signup_landing TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN signup_country TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN signup_region TEXT;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN signup_city TEXT;
