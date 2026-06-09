ALTER TABLE `sessions` ADD `source` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `source_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_source_id` ON `sessions` (`source`,`source_id`);