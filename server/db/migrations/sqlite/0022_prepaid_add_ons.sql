-- Prepaid add-ons (automatic WhatsApp reminders): paid up to and including
-- this IST date. Set when the admin verifies the UPI payment. Null = unpaid.
ALTER TABLE `org_add_ons` ADD `paid_until` text;
