CREATE TABLE `admin_audit_logs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `action` text NOT NULL,
  `target_user_id` integer,
  `target_org_id` integer,
  `ip_address` text,
  `user_agent` text,
  `metadata` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`target_org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_action_idx` ON `admin_audit_logs` (`action`);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_target_user_idx` ON `admin_audit_logs` (`target_user_id`);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_target_org_idx` ON `admin_audit_logs` (`target_org_id`);
--> statement-breakpoint
CREATE INDEX `admin_audit_logs_created_at_idx` ON `admin_audit_logs` (`created_at`);
