-- Three plans (Free, Autopilot, Pro) replace the add-ons menu.
-- Autopilot keeps the auto_reminders row; Pro is a new `pro` row.
ALTER TABLE `org_add_ons` ADD `billing_cycle` text DEFAULT 'monthly' NOT NULL;
--> statement-breakpoint
-- Website and review replies are now part of Pro, not billed on their own.
-- Businesses that had either switched on move to a Pro trial that ends when
-- their old free month would have (at least 14 days from today).
INSERT INTO `org_add_ons` (`org_id`, `add_on`, `status`, `price`, `trial_ends_on`, `paid_until`, `started_at`, `created_at`, `updated_at`)
SELECT a.`org_id`, 'pro', 'active', 49900,
  MAX(COALESCE(MAX(a.`trial_ends_on`), date('now', '+330 minutes', '+13 days')), date('now', '+330 minutes', '+13 days')),
  MAX(COALESCE(MAX(a.`trial_ends_on`), date('now', '+330 minutes', '+13 days')), date('now', '+330 minutes', '+13 days')),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `org_add_ons` a
WHERE a.`add_on` IN ('website', 'reviews', 'own_number') AND a.`status` = 'active'
GROUP BY a.`org_id`
ON CONFLICT (`org_id`, `add_on`) DO NOTHING;
--> statement-breakpoint
-- Pro replaces Autopilot for those businesses, so Autopilot stops renewing.
UPDATE `org_add_ons` SET `status` = 'off', `cancelled_at` = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE `add_on` = 'auto_reminders' AND `status` = 'active'
  AND `org_id` IN (SELECT `org_id` FROM `org_add_ons` WHERE `add_on` = 'pro' AND `status` = 'active');
--> statement-breakpoint
DELETE FROM `add_on_bills` WHERE `status` = 'due'
  AND `org_id` IN (SELECT `org_id` FROM `org_add_ons` WHERE `add_on` = 'pro' AND `status` = 'active')
  AND `items` LIKE '%"auto_reminders"%' AND `items` LIKE '%"prepaid":true%';
--> statement-breakpoint
-- Old per-feature prices no longer bill monthly.
UPDATE `org_add_ons` SET `price` = 0 WHERE `add_on` IN ('website', 'reviews', 'own_number', 'front_desk', 'diet_plans', 'telecaller');
