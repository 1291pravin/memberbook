-- Once-per-business email when an upload loaded members but most have no due date.
ALTER TABLE `organizations` ADD `due_date_nudge_at` text;
