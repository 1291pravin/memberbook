CREATE TABLE `onboarding_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`org_id` integer NOT NULL,
	`org_setup_completed` integer DEFAULT true NOT NULL,
	`staff_onboarding_completed` integer DEFAULT false NOT NULL,
	`plans_setup_completed` integer DEFAULT false NOT NULL,
	`business_setup_completed` integer DEFAULT false NOT NULL,
	`dashboard_tour_completed` integer DEFAULT false NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `onboarding_progress_org_unique` ON `onboarding_progress` (`org_id`);--> statement-breakpoint
-- Backfill for existing organizations (auto-detect completed steps)
INSERT INTO onboarding_progress (
  org_id,
  org_setup_completed,
  staff_onboarding_completed,
  plans_setup_completed,
  business_setup_completed,
  dashboard_tour_completed,
  created_at,
  updated_at
)
SELECT
  o.id,
  1,
  CASE WHEN EXISTS (SELECT 1 FROM org_invites WHERE org_id = o.id) THEN 1 ELSE 0 END,
  CASE WHEN EXISTS (SELECT 1 FROM subscription_plans WHERE org_id = o.id) THEN 1 ELSE 0 END,
  CASE WHEN o.type != 'library' OR EXISTS (SELECT 1 FROM library_seats WHERE org_id = o.id) THEN 1 ELSE 0 END,
  1,
  o.created_at,
  o.created_at
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM onboarding_progress WHERE org_id = o.id);
