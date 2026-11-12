-- MemberBook's own system user has access to the business's WhatsApp account,
-- so we send with our permanent token instead of the 60-day signup token.
ALTER TABLE `org_whatsapp_accounts` ADD `partner_access` integer NOT NULL DEFAULT 0;
