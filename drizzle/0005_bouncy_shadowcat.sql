PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`active_day_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_programs`("id", "name", "active_day_index", "created_at") SELECT "id", "name", "active_day_index", "created_at" FROM `programs`;--> statement-breakpoint
DROP TABLE `programs`;--> statement-breakpoint
ALTER TABLE `__new_programs` RENAME TO `programs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;