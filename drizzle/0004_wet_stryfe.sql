ALTER TABLE `programs` ADD `created_at` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `programs` SET `created_at` = unixepoch() WHERE `created_at` = 0;